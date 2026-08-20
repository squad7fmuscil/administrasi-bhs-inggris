// src/system/checkers/BusinessLogicChecker.js
import { supabase } from "../../supabaseClient";

/**
 * BusinessLogicChecker - Comprehensive business logic validation
 * Checks: Academic Rules, Scheduling Conflicts, Capacity Limits, Business Constraints
 */

export const checkBusinessLogic = async () => {
  console.log("🔍 BusinessLogicChecker: Starting comprehensive check...");

  const issues = [];
  const startTime = Date.now();

  try {
    // Run all independent checks in parallel instead of sequentially
    console.log("📚 Running business logic checks in parallel...");
    const [
      academicYearIssues,
      attendanceIssues,
      gradeIssues,
      classIssues,
      scheduleIssues,
      assignmentIssues,
      studentStatusIssues,
    ] = await Promise.all([
      checkAcademicYearRules(),
      checkAttendanceLogic(),
      checkGradeLogic(),
      checkClassLogic(),
      checkTeacherScheduleConflicts(),
      checkTeacherAssignmentLogic(),
      checkStudentStatusLogic(),
    ]);

    issues.push(
      ...academicYearIssues,
      ...attendanceIssues,
      ...gradeIssues,
      ...classIssues,
      ...scheduleIssues,
      ...assignmentIssues,
      ...studentStatusIssues,
    );

    const executionTime = Date.now() - startTime;
    console.log(`✅ BusinessLogicChecker completed in ${executionTime}ms`);
    console.log(`📊 Found ${issues.length} business logic issues`);

    return {
      success: true,
      issues,
      executionTime,
    };
  } catch (error) {
    console.error("❌ BusinessLogicChecker error:", error);
    return {
      success: false,
      issues: [
        {
          category: "business_logic",
          severity: "critical",
          message: "Business logic checker failed",
          details: error.message,
          table: "system",
        },
      ],
      executionTime: Date.now() - startTime,
    };
  }
};

/**
 * Check Academic Year Business Rules
 */
const checkAcademicYearRules = async () => {
  const issues = [];

  try {
    // 1. Multiple active academic years (CRITICAL!) + 2. Date overlap check — independent queries
    const [{ data: activeYears }, { data: allYears }] = await Promise.all([
      supabase
        .from("academic_years")
        .select("id, year, semester, start_date, end_date")
        .eq("is_active", true),
      supabase
        .from("academic_years")
        .select("id, year, semester, start_date, end_date")
        .not("start_date", "is", null)
        .not("end_date", "is", null)
        .order("start_date", { ascending: true }),
    ]);

    if (activeYears && activeYears.length > 1) {
      issues.push({
        category: "business_logic",
        severity: "critical",
        message: "Multiple active academic years detected",
        details: `Found ${activeYears.length} active academic years: ${activeYears
          .map((y) => `${y.year}-${y.semester}`)
          .join(", ")}. Only ONE should be active!`,
        table: "academic_years",
      });
    }

    if (!activeYears || activeYears.length === 0) {
      issues.push({
        category: "business_logic",
        severity: "critical",
        message: "No active academic year",
        details:
          "System requires exactly one active academic year for proper operation",
        table: "academic_years",
      });
    }

    if (allYears && allYears.length > 1) {
      for (let i = 0; i < allYears.length - 1; i++) {
        const current = allYears[i];
        const next = allYears[i + 1];

        if (new Date(current.end_date) > new Date(next.start_date)) {
          issues.push({
            category: "business_logic",
            severity: "warning",
            message: "Academic year date overlap detected",
            details: `${current.year}-${current.semester} ends after ${next.year}-${next.semester} starts`,
            table: "academic_years",
          });
        }
      }
    }

    // 3. Active academic year in the past
    if (activeYears && activeYears.length === 1) {
      const active = activeYears[0];
      const today = new Date().toISOString().split("T")[0];

      if (active.end_date && active.end_date < today) {
        const daysPast = Math.floor(
          (new Date(today) - new Date(active.end_date)) / (1000 * 60 * 60 * 24),
        );
        issues.push({
          category: "business_logic",
          severity: "warning",
          message: "Active academic year has ended",
          details: `Academic year ${active.year}-${active.semester} ended ${daysPast} days ago. Consider updating to new academic year.`,
          table: "academic_years",
        });
      }
    }
  } catch (error) {
    console.error("Error checking academic year rules:", error);
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Could not complete academic year rules check",
      details: error.message,
      table: "academic_years",
    });
  }

  return issues;
};

/**
 * Check Attendance Business Logic
 */
