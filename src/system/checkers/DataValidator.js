// src/system/checkers/DataValidator.js
import { supabase } from "../../supabaseClient";

/**
 * DataValidator - Comprehensive data validation checking
 * Checks: Data Integrity, Invalid Dates, Missing Required Data, Invalid References
 */

export const checkDataValidation = async () => {
  console.log("🔍 DataValidator: Starting comprehensive validation...");

  const issues = [];
  const startTime = Date.now();

  try {
    // Run all independent validators in parallel instead of sequentially
    console.log("📚 Running data validation checks in parallel...");
    const [
      studentIssues,
      userIssues,
      attendanceIssues,
      gradeIssues,
      academicYearIssues,
      assignmentIssues,
    ] = await Promise.all([
      validateStudents(),
      validateUsers(),
      validateAttendance(),
      validateGrades(),
      validateAcademicYears(),
      validateTeacherAssignments(),
    ]);

    issues.push(
      ...studentIssues,
      ...userIssues,
      ...attendanceIssues,
      ...gradeIssues,
      ...academicYearIssues,
      ...assignmentIssues,
    );

    const executionTime = Date.now() - startTime;
    console.log(`✅ DataValidator completed in ${executionTime}ms`);
    console.log(`📊 Found ${issues.length} validation issues:`);
    issues.forEach((issue, index) => {
      console.log(
        `   ${index + 1}. ${issue.severity === "critical" ? "🚨" : "⚠️"} ${
          issue.message
        }`,
      );
      console.log(`      📝 ${issue.details}`);
    });

    return {
      success: true,
      issues,
      executionTime,
    };
  } catch (error) {
    console.error("❌ DataValidator error:", error);
    return {
      success: false,
      issues: [
        {
          category: "data",
          severity: "critical",
          message: "Data validator failed",
          details: error.message,
          table: "system",
        },
      ],
      executionTime: Date.now() - startTime,
    };
  }
};

/**
 * Validate Students Data
 */
const validateStudents = async () => {
  const issues = [];

  try {
    // Helper for check #5: depends on activeYear result, so keep this pair
    // sequential internally — but run the whole chain in parallel with the rest
    const checkInactiveCurrentYear = async () => {
      const { data: activeYear } = await supabase
        .from("academic_years")
        .select("year, semester")
        .eq("is_active", true)
        .single();

      if (!activeYear) return null;

      const { data: inactiveInCurrent } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("academic_year", activeYear.year)
        .eq("is_active", false)
        .limit(50);

      return { activeYear, inactiveInCurrent };
    };

    // 1-5. All independent from each other — run in parallel
    const [
      { data: invalidGender },
      { data: noClass },
      { data: students },
      { data: shortNames },
      inactiveCurrentYear,
    ] = await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, gender")
        .not("gender", "in", '("L","P")')
        .limit(20),
      supabase
        .from("students")
        .select("id, full_name, is_active")
        .eq("is_active", true)
        .is("class_id", null)
        .limit(20),
      supabase
        .from("students")
        .select("nis, academic_year, full_name")
        .not("nis", "is", null)
        .neq("nis", "")
        .order("academic_year", { ascending: false })
        .limit(500),
      supabase
        .from("students")
        .select("id, full_name")
        .not("full_name", "is", null)
        .limit(1000),
      checkInactiveCurrentYear(),
    ]);

    // 1. Students with invalid gender
    if (invalidGender && invalidGender.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Students with invalid gender values",
        details: `Found ${
          invalidGender.length
        } students with gender not 'L' or 'P': ${invalidGender
          .map((s) => `${s.full_name} (${s.gender})`)
          .slice(0, 5)
          .join(", ")}`,
        table: "students",
      });
    }

    // 2. Students without class (active students)
    if (noClass && noClass.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Active students without class assignment",
        details: `Found ${noClass.length} active students not assigned to any class`,
        table: "students",
      });
    }

    // 3. Students with duplicate NIS in same academic year
    if (students) {
      const nisMap = new Map();
      students.forEach((student) => {
        const key = `${student.nis}-${student.academic_year}`;
        if (nisMap.has(key)) {
          nisMap.get(key).push(student.full_name);
        } else {
          nisMap.set(key, [student.full_name]);
        }
      });

      const duplicates = Array.from(nisMap.entries()).filter(
        ([_, names]) => names.length > 1,
      );

      if (duplicates.length > 0) {
        issues.push({
          category: "data",
          severity: "critical",
          message: "Duplicate NIS in same academic year",
          details: `Found ${
            duplicates.length
          } NIS duplicates. Examples: ${duplicates
            .slice(0, 3)
            .map(([key, names]) => `${key.split("-")[0]} (${names.join(", ")})`)
            .join("; ")}`,
          table: "students",
        });
      }
    }

    // 4. Students with very short names (likely data entry error)
    if (shortNames) {
      const tooShort = shortNames.filter(
        (s) => s.full_name && s.full_name.trim().length < 3,
      );
      if (tooShort.length > 0) {
        issues.push({
          category: "data",
          severity: "info",
          message: "Students with suspiciously short names",
          details: `Found ${tooShort.length} students with names shorter than 3 characters`,
          table: "students",
        });
      }
    }

    // 5. Inactive students in current academic year
    if (inactiveCurrentYear && inactiveCurrentYear.activeYear) {
      const { activeYear, inactiveInCurrent } = inactiveCurrentYear;

      if (inactiveInCurrent && inactiveInCurrent.length > 10) {
        issues.push({
          category: "data",
          severity: "info",
          message: "Many inactive students in current academic year",
          details: `Found ${inactiveInCurrent.length} inactive students in current year ${activeYear.year}`,
          table: "students",
        });
      }
    }
  } catch (error) {
    console.error("Error validating students:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete student validation",
      details: error.message,
      table: "students",
    });
  }

  return issues;
};

