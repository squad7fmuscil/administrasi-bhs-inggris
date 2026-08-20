// src/reports/TeacherReports.js - FIXED VERSION
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  FileText,
  GraduationCap,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ==================== CONSTANTS ====================
const COLOR_CLASSES = {
  indigo: {
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    border: "border-indigo-200",
    hover: "hover:bg-indigo-200",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border-green-200",
    hover: "hover:bg-green-200",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
    hover: "hover:bg-blue-200",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    border: "border-yellow-200",
    hover: "hover:bg-yellow-200",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
    hover: "hover:bg-orange-200",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-200",
    hover: "hover:bg-purple-200",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border-red-200",
    hover: "hover:bg-red-200",
  },
  teal: {
    bg: "bg-teal-100",
    text: "text-teal-600",
    border: "border-teal-200",
    hover: "hover:bg-teal-200",
  },
};

// ✅ FIX: Jangan pakai new Date().toISOString() polos buat tanggal — itu convert
// ke UTC, jadi pas dini hari WIB tanggalnya masih kebaca "kemarin" (bikin
// query "hari ini" nyari data di tanggal yang salah). Pakai helper ini biar
// konsisten dikunci ke WIB (UTC+7) di seluruh file.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const getWIBDateString = (date = new Date()) => {
  const wibDate = new Date(date.getTime() + WIB_OFFSET_MS);
  return wibDate.toISOString().split("T")[0];
};

