// reports/ReportHelpers.js - FIXED VERSION
// ============================================
// 🎯 CENTRALIZED REPORT HELPERS - FIXED
// ============================================

import { supabase } from "../supabaseClient";

// ==================== CONSTANTS ====================

export const TEACHER_ROLES = ["teacher", "guru_bk"];

export const ATTENDANCE_STATUS_MAP = {
  hadir: "Hadir",
  tidak_hadir: "Tidak Hadir",
  alpa: "Alpa",
  sakit: "Sakit",
  izin: "Izin",
};

export const ATTENDANCE_TYPES = {
  WALIKELAS: "walikelas", // ✅ FIXED: "walikelas" bukan "harian"
  MATA_PELAJARAN: "mapel",
};

// ==================== DATE FORMATTERS ====================

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "-";
  try {
    const defaultOptions = {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...options,
    };
    return new Date(dateString).toLocaleDateString("id-ID", defaultOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "-";
  }
};

// ==================== STATUS FORMATTERS ====================

export const formatRole = (role) => {
  const roleMap = {
    guru_bk: "Guru BK",
    teacher: "Guru",
    homeroom: "Wali Kelas",
    admin: "Admin",
    kepala_sekolah: "Kepala Sekolah",
  };
  return roleMap[role?.toLowerCase()] || role || "-";
};

export const formatGender = (gender) => {
  if (!gender) return "-";
  return gender.toUpperCase() === "L" ? "Laki-laki" : "Perempuan";
};

export const formatActiveStatus = (isActive) => {
  return isActive ? "Aktif" : "Tidak Aktif";
};

export const formatAttendanceStatus = (status) => {
  const lowerStatus = status?.toLowerCase() || "";
  return ATTENDANCE_STATUS_MAP[lowerStatus] || status || "-";
};

// ==================== STANDARDIZED HEADERS ====================

export const REPORT_HEADERS = {
  teachers: [
    "Kode Guru",
    "Username",
    "Nama Lengkap",
    "Role",
    "Wali Kelas",
    "Status",
    "Tanggal Bergabung",
  ],
  students: [
    "NIS",
    "Nama Lengkap",
    "Jenis Kelamin",
    "Kelas",
    "Tingkat",
    "Tahun Ajaran",
  ],
  studentsSimple: [
    "NIS",
    "Nama Lengkap",
    "Jenis Kelamin",
    "Kelas",
    "Tahun Ajaran",
  ],
  attendance: ["Tanggal", "NIS", "Nama Siswa", "Kelas", "Status Kehadiran"],
  attendanceWithSubject: [
    "Tanggal",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Mata Pelajaran",
    "Status Kehadiran",
  ],
  attendanceRecap: [
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Hadir",
    "Sakit",
    "Izin",
    "Absen",
    "Total",
    "Persentase",
  ],
  grades: [
    "Tahun Ajaran",
    "Semester",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Mata Pelajaran",
    "Jenis",
    "Nilai",
    "Guru",
  ],
  gradesSimple: [
    "Tahun Ajaran",
    "Semester",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Mata Pelajaran",
    "Jenis",
    "Nilai",
  ],
  gradesFinalOnly: [
    "Tahun Ajaran",
    "Semester",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Mata Pelajaran",
    "Nilai Akhir",
    "Guru",
  ],
};

// ==================== ROW FORMATTERS ====================

export const formatTeacherRow = (row) => ({
  teacher_id: row.teacher_id || "-",
  username: row.username || "-",
  full_name: row.full_name || "-",
  role: formatRole(row.role),
  homeroom_class_id: row.homeroom_class_id || "-",
  is_active: formatActiveStatus(row.is_active),
  created_at: formatDate(row.created_at),
});

export const formatStudentRow = (row, includeGrade = true) => {
  const base = {
    nis: row.nis || "-",
    full_name: row.full_name || "-",
    gender: formatGender(row.gender),
    class_id: row.class_id || row.class || "-",
  };
  if (includeGrade) {
    base.grade = row.classes?.grade || row.grade || "-";
  }
  base.academic_year = row.academic_year || "-";
  return base;
};