/**
 * Validate Users Data
 */
const validateUsers = async () => {
  const issues = [];

  try {
    const validRoles = [
      "admin",
      "teacher",
      "wali_kelas",
      "guru_bk",
      "kepala_sekolah",
    ];
    const teacherRoles = ["guru", "wali_kelas", "guru_bk"];

    // 1-5. All independent — run in parallel
    const [
      { data: invalidRoles },
      { data: noPassword },
      { data: teachersNoId },
      { data: users },
      { data: waliNoClass },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("id, username, role, full_name")
        .not("role", "in", `(${validRoles.map((r) => `"${r}"`).join(",")})`)
        .limit(20),
      supabase
        .from("users")
        .select("id, username, role")
        .or('password.is.null,password.eq.""')
        .limit(20),
      supabase
        .from("users")
        .select("id, username, role")
        .in("role", teacherRoles)
        .eq("is_active", true)
        .is("teacher_id", null)
        .limit(20),
      supabase
        .from("users")
        .select("id, username, no_hp")
        .not("no_hp", "is", null)
        .neq("no_hp", "")
        .limit(500),
      supabase
        .from("users")
        .select("id, username, full_name")
        .eq("role", "wali_kelas")
        .eq("is_active", true)
        .is("homeroom_class_id", null)
        .limit(20),
    ]);

    // 1. Users with invalid roles
    if (invalidRoles && invalidRoles.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Users with invalid role values",
        details: `Found ${
          invalidRoles.length
        } users with invalid roles: ${invalidRoles
          .map((u) => `${u.username} (${u.role})`)
          .slice(0, 5)
          .join(", ")}`,
        table: "users",
      });
    }

    // 2. Users without password (security risk)
    if (noPassword && noPassword.length > 0) {
      issues.push({
        category: "data",
        severity: "critical",
        message: "Users without password",
        details: `Found ${noPassword.length} users without password - SECURITY RISK!`,
        table: "users",
      });
    }

    // 3. Active users without valid teacher_id (for teacher roles)
    if (teachersNoId && teachersNoId.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Teacher users without teacher_id",
        details: `Found ${teachersNoId.length} teacher accounts without teacher_id`,
        table: "users",
      });
    }

    // 4. Users with invalid phone numbers
    if (users) {
      const invalidPhones = users.filter((u) => {
        const phone = u.no_hp.replace(/[^0-9]/g, "");
        return phone.length < 10 || phone.length > 15;
      });

      if (invalidPhones.length > 0) {
        issues.push({
          category: "data",
          severity: "info",
          message: "Users with invalid phone number format",
          details: `Found ${invalidPhones.length} users with potentially invalid phone numbers`,
          table: "users",
        });
      }
    }

    // 5. Wali kelas without homeroom class
    if (waliNoClass && waliNoClass.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Homeroom teachers without class assignment",
        details: `Found ${waliNoClass.length} active wali kelas without homeroom_class_id`,
        table: "users",
      });
    }
  } catch (error) {
    console.error("Error validating users:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete user validation",
      details: error.message,
      table: "users",
    });
  }

  return issues;
};