const checkAttendanceLogic = async () => {
  const issues = [];

  try {
    const today = new Date().toISOString().split("T")[0];
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // 1-3. All independent — run in parallel
    const [
      { data: futureAttendance, count: futureCount },
      { data: recentAttendance },
      { data: inactiveAttendance },
    ] = await Promise.all([
      supabase
        .from("attendance")
        .select("id, date, student_id", { count: "exact" })
        .gt("date", today)
        .limit(50),
      supabase
        .from("attendance")
        .select("student_id, date, subject, class_id")
        .gte("date", ninetyDaysAgo)
        .limit(1000),
      supabase
        .from("attendance")
        .select(
          `
        id,
        date,
        students!inner(is_active, full_name)
      `,
        )
        .gte("date", thirtyDaysAgo)
        .eq("students.is_active", false)
        .limit(50),
    ]);

    if (futureCount > 0) {
      issues.push({
        category: "business_logic",
        severity: "warning",
        message: "Attendance recorded for future dates",
        details: `Found ${futureCount} attendance records with dates in the future - this violates business logic`,
        table: "attendance",
      });
    }

    // 2. Multiple attendance same student same day same subject
    if (recentAttendance) {
      const attendanceMap = new Map();
      recentAttendance.forEach((att) => {
        const key = `${att.student_id}-${att.date}-${att.subject}`;
        attendanceMap.set(key, (attendanceMap.get(key) || 0) + 1);
      });

      const duplicates = Array.from(attendanceMap.values()).filter(
        (count) => count > 1,
      ).length;
      if (duplicates > 0) {
        issues.push({
          category: "business_logic",
          severity: "warning",
          message: "Duplicate attendance entries detected",
          details: `Found ${duplicates} cases where same student has multiple attendance records for same subject on same day`,
          table: "attendance",
        });
      }
    }

    // 3. Attendance for inactive students
    if (inactiveAttendance && inactiveAttendance.length > 0) {
      issues.push({
        category: "business_logic",
        severity: "warning",
        message: "Recent attendance for inactive students",
        details: `Found ${inactiveAttendance.length} attendance records in last 30 days for students marked as inactive`,
        table: "attendance",
      });
    }
  } catch (error) {
    console.error("Error checking attendance logic:", error);
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Could not complete attendance logic check",
      details: error.message,
      table: "attendance",
    });
  }

  return issues;
};

/**
 * Check Grade Business Logic
 */
const checkGradeLogic = async () => {
  const issues = [];

  try {
    // 1-2. Independent queries — run in parallel
    const [
      { data: invalidScores, count: invalidCount },
      { data: inactiveGrades },
    ] = await Promise.all([
      supabase
        .from("grades")
        .select("id, score, subject", { count: "exact" })
        .or("score.lt.0,score.gt.100")
        .limit(50),
      supabase
        .from("grades")
        .select(
          `
        id,
        created_at,
        students!inner(is_active, full_name)
      `,
        )
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .eq("students.is_active", false)
        .limit(50),
    ]);

    if (invalidCount > 0) {
      issues.push({
        category: "business_logic",
        severity: "warning",
        message: "Grades outside valid range (0-100)",
        details: `Found ${invalidCount} grade entries with scores outside the valid 0-100 range`,
        table: "grades",
      });
    }

    // 2. Grades for inactive students (recent)
    if (inactiveGrades && inactiveGrades.length > 0) {
      issues.push({
        category: "business_logic",
        severity: "warning",
        message: "Recent grades for inactive students",
        details: `Found ${inactiveGrades.length} grades entered in last 30 days for students marked as inactive`,
        table: "grades",
      });
    }
  } catch (error) {
    console.error("Error checking grade logic:", error);
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Could not complete grade logic check",
      details: error.message,
      table: "grades",
    });
  }

  return issues;
};

/**
 * Check Class Capacity and Assignment Logic
 */