export const formatAttendanceRow = (row, includeSubject = false) => {
  const base = {
    date: formatDate(row.date),
    student_nis: row.student_nis || "-",
    student_name: row.student_name || "-",
    class_id: row.class || row.class_id || "-", // ✅ Support both field names
  };
  if (includeSubject) {
    base.subject = row.mapel || row.subject || "-";
  }
  base.status = formatAttendanceStatus(row.status);
  return base;
};

export const formatGradeRow = (row, teacherMap = {}) => ({
  academic_year: row.academic_year || "-",
  semester: row.semester || "-",
  nis: row.nis || "-",
  full_name: row.full_name || "-",
  class_id: row.class_id || "-",
  subject: row.subject || "-",
  assignment_type: row.assignment_type || "-",
  score: row.score || 0,
  teacher: teacherMap[row.teacher_id] || row.teacher_name || "-",
});

export const formatFinalGradeRow = (row, teacherMap = {}) => ({
  academic_year: row.academic_year || "-",
  semester: row.semester || "-",
  nis: row.nis || "-",
  full_name: row.full_name || "-",
  class_id: row.class_id || "-",
  subject: row.subject || "-",
  final_score: row.final_score ? Math.round(row.final_score * 100) / 100 : 0,
  teacher: teacherMap[row.teacher_id] || row.teacher_name || "-",
});

// ==================== DATA FETCHERS ====================

export const fetchTeachersData = async (filters = {}) => {
  let query = supabase
    .from("users")
    .select("*")
    .in("role", TEACHER_ROLES)
    .neq("username", "adenurmughni")
    .eq("is_active", true)
    .order("teacher_id");

  const { data, error } = await query;
  if (error) throw error;

  const formattedData = data?.map(formatTeacherRow) || [];

  return {
    headers: REPORT_HEADERS.teachers,
    preview: formattedData.slice(0, 100),
    fullData: formattedData,
    total: formattedData.length,
    summary: calculateTeacherSummary(data || []),
  };
};

export const fetchStudentsData = async (filters = {}, includeGrade = true) => {
  let query = supabase
    .from("students")
    .select("*, classes(grade)")
    .eq("is_active", true);

  if (filters.class_id) query = query.eq("class_id", filters.class_id);
  if (filters.academic_year)
    query = query.eq("academic_year", filters.academic_year);

  query = query.order("class_id").order("full_name");

  const { data, error } = await query;
  if (error) throw error;

  const formattedData =
    data?.map((row) => formatStudentRow(row, includeGrade)) || [];

  return {
    headers: includeGrade
      ? REPORT_HEADERS.students
      : REPORT_HEADERS.studentsSimple,
    preview: formattedData.slice(0, 100),
    fullData: formattedData,
    total: formattedData.length,
    summary: calculateStudentSummary(data || []),
  };
};