// ✅ NEW: Tentuin rentang tanggal semester aktif pakai konvensi standar
// (Semester 1: Juli–Desember, Semester 2: Januari–Juni), berdasarkan
// tanggal WIB hari ini.
const getCurrentSemesterRange = () => {
  const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
  const year = wibNow.getUTCFullYear();
  const month = wibNow.getUTCMonth(); // 0 = Januari ... 11 = Desember

  let start, end, semester;
  if (month >= 6) {
    // Juli (index 6) - Desember (index 11) -> Semester 1
    semester = 1;
    start = new Date(Date.UTC(year, 6, 1)); // 1 Juli
    end = new Date(Date.UTC(year, 11, 31)); // 31 Desember
  } else {
    // Januari (index 0) - Juni (index 5) -> Semester 2
    semester = 2;
    start = new Date(Date.UTC(year, 0, 1)); // 1 Januari
    end = new Date(Date.UTC(year, 5, 30)); // 30 Juni
  }

  return {
    semester,
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
};

// ==================== COMPONENTS ====================
const StatCard = ({
  icon: Icon,
  label,
  value,
  color = "indigo",
  alert = false,
}) => {
  const colors = COLOR_CLASSES[color] || COLOR_CLASSES.indigo;
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${
        alert ? "border-red-300" : "border-slate-200"
      } p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        {alert && <AlertTriangle className="w-5 h-5 text-red-500" />}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const TeacherReports = ({ user, onShowToast }) => {
  const [activeTab, setActiveTab] = useState("homeroom");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ---------- Wali Kelas ----------
  const [stats, setStats] = useState({
    totalStudents: 0,
    monthlyAttendanceRate: 0,
    semesterAttendanceRate: 0,
    alerts: 0,
    className: user?.homeroom_class_id || "",
  });
  const [alertStudents, setAlertStudents] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
    return `${wibNow.getUTCFullYear()}-${String(
      wibNow.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
  });

  // ---------- Guru Mapel ----------
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState(null); // { class_id, subject }
  const [teacherMapelStats, setTeacherMapelStats] = useState({
    totalStudents: 0,
    monthlyAttendanceRate: 0,
    semesterAttendanceRate: 0,
    alerts: 0,
  });
  const [teacherAlertStudents, setTeacherAlertStudents] = useState([]);
  const [teacherDailyAttendance, setTeacherDailyAttendance] = useState([]);
  const [selectedTeacherMonth, setSelectedTeacherMonth] = useState(() => {
    const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
    return `${wibNow.getUTCFullYear()}-${String(
      wibNow.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
  });

  // ✅ NEW: Kombinasi unik kelas+mapel yang diampu, buat dropdown selector
  const classSubjectOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    teacherAssignments.forEach((a) => {
      const key = `${a.class_id}||${a.subject}`;
      if (!seen.has(key)) {
        seen.add(key);
        opts.push({ class_id: a.class_id, subject: a.subject });
      }
    });
    // ✅ FIX: urutkan berdasarkan class_id (angka tingkat dulu, lalu huruf
    // rombel) baru mapel, biar dropdown selalu tersusun rapi (7A, 7B, ... 7F,
    // 8A, ...) alih-alih ikut urutan mentah dari data assignment.
    opts.sort(
      (a, b) =>
        a.class_id.localeCompare(b.class_id, "id", { numeric: true }) ||
        a.subject.localeCompare(b.subject, "id"),
    );
    return opts;
  }, [teacherAssignments]);

  const teacherClassCount = useMemo(
    () => new Set(teacherAssignments.map((a) => a.class_id)).size,
    [teacherAssignments],
  );

  // Rentang bulan pilihan (semester aktif), dipakai bareng oleh chart
  // wali kelas & guru mapel
  const monthOptions = useMemo(() => {
    const { startDate, endDate } = getCurrentSemesterRange();
    const todayStr = getWIBDateString();
    const effectiveEnd = endDate > todayStr ? todayStr : endDate;

    const [startYear, startMonth] = startDate.split("-").map(Number);
    const [endYear, endMonth] = effectiveEnd.split("-").map(Number);

    const options = [];
    let y = endYear;
    let m = endMonth; // 1-indexed, mulai dari bulan terbaru
    while (y > startYear || (y === startYear && m >= startMonth)) {
      const d = new Date(Date.UTC(y, m - 1, 1));
      const value = `${y}-${String(m).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      options.push({ value, label });
      m -= 1;
      if (m === 0) {
        m = 12;
        y -= 1;
      }
    }
    return options;
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      if (!user?.id) {
        setError("Data user tidak lengkap. Pastikan Anda sudah login.");
        setLoading(false);
        setDataLoaded(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const results = await Promise.allSettled([
          fetchStats(),
          fetchTeacherAssignments(),
        ]);

        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
          console.error("Some data failed to load:", failures);
          setError(
            `Peringatan: Beberapa data gagal dimuat. Coba refresh halaman.`,
          );
        }
        setDataLoaded(true);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Gagal memuat data awal. Silakan refresh halaman.");
        setDataLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [user]);

  // ✅ NEW: Fetch tren kehadiran harian (wali kelas) tiap kali bulan yang
  // dipilih berubah
  useEffect(() => {
    if (user?.homeroom_class_id) {
      fetchDailyAttendanceTrend(selectedMonth);
    }
  }, [user?.homeroom_class_id, selectedMonth]);

  // ✅ NEW: Set default kelas+mapel terpilih begitu assignment kebaca
  useEffect(() => {
    if (classSubjectOptions.length > 0 && !selectedClassSubject) {
      setSelectedClassSubject(classSubjectOptions[0]);
    }
  }, [classSubjectOptions, selectedClassSubject]);

  // ✅ NEW: Fetch stat presensi mapel (bulan ini, semester ini, siswa
  // perlu perhatian) tiap kali kelas+mapel terpilih berubah
  useEffect(() => {
    if (selectedClassSubject) {
      fetchTeacherMapelStats(
        selectedClassSubject.class_id,
        selectedClassSubject.subject,
      );
    }
  }, [selectedClassSubject]);

  // ✅ NEW: Fetch tren kehadiran harian mapel, tiap kali kelas+mapel atau
  // bulan terpilih berubah
  useEffect(() => {
    if (selectedClassSubject) {
      fetchTeacherDailyAttendanceTrend(
        selectedClassSubject.class_id,
        selectedClassSubject.subject,
        selectedTeacherMonth,
      );
    }
  }, [selectedClassSubject, selectedTeacherMonth]);

  const fetchTeacherAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select("*")
        .eq("teacher_id", user.teacher_id);

      if (error) throw error;
      setTeacherAssignments(data || []);
    } catch (err) {
      console.error("Error fetching teacher assignments:", err);
      setTeacherAssignments([]);
      throw err;
    }
  };

  const fetchStats = async () => {
    try {
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, nis, full_name")
        .eq("class_id", user.homeroom_class_id)
        .eq("is_active", true);

      if (studentsError) throw studentsError;
      const totalStudents = students?.length || 0;

      // ✅ NEW: Tingkat kehadiran BULAN INI (dari tanggal 1 bulan berjalan
      // s.d. hari ini, WIB)
      const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
      const monthStart = new Date(
        Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), 1),
      )
        .toISOString()
        .split("T")[0];
      const todayStr = getWIBDateString();

      const { data: monthlyAtt, error: monthlyError } = await supabase
        .from("attendance")
        .select("status")
        .eq("class", user.homeroom_class_id)
        .eq("type", "walikelas")
        .gte("date", monthStart)
        .lte("date", todayStr);

      if (monthlyError) {
        console.error("❌ Monthly Attendance Error:", monthlyError);
        throw monthlyError;
      }

      const monthlyTotal = monthlyAtt?.length || 0;
      const monthlyHadir =
        monthlyAtt?.filter((a) => a.status?.toLowerCase() === "hadir").length ||
        0;
      const monthlyAttendanceRate =
        monthlyTotal > 0 ? Math.round((monthlyHadir / monthlyTotal) * 100) : 0;

      // ✅ NEW: Tingkat kehadiran SEMESTER INI (konvensi standar: Semester 1
      // Juli–Desember, Semester 2 Januari–Juni), dari awal semester s.d. hari ini
      const { startDate: semesterStart } = getCurrentSemesterRange();

      const { data: semesterAtt, error: semesterError } = await supabase
        .from("attendance")
        .select("status")
        .eq("class", user.homeroom_class_id)
        .eq("type", "walikelas")
        .gte("date", semesterStart)
        .lte("date", todayStr);

      if (semesterError) {
        console.error("❌ Semester Attendance Error:", semesterError);
        throw semesterError;
      }

      const semesterTotal = semesterAtt?.length || 0;
      const semesterHadir =
        semesterAtt?.filter((a) => a.status?.toLowerCase() === "hadir")
          .length || 0;
      const semesterAttendanceRate =
        semesterTotal > 0
          ? Math.round((semesterHadir / semesterTotal) * 100)
          : 0;

      // Alert students
      // ✅ FIX: hitung mundur 30 hari dari tanggal WIB hari ini, bukan UTC
      const thirtyDaysAgo = new Date(wibNow);
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];

      const { data: recentAtt, error: recentError } = await supabase
        .from("attendance")
        .select("student_id, status, date")
        .eq("class", user.homeroom_class_id)
        .eq("type", "walikelas")
        .gte("date", startDate);

      if (recentError) {
        console.error("❌ Recent Attendance Error:", recentError);
        throw recentError;
      }

      const alertList = [];
      if (students && recentAtt) {
        students.forEach((student) => {
          const studentAtt = recentAtt.filter(
            (a) => a.student_id === student.id,
          );
          const totalDays = studentAtt.length;
          const presentDays = studentAtt.filter(
            (a) => a.status?.toLowerCase() === "hadir",
          ).length;
          const rate =
            totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

          if (totalDays > 0 && rate < 75) {
            alertList.push({
              name: student.full_name,
              nis: student.nis,
              total: totalDays,
              present: presentDays,
              rate: rate,
            });
          }
        });
      }

      setStats({
        totalStudents,
        monthlyAttendanceRate,
        semesterAttendanceRate,
        alerts: alertList.length,
        className: user.homeroom_class_id,
      });
      setAlertStudents(alertList);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setStats({
        totalStudents: 0,
        monthlyAttendanceRate: 0,
        semesterAttendanceRate: 0,
        alerts: 0,
        className: user.homeroom_class_id,
      });
      setAlertStudents([]);
      throw err;
    }
  };

  // ✅ NEW: Tren kehadiran harian - Wali Kelas, buat bulan yang dipilih
  const fetchDailyAttendanceTrend = async (monthKey) => {
    try {
      if (!user.homeroom_class_id) {
        setDailyAttendance([]);
        return;
      }

      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // 0-indexed

      const monthStart = new Date(Date.UTC(year, month, 1))
        .toISOString()
        .split("T")[0];
      const monthEnd = new Date(Date.UTC(year, month + 1, 0))
        .toISOString()
        .split("T")[0];
      const todayStr = getWIBDateString();
      // Kalau bulan yang dipilih adalah bulan berjalan, jangan query
      // melewati hari ini
      const effectiveEnd = monthEnd > todayStr ? todayStr : monthEnd;

      const { data, error } = await supabase
        .from("attendance")
        .select("date, status")
        .eq("class", user.homeroom_class_id)
        .eq("type", "walikelas")
        .gte("date", monthStart)
        .lte("date", effectiveEnd)
        .order("date", { ascending: true });

      if (error) throw error;

      // Kelompokkan per tanggal (satu titik data = satu hari sekolah)
      const dayBuckets = {};
      (data || []).forEach((row) => {
        if (!dayBuckets[row.date]) {
          dayBuckets[row.date] = { total: 0, hadir: 0 };
        }
        dayBuckets[row.date].total += 1;
        if (row.status?.toLowerCase() === "hadir") {
          dayBuckets[row.date].hadir += 1;
        }
      });

      const sortedDays = Object.keys(dayBuckets).sort();
      const trend = sortedDays.map((dateKey) => {
        const bucket = dayBuckets[dateKey];
        const rate =
          bucket.total > 0
            ? Math.round((bucket.hadir / bucket.total) * 100)
            : 0;
        const label = new Date(dateKey + "T00:00:00").toLocaleDateString(
          "id-ID",
          { day: "numeric", month: "numeric" },
        );
        return { label, rate };
      });

      setDailyAttendance(trend);
    } catch (err) {
      console.error("Error fetching daily attendance trend:", err);
      setDailyAttendance([]);
      throw err;
    }
  };

  // ✅ NEW: Stat presensi mapel (total siswa, kehadiran bulan ini &
  // semester ini, siswa perlu perhatian) buat kelas+mapel yang dipilih
  const fetchTeacherMapelStats = async (classId, subject) => {
    try {
      if (!classId || !subject) {
        setTeacherMapelStats({
          totalStudents: 0,
          monthlyAttendanceRate: 0,
          semesterAttendanceRate: 0,
          alerts: 0,
        });
        setTeacherAlertStudents([]);
        return;
      }

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, nis, full_name")
        .eq("class_id", classId)
        .eq("is_active", true);

      if (studentsError) throw studentsError;
      const totalStudents = students?.length || 0;

      const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
      const monthStart = new Date(
        Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), 1),
      )
        .toISOString()
        .split("T")[0];
      const todayStr = getWIBDateString();

      const { data: monthlyAtt, error: monthlyError } = await supabase
        .from("attendance")
        .select("status")
        .eq("class", classId)
        .eq("type", "mapel")
        .eq("mapel", subject)
        .eq("teacher_name", user.full_name)
        .gte("date", monthStart)
        .lte("date", todayStr);

      if (monthlyError) throw monthlyError;
      const monthlyTotal = monthlyAtt?.length || 0;
      const monthlyHadir =
        monthlyAtt?.filter((a) => a.status?.toLowerCase() === "hadir").length ||
        0;
      const monthlyAttendanceRate =
        monthlyTotal > 0 ? Math.round((monthlyHadir / monthlyTotal) * 100) : 0;

      const { startDate: semesterStart } = getCurrentSemesterRange();

      const { data: semesterAtt, error: semesterError } = await supabase
        .from("attendance")
        .select("status")
        .eq("class", classId)
        .eq("type", "mapel")
        .eq("mapel", subject)
        .eq("teacher_name", user.full_name)
        .gte("date", semesterStart)
        .lte("date", todayStr);

      if (semesterError) throw semesterError;
      const semesterTotal = semesterAtt?.length || 0;
      const semesterHadir =
        semesterAtt?.filter((a) => a.status?.toLowerCase() === "hadir")
          .length || 0;
      const semesterAttendanceRate =
        semesterTotal > 0
          ? Math.round((semesterHadir / semesterTotal) * 100)
          : 0;

      const thirtyDaysAgo = new Date(wibNow);
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];

      const { data: recentAtt, error: recentError } = await supabase
        .from("attendance")
        .select("student_id, status, date")
        .eq("class", classId)
        .eq("type", "mapel")
        .eq("mapel", subject)
        .eq("teacher_name", user.full_name)
        .gte("date", startDate);

      if (recentError) throw recentError;

      const alertList = [];
      if (students && recentAtt) {
        students.forEach((student) => {
          const studentAtt = recentAtt.filter(
            (a) => a.student_id === student.id,
          );
          const totalDays = studentAtt.length;
          const presentDays = studentAtt.filter(
            (a) => a.status?.toLowerCase() === "hadir",
          ).length;
          const rate =
            totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

          if (totalDays > 0 && rate < 75) {
            alertList.push({
              name: student.full_name,
              nis: student.nis,
              total: totalDays,
              present: presentDays,
              rate: rate,
            });
          }
        });
      }

      setTeacherMapelStats({
        totalStudents,
        monthlyAttendanceRate,
        semesterAttendanceRate,
        alerts: alertList.length,
      });
      setTeacherAlertStudents(alertList);
    } catch (err) {
      console.error("Error fetching teacher mapel stats:", err);
      setTeacherMapelStats({
        totalStudents: 0,
        monthlyAttendanceRate: 0,
        semesterAttendanceRate: 0,
        alerts: 0,
      });
      setTeacherAlertStudents([]);
    }
  };

  // ✅ NEW: Tren kehadiran harian - Mapel, buat kelas+mapel & bulan yang
  // dipilih
  const fetchTeacherDailyAttendanceTrend = async (
    classId,
    subject,
    monthKey,
  ) => {
    try {
      if (!classId || !subject) {
        setTeacherDailyAttendance([]);
        return;
      }

      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;

      const monthStart = new Date(Date.UTC(year, month, 1))
        .toISOString()
        .split("T")[0];
      const monthEnd = new Date(Date.UTC(year, month + 1, 0))
        .toISOString()
        .split("T")[0];
      const todayStr = getWIBDateString();
      const effectiveEnd = monthEnd > todayStr ? todayStr : monthEnd;

      const { data, error } = await supabase
        .from("attendance")
        .select("date, status")
        .eq("class", classId)
        .eq("type", "mapel")
        .eq("mapel", subject)
        .eq("teacher_name", user.full_name)
        .gte("date", monthStart)
        .lte("date", effectiveEnd)
        .order("date", { ascending: true });

      if (error) throw error;

      const dayBuckets = {};
      (data || []).forEach((row) => {
        if (!dayBuckets[row.date]) {
          dayBuckets[row.date] = { total: 0, hadir: 0 };
        }
        dayBuckets[row.date].total += 1;
        if (row.status?.toLowerCase() === "hadir") {
          dayBuckets[row.date].hadir += 1;
        }
      });

      const sortedDays = Object.keys(dayBuckets).sort();
      const trend = sortedDays.map((dateKey) => {
        const bucket = dayBuckets[dateKey];
        const rate =
          bucket.total > 0
            ? Math.round((bucket.hadir / bucket.total) * 100)
            : 0;
        const label = new Date(dateKey + "T00:00:00").toLocaleDateString(
          "id-ID",
          { day: "numeric", month: "numeric" },
        );
        return { label, rate };
      });

      setTeacherDailyAttendance(trend);
    } catch (err) {
      console.error("Error fetching teacher daily attendance trend:", err);
      setTeacherDailyAttendance([]);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
  };

  if (loading && !dataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Memuat data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.homeroom_class_id && activeTab === "homeroom") {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Belum Ditugaskan Sebagai Wali Kelas
                </h3>
                <p className="text-sm text-yellow-800">
                  Anda belum memiliki penugasan sebagai wali kelas. Silakan
                  hubungi admin untuk setup penugasan kelas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Laporan - Wali Kelas & Guru Mapel
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {user?.full_name || "User"} - Wali Kelas{" "}
                {user?.homeroom_class_id || "-"}
              </p>
            </div>
          </div>
          <p className="text-slate-600">
            Ringkasan presensi siswa sebagai wali kelas dan guru mata pelajaran
          </p>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </span>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-800 hover:text-green-900 font-bold">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </span>
              <button
                onClick={() => setError(null)}
                className="text-red-800 hover:text-red-900 font-bold">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => handleTabChange("homeroom")}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                activeTab === "homeroom"
                  ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}>
              <Users className="w-5 h-5" />
              Laporan Wali Kelas
              <span className="ml-2 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">
                Kelas {user?.homeroom_class_id || "-"}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("teacher")}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                activeTab === "teacher"
                  ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}>
              <BookOpen className="w-5 h-5" />
              Laporan Guru Mapel
              <span className="ml-2 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">
                {teacherClassCount} Kelas
              </span>
            </button>
          </div>
        </div>

        {/* ==================== TAB: WALI KELAS ==================== */}
        {activeTab === "homeroom" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={GraduationCap}
                label="Siswa di Kelas"
                value={stats.totalStudents || 0}
                color="green"
              />
              <StatCard
                icon={Calendar}
                label="Tingkat Kehadiran Bulan Ini"
                value={`${stats.monthlyAttendanceRate || 0}%`}
                color="blue"
              />
              <StatCard
                icon={TrendingUp}
                label="Tingkat Kehadiran Semester Ini"
                value={`${stats.semesterAttendanceRate || 0}%`}
                color="purple"
              />
              <StatCard
                icon={AlertTriangle}
                label="Siswa Perlu Perhatian"
                value={stats.alerts || 0}
                color="red"
                alert={stats.alerts > 0}
              />
            </div>

            <div className="space-y-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Tren Kehadiran Harian
                  </h3>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    {monthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {dailyAttendance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dailyAttendance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval={Math.ceil(dailyAttendance.length / 10) - 1}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(v) => [`${v}%`, "Kehadiran"]} />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-500">
                    Belum ada data presensi untuk bulan ini.
                  </p>
                )}
              </div>
            </div>

            {alertStudents.length > 0 && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 mb-2">
                      Siswa Perlu Perhatian Khusus
                    </h3>
                    <p className="text-sm text-orange-800 mb-3">
                      Siswa dengan tingkat kehadiran di bawah 75% dalam 30 hari
                      terakhir
                    </p>
                    <div className="space-y-2">
                      {alertStudents.map((student, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-lg border border-orange-200">
                          <p className="text-sm font-medium text-slate-800">
                            {student.name} ({student.nis})
                          </p>
                          <p className="text-xs text-slate-600">
                            Kehadiran: {student.rate}% ({student.present} dari{" "}
                            {student.total} hari)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== TAB: GURU MAPEL ==================== */}
        {activeTab === "teacher" && (
          <>
            {teacherAssignments.length === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Belum Ada Penugasan Kelas
                    </h3>
                    <p className="text-sm text-yellow-800">
                      Anda belum memiliki penugasan mata pelajaran. Silakan
                      hubungi admin untuk setup penugasan kelas dan mata
                      pelajaran.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Selector kelas + mapel */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kelas & Mata Pelajaran
                  </label>
                  <select
                    value={
                      selectedClassSubject
                        ? `${selectedClassSubject.class_id}||${selectedClassSubject.subject}`
                        : ""
                    }
                    onChange={(e) => {
                      const [class_id, subject] = e.target.value.split("||");
                      setSelectedClassSubject({ class_id, subject });
                    }}
                    className="w-full md:w-96 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    {classSubjectOptions.map((opt) => (
                      <option
                        key={`${opt.class_id}||${opt.subject}`}
                        value={`${opt.class_id}||${opt.subject}`}>
                        Kelas {opt.class_id} - {opt.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    icon={GraduationCap}
                    label="Siswa di Kelas"
                    value={teacherMapelStats.totalStudents || 0}
                    color="green"
                  />
                  <StatCard
                    icon={Calendar}
                    label="Kehadiran Bulan Ini"
                    value={`${teacherMapelStats.monthlyAttendanceRate || 0}%`}
                    color="blue"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Kehadiran Semester Ini"
                    value={`${teacherMapelStats.semesterAttendanceRate || 0}%`}
                    color="purple"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="Siswa Perlu Perhatian"
                    value={teacherMapelStats.alerts || 0}
                    color="red"
                    alert={teacherMapelStats.alerts > 0}
                  />
                </div>

                <div className="space-y-6 mb-8">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Tren Kehadiran Harian
                      </h3>
                      <select
                        value={selectedTeacherMonth}
                        onChange={(e) =>
                          setSelectedTeacherMonth(e.target.value)
                        }
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        {monthOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {teacherDailyAttendance.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={teacherDailyAttendance}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11 }}
                            interval={
                              Math.ceil(teacherDailyAttendance.length / 10) - 1
                            }
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip formatter={(v) => [`${v}%`, "Kehadiran"]} />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            stroke="#4f46e5"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Belum ada data presensi untuk bulan ini.
                      </p>
                    )}
                  </div>
                </div>

                {teacherAlertStudents.length > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-8">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-orange-900 mb-2">
                          Siswa Perlu Perhatian Khusus
                        </h3>
                        <p className="text-sm text-orange-800 mb-3">
                          Siswa dengan tingkat kehadiran di bawah 75% dalam 30
                          hari terakhir, untuk kelas & mapel ini
                        </p>
                        <div className="space-y-2">
                          {teacherAlertStudents.map((student, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded-lg border border-orange-200">
                              <p className="text-sm font-medium text-slate-800">
                                {student.name} ({student.nis})
                              </p>
                              <p className="text-xs text-slate-600">
                                Kehadiran: {student.rate}% ({student.present}{" "}
                                dari {student.total} hari)
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherReports;