const checkClassLogic = async () => {
  const issues = [];

  try {
    // Classes with too many or no students
    const [{ data: classes }, { data: allActiveStudents }] = await Promise.all([
      supabase.from("classes").select("id, grade").eq("is_active", true),
      supabase
        .from("students")
        .select("id, class_id")
        .eq("is_active", true)
        .not("class_id", "is", null),
    ]);

    if (classes) {
      // Count students per class in one pass instead of querying per class
      const countByClassId = new Map();
      (allActiveStudents || []).forEach((s) => {
        countByClassId.set(
          s.class_id,
          (countByClassId.get(s.class_id) || 0) + 1,
        );
      });

      for (const classData of classes.slice(0, 50)) {
        const studentCount = countByClassId.get(classData.id) || 0;

        if (studentCount > 45) {
          issues.push({
            category: "business_logic",
            severity: "warning",
            message: "Class exceeds recommended capacity",
            details: `Class ${classData.grade} (ID: ${classData.id}) has ${studentCount} students - exceeds recommended limit of 45`,
            table: "classes",
          });
        }

        if (studentCount === 0) {
          issues.push({
            category: "business_logic",
            severity: "info",
            message: "Active class with no students",
            details: `Class ${classData.grade} (ID: ${classData.id}) is marked active but has no students assigned`,
            table: "classes",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error checking class logic:", error);
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Could not complete class logic check",
      details: error.message,
      table: "classes",
    });
  }

  return issues;
};

/**
 * Check Teacher Schedule Conflicts
 */
const checkTeacherScheduleConflicts = async () => {
  const issues = [];

  try {
    // Get all teacher schedules
    const { data: schedules } = await supabase
      .from("teacher_schedules")
      .select("id, teacher_id, day, start_time, end_time, class_id")
      .order("teacher_id", { ascending: true })
      .order("day", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(500);

    if (schedules && schedules.length > 0) {
      // Group by teacher and day
      const teacherSchedules = new Map();
      schedules.forEach((schedule) => {
        const key = `${schedule.teacher_id}-${schedule.day}`;
        if (!teacherSchedules.has(key)) {
          teacherSchedules.set(key, []);
        }
        teacherSchedules.get(key).push(schedule);
      });

      // Check for time conflicts
      teacherSchedules.forEach((dayScheds, key) => {
        const [teacherId, day] = key.split("-");
        for (let i = 0; i < dayScheds.length - 1; i++) {
          for (let j = i + 1; j < dayScheds.length; j++) {
            const sched1 = dayScheds[i];
            const sched2 = dayScheds[j];

            // Check time overlap
            if (
              sched1.start_time < sched2.end_time &&
              sched2.start_time < sched1.end_time
            ) {
              issues.push({
                category: "business_logic",
                severity: "critical",
                message: "Teacher schedule conflict detected",
                details: `Teacher ${teacherId} has overlapping schedules on ${day}: ${sched1.start_time}-${sched1.end_time} and ${sched2.start_time}-${sched2.end_time}`,
                table: "teacher_schedules",
              });
            }
          }
        }
      });
    }
  } catch (error) {
    console.error("Error checking teacher schedule conflicts:", error);
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Could not complete teacher schedule conflict check",
      details: error.message,
      table: "teacher_schedules",
    });
  }

  return issues;
};

/**
 * Check Teacher Assignment Logic
 */
const checkTeacherAssignmentLogic = async () => {
  const issues = [];

  try {
    // Teachers assigned to too many classes
    const { data: assignments } = await supabase
      .from("teacher_assignments")
      .select("teacher_id, class_id, subject")
      .limit(1000);

    if (assignments) {
      const teacherClassCount = new Map();
      assignments.forEach((assignment) => {
        const key = assignment.teacher_id;
        teacherClassCount.set(key, (teacherClassCount.get(key) || 0) + 1);
      });

      teacherClassCount.forEach((count, teacherId) => {
        if (count > 20) {
          issues.push({
            category: "business_logic",
            severity: "warning",
            message: "Teacher assigned to excessive number of classes",
            details: `Teacher ${teacherId} is assigned to ${count} classes - exceeds recommended limit of 20`,
            table: "teacher_assignments",
          });
        }
      });
    }
  } catch (error) {
    console.error("Error checking teacher assignment logic:", error);
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Could not complete teacher assignment logic check",
      details: error.message,
      table: "teacher_assignments",
    });
  }

  return issues;
};

/**
 * Check Student Status Consistency
 */
const checkStudentStatusLogic = async () => {
  const issues = [];

  try {
    // Students without class but marked active
    const { data: noClassActive, count: noClassCount } = await supabase
      .from("students")
      .select("id, full_name", { count: "exact" })
      .eq("is_active", true)
      .is("class_id", null)
      .limit(50);

    if (noClassCount > 0) {
      issues.push({
        category: "business_logic",
        severity: "warning",
        message: "Active students not assigned to any class",
        details: `Found ${noClassCount} active students without class assignment`,
        table: "students",
      });
    }
  } catch (error) {
    console.error("Error checking student status logic:", error);
    issues.push({
      category: "business_logic",
      severity: "info",
      message: "Could not complete student status logic check",
      details: error.message,
      table: "students",
    });
  }

  return issues;
};

export default checkBusinessLogic;