// ✅ FIXED: Ganti "attendances" → "attendance", "harian" → "walikelas"
export const fetchAttendanceRecapData = async (
  filters = {},
  attendanceType = null
) => {
  const startDate =
    filters.start_date ||
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
  const endDate = filters.end_date || new Date().toISOString().split("T")[0];

  // ✅ CRITICAL FIX: "attendance" (singular), bukan "attendances"
  let attendanceQuery = supabase
    .from("attendance") // ✅ FIXED
    .select("student_id, date, status, type, mapel, class")
    .gte("date", startDate)
    .lte("date", endDate);

  // ✅ FIXED: "walikelas" bukan "harian"
  if (attendanceType === "Mata Pelajaran") {
    attendanceQuery = attendanceQuery.eq("type", "mapel");
  } else if (attendanceType === "Harian") {
    attendanceQuery = attendanceQuery.eq("type", "walikelas"); // ✅ FIXED
  }

  if (filters.class_ids && filters.class_ids.length > 0) {
    attendanceQuery = attendanceQuery.in("class", filters.class_ids);
  } else if (filters.class_id) {
    attendanceQuery = attendanceQuery.eq("class", filters.class_id);
  }

  if (filters.subject) {
    console.log("🔍 Filtering recap by subject:", filters.subject);
    attendanceQuery = attendanceQuery.eq("mapel", filters.subject);
  }

  const { data: rawAttendance, error: attendanceError } = await attendanceQuery;
  if (attendanceError) {
    console.error("❌ Attendance Recap Query Error:", attendanceError);
    throw attendanceError;
  }

  console.log(
    "✅ Attendance recap data fetched:",
    rawAttendance?.length,
    "records"
  );

  const studentIds = [
    ...new Set(rawAttendance?.map((r) => r.student_id).filter(Boolean)),
  ];

  if (studentIds.length === 0) {
    return {
      headers: REPORT_HEADERS.attendanceRecap,
      preview: [],
      fullData: [],
      total: 0,
      summary: calculateAttendanceSummary([]),
    };
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, nis, full_name, class_id, class")
    .in("id", studentIds);

  if (studentsError) throw studentsError;

  const studentMap = {};
  students?.forEach((s) => {
    studentMap[s.id] = s;
  });

  const recapData = {};
  (rawAttendance || []).forEach((record) => {
    const key = record.student_id;
    const student = studentMap[key];
    if (!student) return;

    if (!recapData[key]) {
      recapData[key] = {
        nis: student.nis || "-",
        name: student.full_name || "-",
        class_id: student.class_id || student.class || "-",
        hadir: 0,
        sakit: 0,
        izin: 0,
        tidak_hadir: 0,
        total: 0,
      };
    }

    recapData[key].total++;
    const status = record.status?.toLowerCase() || "";

    if (status === "hadir") recapData[key].hadir++;
    else if (status === "sakit") recapData[key].sakit++;
    else if (status === "izin") recapData[key].izin++;
    else if (status === "alpa" || status === "tidak_hadir")
      recapData[key].tidak_hadir++;
  });

  const finalData = Object.values(recapData)
    .map((r) => ({
      ...r,
      persentase:
        r.total > 0 ? `${Math.round((r.hadir / r.total) * 100)}%` : "0%",
    }))
    .sort((a, b) => b.hadir - a.hadir);

  return {
    headers: REPORT_HEADERS.attendanceRecap,
    preview: finalData.slice(0, 100),
    fullData: finalData,
    total: finalData.length,
    summary: calculateAttendanceSummary(finalData),
  };
};

export const fetchGradesData = async (
  filters = {},
  teacherId = null,
  isHomeroom = false
) => {
  let gradesQuery = supabase.from("grades").select("*");

  if (teacherId) gradesQuery = gradesQuery.eq("teacher_id", teacherId);
  if (filters.academic_year)
    gradesQuery = gradesQuery.eq("academic_year", filters.academic_year);
  if (filters.semester)
    gradesQuery = gradesQuery.eq("semester", filters.semester);
  if (filters.subject) gradesQuery = gradesQuery.eq("subject", filters.subject);

  gradesQuery = gradesQuery
    .order("academic_year", { ascending: false })
    .order("semester");

  const { data: gradesData, error: gradesError } = await gradesQuery;
  if (gradesError) throw gradesError;

  console.log("✅ Grades fetched:", gradesData?.length, "records");

  if (!gradesData || gradesData.length === 0) {
    return {
      headers: isHomeroom
        ? REPORT_HEADERS.gradesFinalOnly
        : REPORT_HEADERS.grades,
      preview: [],
      fullData: [],
      total: 0,
      summary: isHomeroom
        ? calculateFinalGradeSummary([])
        : calculateGradeSummary([]),
    };
  }

  const studentIds = [
    ...new Set(gradesData.map((g) => g.student_id).filter(Boolean)),
  ];

  let studentsQuery = supabase
    .from("students")
    .select("id, nis, full_name, class_id, class")
    .in("id", studentIds);

  if (filters.class_ids && filters.class_ids.length > 0) {
    studentsQuery = studentsQuery.in("class_id", filters.class_ids);
  } else if (filters.class_id) {
    studentsQuery = studentsQuery.eq("class_id", filters.class_id);
  }

  const { data: students, error: studentsError } = await studentsQuery;
  if (studentsError) throw studentsError;

  const studentMap = {};
  students?.forEach((s) => {
    studentMap[s.id] = s;
  });

  const filteredGrades = gradesData.filter((g) => studentMap[g.student_id]);

  const teacherIds = [
    ...new Set(filteredGrades.map((g) => g.teacher_id).filter(Boolean)),
  ];
  const { data: teachers } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", teacherIds);

  const teacherMap = {};
  teachers?.forEach((t) => {
    teacherMap[t.id] = t.full_name;
  });

  const enrichedGrades = filteredGrades.map((grade) => ({
    ...grade,
    nis: studentMap[grade.student_id]?.nis,
    full_name: studentMap[grade.student_id]?.full_name,
    class_id:
      studentMap[grade.student_id]?.class_id ||
      studentMap[grade.student_id]?.class,
    teacher_name: teacherMap[grade.teacher_id],
  }));

  if (isHomeroom) {
    const finalGrades = calculateFinalGrades(enrichedGrades);
    const formattedData = finalGrades.map((row) =>
      formatFinalGradeRow(row, teacherMap)
    );

    return {
      headers: REPORT_HEADERS.gradesFinalOnly,
      preview: formattedData.slice(0, 100),
      fullData: formattedData,
      total: formattedData.length,
      summary: calculateFinalGradeSummary(finalGrades),
      rawFinalGrades: finalGrades,
    };
  }

  const formattedData = enrichedGrades.map((row) =>
    formatGradeRow(row, teacherMap)
  );

  return {
    headers: REPORT_HEADERS.grades,
    preview: formattedData.slice(0, 100),
    fullData: formattedData,
    total: formattedData.length,
    summary: calculateGradeSummary(enrichedGrades),
  };
};

// ✅ FIXED: Ganti "attendances" → "attendance", "harian" → "walikelas"
export const fetchAttendanceDailyData = async (
  filters = {},
  attendanceType = null
) => {
  const startDate =
    filters.start_date ||
    (() => {
      const date = new Date();
      date.setDate(1);
      return date.toISOString().split("T")[0];
    })();
  const endDate = filters.end_date || new Date().toISOString().split("T")[0];

  // ✅ CRITICAL FIX: "attendance" (singular)
  let attendanceQuery = supabase
    .from("attendance") // ✅ FIXED
    .select("date, student_id, status, mapel, type, class")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  // ✅ FIXED: "walikelas" bukan "harian"
  if (attendanceType === "Mata Pelajaran") {
    console.log("🔍 Filtering by type: mapel");
    attendanceQuery = attendanceQuery.eq("type", "mapel");
  } else if (attendanceType === "Harian") {
    console.log("🔍 Filtering by type: walikelas");
    attendanceQuery = attendanceQuery.eq("type", "walikelas"); // ✅ FIXED
  }

  if (filters.class_ids && filters.class_ids.length > 0) {
    console.log("🔍 Filtering by class_ids:", filters.class_ids);
    attendanceQuery = attendanceQuery.in("class", filters.class_ids);
  } else if (filters.class_id) {
    attendanceQuery = attendanceQuery.eq("class", filters.class_id);
  }

  if (filters.subject) {
    console.log("🔍 Filtering by subject:", filters.subject);
    attendanceQuery = attendanceQuery.eq("mapel", filters.subject);
  }

  const { data: attendanceData, error: attendanceError } =
    await attendanceQuery;

  if (attendanceError) {
    console.error("❌ Attendance query error:", attendanceError);
    throw attendanceError;
  }

  console.log("✅ Attendance data fetched:", attendanceData?.length, "records");
  if (attendanceData && attendanceData.length > 0) {
    console.log("🔍 Sample record:", attendanceData[0]);
    console.log("🔍 Unique subjects:", [
      ...new Set(attendanceData.map((d) => d.mapel)),
    ]);
  }

  if (!attendanceData || attendanceData.length === 0) {
    return {
      headers:
        attendanceType === "Mata Pelajaran"
          ? REPORT_HEADERS.attendanceWithSubject
          : REPORT_HEADERS.attendance,
      preview: [],
      fullData: [],
      total: 0,
      summary: [
        { label: "Total Records", value: 0 },
        { label: "Hadir", value: "0%" },
        { label: "Tidak Hadir", value: 0 },
      ],
    };
  }

  const studentIds = [
    ...new Set(attendanceData.map((a) => a.student_id).filter(Boolean)),
  ];

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, nis, full_name, class_id, class")
    .in("id", studentIds);

  if (studentsError) throw studentsError;

  const studentMap = {};
  students?.forEach((s) => {
    studentMap[s.id] = s;
  });

  const enrichedData = attendanceData
    .map((record) => ({
      ...record,
      student_nis: studentMap[record.student_id]?.nis,
      student_name: studentMap[record.student_id]?.full_name,
    }))
    .filter((r) => r.student_nis);

  const includeSubject = attendanceType === "Mata Pelajaran";
  const formattedData = enrichedData.map((row) =>
    formatAttendanceRow(row, includeSubject)
  );

  const totalRecords = enrichedData.length;
  const hadirCount = enrichedData.filter(
    (d) => d.status?.toLowerCase() === "hadir"
  ).length;
  const hadirPercent =
    totalRecords > 0 ? Math.round((hadirCount / totalRecords) * 100) : 0;

  const summary = [
    { label: "Total Records", value: totalRecords },
    { label: "Hadir", value: `${hadirPercent}%` },
    { label: "Tidak Hadir", value: totalRecords - hadirCount },
  ];

  return {
    headers: includeSubject
      ? REPORT_HEADERS.attendanceWithSubject
      : REPORT_HEADERS.attendance,
    preview: formattedData.slice(0, 100),
    fullData: formattedData,
    total: formattedData.length,
    summary,
  };
};

// ==================== SUMMARY CALCULATORS ====================

export const calculateStudentSummary = (data) => {
  const maleCount = data.filter((s) => s.gender === "L").length;
  const femaleCount = data.filter((s) => s.gender === "P").length;
  const classes = [...new Set(data.map((s) => s.class_id))].filter(Boolean);

  return [
    { label: "Total Siswa", value: data.length },
    { label: "Laki-laki", value: maleCount },
    { label: "Perempuan", value: femaleCount },
    { label: "Jumlah Kelas", value: classes.length },
  ];
};

export const calculateTeacherSummary = (data) => {
  const activeCount = data.filter((t) => t.is_active === true).length;
  const homeroomCount = data.filter(
    (t) => t.homeroom_class_id && t.homeroom_class_id !== "-"
  ).length;
  const bkCount = data.filter((t) => t.role === "guru_bk").length;

  return [
    { label: "Total Guru", value: data.length },
    { label: "Guru Aktif", value: activeCount },
    { label: "Wali Kelas", value: homeroomCount },
    { label: "Guru BK", value: bkCount },
  ];
};

export const calculateAttendanceSummary = (data) => {
  const totalHadir = data.reduce((sum, r) => sum + (r.hadir || 0), 0);
  const totalPresensi = data.reduce((sum, r) => sum + (r.total || 0), 0);
  const avgAttendance =
    totalPresensi > 0 ? Math.round((totalHadir / totalPresensi) * 100) : 0;
  const lowAttendance = data.filter((s) => {
    const pct = parseFloat(s.persentase);
    return pct && pct < 75;
  }).length;

  return [
    { label: "Total Siswa", value: data.length },
    { label: "Total Presensi", value: totalPresensi },
    { label: "Rata-rata Kehadiran", value: `${avgAttendance}%` },
    { label: "Siswa <75%", value: lowAttendance },
  ];
};

export const calculateGradeSummary = (data) => {
  const scores = data.map((d) => parseFloat(d.score)).filter((s) => !isNaN(s));
  const avg =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
      : 0;
  const highest = scores.length > 0 ? Math.max(...scores) : 0;
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;
  const subjects = [...new Set(data.map((g) => g.subject))].filter(Boolean);

  return [
    { label: "Total Nilai", value: data.length },
    { label: "Rata-rata", value: avg },
    { label: "Tertinggi", value: highest },
    { label: "Terendah", value: lowest },
    { label: "Mata Pelajaran", value: subjects.length },
  ];
};

export const calculateFinalGradeSummary = (finalGrades) => {
  const scores = finalGrades.map((g) => g.final_score).filter((s) => !isNaN(s));
  const avg =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
      : 0;
  const highest = scores.length > 0 ? Math.max(...scores) : 0;
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;
  const subjects = [...new Set(finalGrades.map((g) => g.subject))].filter(
    Boolean
  );

  return [
    { label: "Total Nilai Akhir", value: finalGrades.length },
    { label: "Rata-rata", value: avg },
    { label: "Tertinggi", value: highest },
    { label: "Terendah", value: lowest },
    { label: "Mata Pelajaran", value: subjects.length },
  ];
};

// ==================== UTILITY FUNCTIONS ====================

export const getDateRange = (filters) => {
  const startDate =
    filters.start_date ||
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
  const endDate = filters.end_date || new Date().toISOString().split("T")[0];
  return { startDate, endDate };
};

export const buildFilterDescription = (filters) => {
  const parts = [];
  if (filters.class_id) parts.push(`Kelas ${filters.class_id}`);
  if (filters.academic_year) parts.push(`TA ${filters.academic_year}`);
  if (filters.semester) parts.push(`Semester ${filters.semester}`);
  if (filters.subject) parts.push(`Mapel ${filters.subject}`);
  if (filters.start_date && filters.end_date) {
    parts.push(
      `Periode ${formatDate(filters.start_date)} - ${formatDate(
        filters.end_date
      )}`
    );
  }
  return parts.length > 0 ? parts.join(", ") : "Semua Data";
};

export const validateReportData = (data, headers) => {
  if (!data || data.length === 0) {
    return { valid: false, message: "Tidak ada data untuk di-export" };
  }
  if (!headers || headers.length === 0) {
    return { valid: false, message: "Header tidak valid" };
  }
  return { valid: true, message: "Data valid" };
};

export const calculateFinalGrades = (gradesData) => {
  const groupedByStudentSubject = {};

  gradesData.forEach((grade) => {
    const key = `${grade.student_id}_${grade.subject}_${grade.semester}_${grade.academic_year}`;

    if (!groupedByStudentSubject[key]) {
      groupedByStudentSubject[key] = {
        student_id: grade.student_id,
        nis: grade.nis,
        full_name: grade.full_name,
        class_id: grade.class_id,
        subject: grade.subject,
        teacher_id: grade.teacher_id,
        teacher_name: grade.teacher_name,
        academic_year: grade.academic_year,
        semester: grade.semester,
        nh: [],
        uts: null,
        uas: null,
      };
    }

    const type = grade.assignment_type?.toLowerCase() || "";
    const score = parseFloat(grade.score);

    if (isNaN(score)) return;

    if (type.includes("nh") || type.includes("harian")) {
      groupedByStudentSubject[key].nh.push(score);
    } else if (type.includes("uts")) {
      groupedByStudentSubject[key].uts = score;
    } else if (type.includes("uas")) {
      groupedByStudentSubject[key].uas = score;
    }
  });

  const finalGrades = [];

  Object.values(groupedByStudentSubject).forEach((group) => {
    const avgNH =
      group.nh.length > 0
        ? group.nh.reduce((a, b) => a + b, 0) / group.nh.length
        : 0;
    const uts = group.uts || 0;
    const uas = group.uas || 0;
    const finalScore = 0.4 * avgNH + 0.3 * uts + 0.3 * uas;

    if (avgNH > 0 || uts > 0 || uas > 0) {
      finalGrades.push({
        ...group,
        final_score: Math.round(finalScore * 100) / 100,
        avg_nh: Math.round(avgNH * 100) / 100,
      });
    }
  });

  return finalGrades;
};

export default {
  TEACHER_ROLES,
  ATTENDANCE_STATUS_MAP,
  ATTENDANCE_TYPES,
  REPORT_HEADERS,
  formatDate,
  formatDateTime,
  formatRole,
  formatGender,
  formatActiveStatus,
  formatAttendanceStatus,
  formatTeacherRow,
  formatStudentRow,
  formatAttendanceRow,
  formatGradeRow,
  formatFinalGradeRow,
  fetchTeachersData,
  fetchStudentsData,
  fetchAttendanceRecapData,
  fetchGradesData,
  fetchAttendanceDailyData,
  calculateStudentSummary,
  calculateTeacherSummary,
  calculateAttendanceSummary,
  calculateGradeSummary,
  calculateFinalGradeSummary,
  getDateRange,
  buildFilterDescription,
  validateReportData,
  calculateFinalGrades,
};
