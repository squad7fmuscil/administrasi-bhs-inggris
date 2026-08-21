// students/StudentPresensi.js
// Riwayat presensi siswa (read-only, punya sendiri doang — bukan buat absen).
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import useStudentProfile from "./useStudentProfile";
import { formatDateShort, getStatusMeta } from "./StudentHelpers";
// Reuse langsung generator PDF yang dipake sisi guru, biar hasil export
// "persis" sama formatnya se-aplikasi (bukan duplikat logic jsPDF di sini).
import { exportStudentAttendancePDF } from "../page/attendance/AttendancePDF";
import { Download, AlertTriangle, FileText } from "lucide-react";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Urutan bulan tahun ajaran: mulai Juli, berakhir Juni tahun berikutnya.
const ACADEMIC_MONTH_ORDER = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

// Tahun ajaran berjalan dihitung otomatis dari tanggal hari ini.
// Juli-Desember -> startYear = tahun berjalan.
// Januari-Juni  -> startYear = tahun berjalan - 1 (masih tahun ajaran lama).
function getCurrentAcademicYear() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const startYear = m >= 7 ? y : y - 1;
  return {
    startYear,
    endYear: startYear + 1,
    label: `${startYear}/${startYear + 1}`,
  };
}

// Daftar 12 bulan dalam satu tahun ajaran, lengkap sama tahun kalender &
// semester masing-masing (buat dipake di dropdown "Bulanan").
function getAcademicMonthOptions(startYear) {
  return ACADEMIC_MONTH_ORDER.map((m) => {
    const year = m >= 7 ? startYear : startYear + 1;
    const semester = m >= 7 ? 1 : 2;
    return { month: m, year, semester, label: `${MONTH_NAMES[m - 1]} ${year}` };
  });
}