/**
 * Validate Attendance Data
 */
const validateAttendance = async () => {
  const issues = [];

  try {
    const today = new Date().toISOString().split("T")[0];
    const validStatuses = ["Hadir", "Sakit", "Izin", "Alpa"];
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoStr = twoYearsAgo.toISOString().split("T")[0];

    // 1-4. All independent — run in parallel
    const [
      { data: futureDates },
      { data: invalidStatus },
      { data: veryOld, count: oldCount },
      { data: recentAttendance },
    ] = await Promise.all([
      supabase
        .from("attendance")
        .select("id, date, student_id")
        .gt("date", today)
        .limit(50),
      supabase
        .from("attendance")
        .select("id, status, date")
        .not(
          "status",
          "in",
          `(${validStatuses.map((s) => `"${s}"`).join(",")})`,
        )
        .limit(50),
      supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .lt("date", twoYearsAgoStr),
      supabase
        .from("attendance")
        .select("student_id, date, subject")
        .gte("date", twoYearsAgoStr)
        .limit(1000),
    ]);

    // 1. Attendance with future dates
    if (futureDates && futureDates.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Attendance records with future dates",
        details: `Found ${futureDates.length} attendance records dated in the future`,
        table: "attendance",
      });
    }

    // 2. Attendance with invalid status
    if (invalidStatus && invalidStatus.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Attendance with invalid status",
        details: `Found ${invalidStatus.length} attendance records with invalid status values`,
        table: "attendance",
      });
    }

    // 3. Attendance very old (more than 2 years)
    if (oldCount && oldCount > 1000) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Large number of old attendance records",
        details: `Found ${oldCount} attendance records older than 2 years - consider archiving`,
        table: "attendance",
      });
    }

    // 4. Duplicate attendance (same student, date, subject)
    if (recentAttendance) {
      const attendanceKeys = new Map();
      recentAttendance.forEach((att) => {
        const key = `${att.student_id}-${att.date}-${att.subject}`;
        attendanceKeys.set(key, (attendanceKeys.get(key) || 0) + 1);
      });

      const duplicates = Array.from(attendanceKeys.values()).filter(
        (count) => count > 1,
      );
      if (duplicates.length > 0) {
        issues.push({
          category: "data",
          severity: "warning",
          message: "Duplicate attendance records detected",
          details: `Found ${duplicates.length} cases of duplicate attendance (same student, date, subject)`,
          table: "attendance",
        });
      }
    }
  } catch (error) {
    console.error("Error validating attendance:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete attendance validation",
      details: error.message,
      table: "attendance",
    });
  }

  return issues;
};

/**
 * Validate Grades Data
 */
const validateGrades = async () => {
  const issues = [];

  try {
    const validTypes = ["NH1", "NH2", "NH3", "UTS", "UAS"];

    // 1-4. All independent — run in parallel
    const [
      { data: invalidScores },
      { data: invalidTypes },
      { data: noSemester },
      { data: gradesWithStudent },
    ] = await Promise.all([
      supabase
        .from("grades")
        .select("id, student_id, score, subject")
        .or("score.lt.0,score.gt.100,score.is.null")
        .limit(50),
      supabase
        .from("grades")
        .select("id, assignment_type, subject")
        .not(
          "assignment_type",
          "in",
          `(${validTypes.map((t) => `"${t}"`).join(",")})`,
        )
        .limit(50),
      supabase
        .from("grades")
        .select("id, student_id")
        .is("semester", null)
        .limit(50),
      supabase
        .from("grades")
        .select(
          `
        id,
        student_id,
        students!inner(is_active, full_name)
      `,
        )
        .eq("students.is_active", false)
        .limit(100),
    ]);

    // 1. Grades with invalid scores
    if (invalidScores && invalidScores.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Grades with invalid score values",
        details: `Found ${invalidScores.length} grades with scores outside 0-100 range or null`,
        table: "grades",
      });
    }

    // 2. Grades with invalid assignment_type
    if (invalidTypes && invalidTypes.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Grades with non-standard assignment types",
        details: `Found ${invalidTypes.length} grades with unexpected assignment_type values`,
        table: "grades",
      });
    }

    // 3. Grades without semester info
    if (noSemester && noSemester.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Grades without semester information",
        details: `Found ${noSemester.length} grade records without semester`,
        table: "grades",
      });
    }

    // 4. Grades for inactive students
    if (gradesWithStudent && gradesWithStudent.length > 20) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Grades for inactive students",
        details: `Found ${gradesWithStudent.length} grade records for inactive students`,
        table: "grades",
      });
    }
  } catch (error) {
    console.error("Error validating grades:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete grade validation",
      details: error.message,
      table: "grades",
    });
  }

  return issues;
};

