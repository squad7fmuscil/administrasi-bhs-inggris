import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  User,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Home,
  Bell,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

// ========== HELPERS ==========
const getDayName = (date = new Date()) => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[date.getDay()];
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "hadir")
    return {
      color: "bg-green-100 text-green-700 border-green-300",
      icon: CheckCircle,
    };
  if (s === "sakit")
    return {
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      icon: AlertCircle,
    };
  if (s === "izin")
    return {
      color: "bg-blue-100 text-blue-700 border-blue-300",
      icon: AlertCircle,
    };
  if (s === "alpa" || s === "alpha")
    return { color: "bg-red-100 text-red-700 border-red-300", icon: XCircle };
  return {
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: AlertCircle,
  };
};

// ========== COMPONENT ==========
export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      const sessionRaw = localStorage.getItem("student_session");
      if (!sessionRaw) {
        window.location.href = "/login";
        return;
      }

      let session;
      try {
        session = JSON.parse(sessionRaw);
      } catch {
        localStorage.removeItem("student_session");
        window.location.href = "/login";
        return;
      }

      try {
        // 1. Ambil data siswa
        const { data: userData, error: userErr } = await supabase
          .from("users")
          .select("id, username, full_name, homeroom_class_id, role, is_active")
          .eq("id", session.id)
          .eq("role", "student")
          .maybeSingle();

        if (userErr) throw userErr;
        if (!userData || !userData.is_active) {
          localStorage.removeItem("student_session");
          window.location.href = "/login";
          return;
        }

        setStudent(userData);

        // 2. Ambil presensi (30 hari terakhir)
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("id, date, status, notes")
          .eq("student_id", userData.id)
          .order("date", { ascending: false })
          .limit(30);

        if (attErr) {
          // Fallback: coba pake kolom nis
          const { data: attByNis, error: errNis } = await supabase
            .from("attendance")
            .select("id, date, status, notes")
            .eq("nis", userData.username)
            .order("date", { ascending: false })
            .limit(30);
          if (!errNis) setAttendance(attByNis || []);
        } else {
          setAttendance(attData || []);
        }

        // 3. Ambil jadwal
        const { data: schedData, error: schedErr } = await supabase
          .from("jadwal")
          .select("id, day, subject, start_time, end_time, teacher_name")
          .eq("class", userData.homeroom_class_id)
          .order("start_time", { ascending: true });

        if (!schedErr) setSchedule(schedData || []);

        // 4. Ambil pengumuman (opsional)
        const { data: annData, error: annErr } = await supabase
          .from("pengumuman")
          .select("id, title, content, created_at")
          .eq("target_class", userData.homeroom_class_id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!annErr) setAnnouncements(annData || []);
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
    localStorage.removeItem("student_session");
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

  const todayName = getDayName();
  const todaySchedule = schedule.filter(
    (s) => s.day?.toLowerCase() === todayName.toLowerCase(),
  );

  // Statistik presensi
  const totalHadir = attendance.filter(
    (a) => a.status?.toLowerCase() === "hadir",
  ).length;
  const totalSakit = attendance.filter(
    (a) => a.status?.toLowerCase() === "sakit",
  ).length;
  const totalIzin = attendance.filter(
    (a) => a.status?.toLowerCase() === "izin",
  ).length;
  const totalAlpa = attendance.filter(
    (a) =>
      a.status?.toLowerCase() === "alpa" || a.status?.toLowerCase() === "alpha",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ====== HEADER ====== */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-50 shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-lg transition lg:hidden">
              {showMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div>
              <h1 className="text-lg font-bold">Dashboard Siswa</h1>
              <p className="text-blue-100 text-xs">SMP Muslimin Cililin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition text-sm font-medium">
            <LogOut size={16} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>

        {/* ====== MOBILE MENU ====== */}
        {showMenu && (
          <div className="lg:hidden bg-blue-700/95 backdrop-blur-sm px-4 py-3 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-semibold">{student?.full_name || "Siswa"}</p>
                <p className="text-blue-200 text-xs">
                  Kelas {student?.homeroom_class_id || "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ====== GREETING + STATS ====== */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Halo, {student?.full_name?.split(" ")[0] || "Siswa"}! 👋
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  Kelas {student?.homeroom_class_id || "-"} · NIS{" "}
                  {student?.username || "-"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                <Calendar size={16} />
                <span>{formatDate(new Date())}</span>
              </div>
            </div>

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="text-center p-2 bg-green-50 rounded-xl">
                <p className="text-lg font-bold text-green-600">{totalHadir}</p>
                <p className="text-[10px] text-green-500 font-medium">Hadir</p>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-xl">
                <p className="text-lg font-bold text-yellow-600">
                  {totalSakit}
                </p>
                <p className="text-[10px] text-yellow-500 font-medium">Sakit</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-xl">
                <p className="text-lg font-bold text-blue-600">{totalIzin}</p>
                <p className="text-[10px] text-blue-500 font-medium">Izin</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-xl">
                <p className="text-lg font-bold text-red-600">{totalAlpa}</p>
                <p className="text-[10px] text-red-500 font-medium">Alpa</p>
              </div>
            </div>
          </div>
        </section>

        {/* ====== JADWAL HARI INI ====== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              Jadwal Hari Ini
              <span className="text-sm font-normal text-gray-400">
                ({todayName})
              </span>
            </h2>
          </div>
          {todaySchedule.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm shadow-sm">
              🎉 Tidak ada jadwal hari ini. Istirahat dulu!
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                      {item.start_time?.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.subject}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.teacher_name || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {item.start_time?.slice(0, 5)} -{" "}
                    {item.end_time?.slice(0, 5)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ====== SEMUA JADWAL ====== */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
            <BookOpen size={20} className="text-purple-500" />
            Jadwal Mingguan
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {schedule.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Belum ada jadwal.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">
                        {item.day}
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {item.subject}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {item.start_time?.slice(0, 5)} -{" "}
                      {item.end_time?.slice(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ====== RIWAYAT PRESENSI ====== */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
            <CheckCircle size={20} className="text-green-500" />
            Riwayat Presensi
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {attendance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Belum ada data presensi.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {attendance.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition">
                      <div>
                        <p className="text-sm text-gray-700">
                          {formatDate(item.date)}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${badge.color}`}>
                        <Icon size={12} />
                        {item.status || "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ====== PENGUMUMAN (OPSIONAL) ====== */}
        {announcements.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
              <Bell size={20} className="text-yellow-500" />
              Pengumuman
            </h2>
            <div className="space-y-2">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 mt-6">
        © 2026 SMP Muslimin Cililin · Dashboard Siswa v1.0
      </footer>
    </div>
  );
}
