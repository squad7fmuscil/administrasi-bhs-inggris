import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  getStudentSession,
  clearStudentSession,
} from "../utils/studentSession";
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Home,
  Bell,
  Users as UsersIcon,
  Grid3x3,
} from "lucide-react";

// ========================================================================
// KONFIGURASI SCHEMA — SESUAIKAN DENGAN NAMA TABEL/KOLOM ASLI LO
// ========================================================================
// Asumsi yang dipake di file ini (edit kalau beda di database lo):
// - Login pake tabel "users" biasa (bukan Supabase Auth) — sesi disimpen
//   di localStorage key "student_session" oleh Login.js
// - tabel "attendance": ada kolom `class_id` (buat query absen 1 kelas
//   sekaligus, bukan cuma 1 siswa)
// - tabel "piket_schedule": kolom `kelas_id`, `hari`, `siswa_id` (FK ke
//   users.id), join ke users buat ambil nama
// ========================================================================

// ========== HELPERS ==========
const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const getDayName = (date = new Date()) => DAY_NAMES[date.getDay()];

const formatDate = (date = new Date()) =>
  date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const getStatusMeta = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "hadir")
    return {
      label: "Hadir",
      color: "bg-green-100 text-green-700 border-green-300",
      icon: CheckCircle,
    };
  if (s === "sakit")
    return {
      label: "Sakit",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      icon: AlertCircle,
    };
  if (s === "izin")
    return {
      label: "Izin",
      color: "bg-blue-100 text-blue-700 border-blue-300",
      icon: AlertCircle,
    };
  if (s === "alpa")
    return {
      label: "Alpa",
      color: "bg-red-100 text-red-700 border-red-300",
      icon: XCircle,
    };
  return {
    label: "Belum ada data",
    color: "bg-gray-100 text-gray-600 border-gray-300",
    icon: AlertCircle,
  };
};

// Cek apakah jam pelajaran ini lagi berlangsung sekarang
const isOngoing = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
};