/**
 * Validate Academic Years Data
 */
const validateAcademicYears = async () => {
  const issues = [];

  try {
    // 1-3. All independent — run in parallel
    const [{ data: years }, { data: activeYears }, { data: missingDates }] =
      await Promise.all([
        supabase
          .from("academic_years")
          .select("id, year, semester, start_date, end_date")
          .limit(50),
        supabase
          .from("academic_years")
          .select("id, year, semester")
          .eq("is_active", true),
        supabase
          .from("academic_years")
          .select("id, year, semester")
          .or("start_date.is.null,end_date.is.null")
          .limit(20),
      ]);

    // 1. Academic years with invalid date ranges
    if (years) {
      const invalidDates = years.filter((year) => {
        if (!year.start_date || !year.end_date) return false;
        return new Date(year.start_date) >= new Date(year.end_date);
      });

      if (invalidDates.length > 0) {
        issues.push({
          category: "data",
          severity: "warning",
          message: "Academic years with invalid date ranges",
          details: `Found ${invalidDates.length} academic years where start_date >= end_date`,
          table: "academic_years",
        });
      }
    }

    // 2. No active academic year
    if (!activeYears || activeYears.length === 0) {
      issues.push({
        category: "data",
        severity: "critical",
        message: "No active academic year",
        details: "System requires at least one active academic year",
        table: "academic_years",
      });
    }

    // 3. Academic years missing dates
    if (missingDates && missingDates.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Academic years with missing dates",
        details: `Found ${missingDates.length} academic years without complete date information`,
        table: "academic_years",
      });
    }
  } catch (error) {
    console.error("Error validating academic years:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete academic year validation",
      details: error.message,
      table: "academic_years",
    });
  }

  return issues;
};

/**
 * Validate Teacher Assignments
 */
const validateTeacherAssignments = async () => {
  const issues = [];

  try {
    // 1-2. noSubject, validYears, and assignments are all independent queries —
    // the assignments data doesn't depend on validYears, only the JS filtering below does
    const [{ data: noSubject }, { data: validYears }, { data: assignments }] =
      await Promise.all([
        supabase
          .from("teacher_assignments")
          .select("id, teacher_id")
          .or('subject.is.null,subject.eq.""')
          .limit(20),
        supabase.from("academic_years").select("year"),
        supabase
          .from("teacher_assignments")
          .select("id, academic_year")
          .limit(200),
      ]);

    // 1. Assignments without subject
    if (noSubject && noSubject.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Teacher assignments without subject",
        details: `Found ${noSubject.length} assignments without subject information`,
        table: "teacher_assignments",
      });
    }

    // 2. Assignments for non-existent academic year
    if (validYears) {
      const validYearSet = new Set(validYears.map((y) => y.year));

      if (assignments) {
        const invalidYears = assignments.filter(
          (a) => !validYearSet.has(a.academic_year),
        );
        if (invalidYears.length > 0) {
          issues.push({
            category: "data",
            severity: "warning",
            message: "Teacher assignments for non-existent academic years",
            details: `Found ${invalidYears.length} assignments referencing invalid academic years`,
            table: "teacher_assignments",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error validating teacher assignments:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete teacher assignment validation",
      details: error.message,
      table: "teacher_assignments",
    });
  }

  return issues;
};

export default checkDataValidation;