export default function StudentPresensi() {
  const {
    student,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // --- State panel export PDF ---
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportMode, setExportMode] = useState("bulanan"); // "bulanan" | "semester"

  const academicYear = useMemo(() => getCurrentAcademicYear(), []);
  const monthOptions = useMemo(
    () => getAcademicMonthOptions(academicYear.startYear),
    [academicYear],
  );

  // Default dropdown bulan: bulan berjalan kalau ada di tahun ajaran ini,
  // kalau nggak (harusnya selalu ada) fallback ke index 0.
  const defaultMonthIdx = useMemo(() => {
    const now = new Date();
    const idx = monthOptions.findIndex(
      (o) => o.month === now.getMonth() + 1 && o.year === now.getFullYear(),
    );
    return idx >= 0 ? idx : 0;
  }, [monthOptions]);

  // Default semester: Ganjil kalau bulan berjalan Jul-Des, Genap kalau Jan-Jun.
  const defaultSemester = useMemo(() => {
    return new Date().getMonth() + 1 >= 7 ? 1 : 2;
  }, []);

  const [selectedMonthIdx, setSelectedMonthIdx] = useState(defaultMonthIdx);
  const [selectedSemester, setSelectedSemester] = useState(defaultSemester);

  useEffect(() => {
    if (!student) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Filter type="walikelas" biar cuma ambil presensi harian, bukan
        // ikut kecampur row "mapel" (absensi Bahasa Inggris per kelas
        // yang juga tersimpan di tabel attendance yang sama).
        // Catatan: attendance.student_id itu FK ke students.id, BUKAN
        // users.id — jadi pake student.studentRecordId, bukan student.id.
        const { data, error: err } = await supabase
          .from("attendance")
          .select("id, date, status")
          .eq("student_id", student.studentRecordId)
          .eq("type", "walikelas")
          .order("date", { ascending: false })
          .limit(60);

        if (err) throw err;
        setHistory(data || []);
      } catch (err) {
        console.error("[StudentPresensi] Gagal ambil riwayat presensi:", err);
        setError("Gagal memuat riwayat presensi. Coba refresh halaman.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [student]);

  if (profileLoading || (student && loading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (profileError === "NO_SESSION") {
    return (
      <div className="text-center py-20 text-sm text-gray-500">
        Sesi Tidka Ketemu. Silakan Login Ulang.
      </div>
    );
  }

  // Ringkasan cepat per status
  const summary = history.reduce(
    (acc, h) => {
      const s = (h.status || "").toLowerCase();
      if (acc[s] !== undefined) acc[s] += 1;
      return acc;
    },
    { hadir: 0, sakit: 0, izin: 0, alpa: 0 },
  );

  // Persentase kehadiran: cuma status "hadir" yang dihitung hadir,
  // selain itu (sakit/izin/alpa) dianggap tidak hadir.
  const total = summary.hadir + summary.sakit + summary.izin + summary.alpa;
  const attendanceRate = total > 0 ? (summary.hadir / total) * 100 : null;
  const isLowAttendance = attendanceRate !== null && attendanceRate < 70;

  const handleExportPDF = async () => {
    if (!student) return;
    setExporting(true);
    setError(null);
    try {
      // Cari nama wali kelas: tabel "classes" gak punya kolom nama/wali
      // kelas sama sekali (cuma id, grade, academic_year, is_active).
      // Wali kelas itu row di tabel "users" dengan role="teacher" dan
      // homeroom_class_id = kelas siswa ini (student.homeroom_class_id).
      // Kalau query gagal atau gak ketemu, fallback ke "-" aja dan PDF
      // tetep kebuat (ga nge-block export).
      let teacherName = "-";
      try {
        const { data: teacherData } = await supabase
          .from("users")
          .select("full_name")
          .eq("homeroom_class_id", student.homeroom_class_id)
          .eq("role", "teacher")
          .maybeSingle();
        if (teacherData?.full_name) {
          teacherName = teacherData.full_name;
        }
      } catch (teacherErr) {
        console.warn(
          "[StudentPresensi] Gagal ambil nama wali kelas, pakai fallback:",
          teacherErr,
        );
      }

      // student_id di tabel attendance FK ke students.id, bukan users.id —
      // jadi payload ke exportStudentAttendancePDF pake studentRecordId.
      const studentPayload = {
        id: student.studentRecordId,
        nis: student.nis,
        full_name: student.full_name,
      };

      const basePayload = {
        student: studentPayload,
        attendanceType: "harian",
        homeroomClass: student.kelas,
        academicYear: academicYear.label,
        teacherName,
      };

      let result;
      if (exportMode === "bulanan") {
        const opt = monthOptions[selectedMonthIdx];
        result = await exportStudentAttendancePDF({
          ...basePayload,
          mode: "bulanan",
          month: opt.month,
          year: opt.year,
          semester: opt.semester,
        });
      } else {
        const semYear =
          selectedSemester === 1
            ? academicYear.startYear
            : academicYear.endYear;
        result = await exportStudentAttendancePDF({
          ...basePayload,
          mode: "semester",
          year: semYear,
          semester: selectedSemester,
        });
      }

      if (!result?.success) {
        setError(result?.message || "Gagal membuat PDF.");
      } else {
        setShowExportPanel(false);
      }
    } catch (err) {
      console.error("[StudentPresensi] Gagal export PDF:", err);
      setError("Gagal membuat PDF. Coba lagi ya.");
    } finally {
      setExporting(false);
    }
  };

  const summaryCards = [
    {
      key: "hadir",
      label: "Hadir",
      value: summary.hadir,
      color: getStatusMeta("hadir").color,
    },
    {
      key: "sakit",
      label: "Sakit",
      value: summary.sakit,
      color: getStatusMeta("sakit").color,
    },
    {
      key: "izin",
      label: "Izin",
      value: summary.izin,
      color: getStatusMeta("izin").color,
    },
    {
      key: "alpa",
      label: "Alpa",
      value: summary.alpa,
      color: getStatusMeta("alpa").color,
    },
  ];

  return (
    <>
      <h1 className="text-lg font-bold text-gray-800">Presensi Saya</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {isLowAttendance && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>
            Kehadiran kamu baru <strong>{attendanceRate.toFixed(1)}%</strong>,
            masih di bawah 70%. Yuk lebih rajin masuk kelas ya, biar nggak kena
            masalah akademik ke depannya!
          </span>
        </div>
      )}

      {/* Ringkasan */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {summaryCards.map(({ key, label, value, color }) => (
            <div
              key={key}
              className={`rounded-xl border p-3 text-center ${color}`}>
              <p className="text-lg font-bold leading-none">{value}</p>
              <p className="text-[11px] font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div
            className={`rounded-xl border p-3 text-center ${
              isLowAttendance
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}>
            <p className="text-lg font-bold leading-none">
              {attendanceRate !== null ? `${attendanceRate.toFixed(0)}%` : "-"}
            </p>
            <p className="text-[11px] font-medium mt-1">Kehadiran</p>
          </div>

          <button
            onClick={() => setShowExportPanel((v) => !v)}
            disabled={history.length === 0}
            className="rounded-xl border p-3 text-center bg-white border-gray-200 text-gray-700 flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={16} />
            <p className="text-[11px] font-semibold mt-0.5">Export PDF</p>
          </button>
        </div>
      </div>

      {/* Panel pilihan export PDF */}
      {showExportPanel && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <FileText size={15} />
            Export Laporan Presensi
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setExportMode("bulanan")}
              className={`flex-1 text-xs font-semibold py-2 rounded-full border ${
                exportMode === "bulanan"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
              Bulanan
            </button>
            <button
              onClick={() => setExportMode("semester")}
              className={`flex-1 text-xs font-semibold py-2 rounded-full border ${
                exportMode === "semester"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
              Semester
            </button>
          </div>

          {exportMode === "bulanan" ? (
            <select
              value={selectedMonthIdx}
              onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white">
              {monthOptions.map((opt, idx) => (
                <option key={idx} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSemester(1)}
                className={`flex-1 text-xs font-semibold py-2 rounded-full border ${
                  selectedSemester === 1
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}>
                Ganjil ({academicYear.startYear})
              </button>
              <button
                onClick={() => setSelectedSemester(2)}
                className={`flex-1 text-xs font-semibold py-2 rounded-full border ${
                  selectedSemester === 2
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}>
                Genap ({academicYear.endYear})
              </button>
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center">
            Tahun Ajaran {academicYear.label}
          </p>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed">
            <Download size={13} />
            {exporting ? "Membuat PDF..." : "Export PDF"}
          </button>
        </div>
      )}

      {/* Riwayat */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-2">
          Riwayat Presensi
        </h2>
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">
            Belum Ada Data Presensi.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h) => {
              const meta = getStatusMeta(h.status);
              const Icon = meta.icon;
              return (
                <div
                  key={h.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {formatDateShort(h.date)}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                    <Icon size={13} />
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