// ========== BOTTOM NAVBAR ==========
function BottomNav({ active }) {
  const items = [
    { key: "home", label: "Home", icon: Home, href: "/siswa" },
    { key: "jadwal", label: "Jadwal", icon: Calendar, href: "/siswa/jadwal" },
    {
      key: "presensi",
      label: "Presensi",
      icon: CheckCircle,
      href: "/siswa/presensi",
    },
    { key: "lainnya", label: "Lainnya", icon: Grid3x3, href: "/siswa/lainnya" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex items-stretch z-50 pb-safe">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <a
            key={item.key}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition ${
              isActive ? "text-blue-600" : "text-gray-400"
            }`}>
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

// ========== COMPONENT ==========
export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [absentToday, setAbsentToday] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [piketToday, setPiketToday] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      // 1. Cek sesi siswa (localStorage + cookie fallback, ditulis pas
      //    login di Login.js)
      const session = getStudentSession();
      if (!session) {
        console.error(
          "[StudentDashboard] Sesi gak ketemu di localStorage maupun cookie.",
        );
        setError("NO_SESSION");
        setLoading(false);
        return;
      }

      try {
        // 2. Ambil profil siswa terbaru dari database (session cuma snapshot
        //    pas login, data terbaru tetep di-fetch ulang di sini)
        const { data: userData, error: userErr } = await supabase
          .from("users")
          .select("id, username, full_name, homeroom_class_id, role, is_active")
          .eq("id", session.id)
          .eq("role", "student")
          .maybeSingle();

        console.log("DEBUG session:", session);
        console.log("DEBUG userData:", userData, "userErr:", userErr);

        if (userErr) throw userErr;
        if (!userData || !userData.is_active) {
          console.error(
            "[StudentDashboard] Session ada tapi data siswa gak ketemu / non-aktif di database. session.id:",
            session.id,
          );
          clearStudentSession();
          setError("NO_SESSION");
          setLoading(false);
          return;
        }

        setStudent(userData);

        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const todayName = getDayName(today);

        // 3. Presensi hari ini — status sendiri
        const { data: myAtt } = await supabase
          .from("attendance")
          .select("status")
          .eq("student_id", userData.id)
          .eq("date", todayStr)
          .maybeSingle();

        setTodayStatus(myAtt?.status || null);

        // 4. Presensi hari ini — siswa sekelas yang gak hadir (exclude diri sendiri)
        const { data: classAtt } = await supabase
          .from("attendance")
          .select("status, users:student_id (full_name)")
          .eq("class_id", userData.homeroom_class_id)
          .eq("date", todayStr)
          .neq("student_id", userData.id)
          .in("status", ["sakit", "izin", "alpa"]);

        setAbsentToday(classAtt || []);

        // 5. Jadwal hari ini doang (jadwal mingguan lengkap pindah ke menu Jadwal)
        const { data: schedData } = await supabase
          .from("jadwal")
          .select("id, day, subject, start_time, end_time, teacher_name")
          .eq("class", userData.homeroom_class_id)
          .eq("day", todayName)
          .order("start_time", { ascending: true });

        setTodaySchedule(schedData || []);

        // 6. Piket hari ini
        const { data: piketData } = await supabase
          .from("piket_schedule")
          .select("siswa_id, users:siswa_id (full_name)")
          .eq("kelas_id", userData.homeroom_class_id)
          .eq("hari", todayName);

        setPiketToday(piketData || []);

        // 7. Pengumuman terbaru (3 aja di dashboard, selebihnya gak perlu di sini)
        const { data: annData } = await supabase
          .from("pengumuman")
          .select("id, title, content, created_at")
          .eq("target_class", userData.homeroom_class_id)
          .order("created_at", { ascending: false })
          .limit(3);

        setAnnouncements(annData || []);
      } catch (err) {
        console.error("Error loading student dashboard:", err);
        setError("Gagal memuat data. Coba refresh halaman.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    clearStudentSession();
    window.location.href = "/login";
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error === "NO_SESSION") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <p className="text-gray-700 font-semibold mb-2">
            Sesi belum ditemukan
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Sesi login siswa gak ketemu atau udah gak valid. Klik tombol di
            bawah buat login ulang. (Ini gak otomatis reload — biar gak keloop.)
          </p>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  const statusMeta = getStatusMeta(todayStatus);
  const StatusIcon = statusMeta.icon;
  const isSayaPiket = piketToday.some((p) => p.siswa_id === student?.id);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ====== HEADER ====== */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">
                {student?.full_name?.split(" ")[0] || "Siswa"}
              </h1>
              <p className="text-blue-100 text-xs">
                Kelas {student?.homeroom_class_id || "-"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition text-xs font-medium">
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ====== GREETING ====== */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xl font-bold text-gray-800">
            Selamat datang, {student?.full_name?.split(" ")[0] || "Siswa"} 👋
          </h2>
          <p className="text-gray-400 text-xs mt-1">{formatDate()}</p>
        </section>

        {/* ====== PRESENSI HARI INI ====== */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            Presensi Hari Ini
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div
              className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border w-fit ${statusMeta.color}`}>
              <StatusIcon size={16} />
              {statusMeta.label}
            </div>

            {absentToday.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Tidak Hadir Hari Ini
                </p>
                <div className="space-y-1.5">
                  {absentToday.map((a, idx) => {
                    const meta = getStatusMeta(a.status);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {a.users?.full_name || "-"}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ====== PIKET HARI INI ====== */}
        {piketToday.length > 0 && (
          <section>
            <div
              className={`rounded-2xl border p-4 shadow-sm ${
                isSayaPiket
                  ? "bg-orange-50 border-orange-200"
                  : "bg-white border-gray-100"
              }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <UsersIcon size={18} className="text-orange-500" />
                <p className="text-sm font-bold text-gray-800">
                  Piket Hari Ini
                </p>
                {isSayaPiket && (
                  <span className="text-[10px] font-semibold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                    Kamu piket!
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {piketToday
                  .map((p) => p.users?.full_name)
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </section>
        )}

        {/* ====== JADWAL HARI INI ====== */}
        <section>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-2">
            <Clock size={18} className="text-blue-500" />
            Jadwal Hari Ini
          </h2>
          {todaySchedule.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm shadow-sm">
              🎉 Tidak ada jadwal hari ini.
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((item) => {
                const ongoing = isOngoing(item.start_time, item.end_time);
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 shadow-sm flex items-center justify-between transition ${
                      ongoing
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-100"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          ongoing
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                        {item.start_time?.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">
                            {item.subject}
                          </p>
                          {ongoing && (
                            <span className="text-[10px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                              Berlangsung
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {item.teacher_name || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {item.start_time?.slice(0, 5)}–
                      {item.end_time?.slice(0, 5)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ====== PENGUMUMAN ====== */}
        {announcements.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-2">
              <Bell size={18} className="text-yellow-500" />
              Pengumuman
            </h2>
            <div className="space-y-2">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 text-sm">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{item.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav active="home" />
    </div>
  );
}
