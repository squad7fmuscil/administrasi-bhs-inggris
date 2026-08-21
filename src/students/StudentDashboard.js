import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useStudentProfile from "./useStudentProfile";
import {
  DAY_NAMES,
  getDayName,
  formatDate,
  getStatusMeta,
  isOngoing,
} from "./studentHelpers";
import { Clock, CheckCircle, Bell, Users as UsersIcon } from "lucide-react";

// ========================================================================
// KONFIGURASI SCHEMA — SESUAIKAN DENGAN NAMA TABEL/KOLOM ASLI LO
// ========================================================================
// - tabel "attendance": kolom `class_id` (buat query absen 1 kelas sekaligus)
// - tabel "piket_schedule": kolom `kelas_id`, `hari`, `siswa_id` (FK ke
//   users.id), join ke users buat ambil nama
// - Header + navigasi sekarang dihandle StudentLayout.js (bukan lagi di
//   file ini) — komponen ini fokus ke konten aja.
// ========================================================================

export default function StudentDashboard({ onPageChange }) {
  const {
    student,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile();

  const [todayStatus, setTodayStatus] = useState(null);
  const [absentToday, setAbsentToday] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [piketToday, setPiketToday] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    // Tunggu profil siswa siap dulu (dari useStudentProfile) sebelum ambil
    // data lain yang butuh homeroom_class_id / student.id
    if (!student) return;

    const loadData = async () => {
      setDataLoading(true);
      setDataError(null);

      try {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const todayName = getDayName(today);

        // Presensi hari ini — status sendiri
        const { data: myAtt } = await supabase
          .from("attendance")
          .select("status")
          .eq("student_id", student.id)
          .eq("date", todayStr)
          .maybeSingle();

        setTodayStatus(myAtt?.status || null);

        // Presensi hari ini — siswa sekelas yang gak hadir (exclude diri sendiri)
        const { data: classAtt } = await supabase
          .from("attendance")
          .select("status, users:student_id (full_name)")
          .eq("class_id", student.homeroom_class_id)
          .eq("date", todayStr)
          .neq("student_id", student.id)
          .in("status", ["sakit", "izin", "alpa"]);

        setAbsentToday(classAtt || []);

        // Jadwal hari ini doang (jadwal mingguan lengkap ada di menu Jadwal)
        const { data: schedData } = await supabase
          .from("jadwal")
          .select("id, day, subject, start_time, end_time, teacher_name")
          .eq("class", student.homeroom_class_id)
          .eq("day", todayName)
          .order("start_time", { ascending: true });

        setTodaySchedule(schedData || []);

        // Piket hari ini
        const { data: piketData } = await supabase
          .from("piket_schedule")
          .select("siswa_id, users:siswa_id (full_name)")
          .eq("kelas_id", student.homeroom_class_id)
          .eq("hari", todayName);

        setPiketToday(piketData || []);

        // Pengumuman terbaru (3 aja di dashboard, selebihnya di menu Lainnya)
        const { data: annData } = await supabase
          .from("pengumuman")
          .select("id, title, content, created_at")
          .eq("target_class", student.homeroom_class_id)
          .order("created_at", { ascending: false })
          .limit(3);

        setAnnouncements(annData || []);
      } catch (err) {
        console.error("Error loading student dashboard:", err);
        setDataError("Gagal memuat data. Coba refresh halaman.");
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [student]);

  // ========== RENDER ==========
  const loading = profileLoading || (student && dataLoading);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  if (profileError === "NO_SESSION") {
    return (
      <div className="flex items-center justify-center py-20 px-4">
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
    <>
      {dataError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ⚠️ {dataError}
        </div>
      )}

      {/* ====== GREETING ====== */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xl font-bold text-gray-800">
          Selamat Datang, {student?.full_name?.split(" ")[0] || "Siswa"} 👋
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
              <p className="text-sm font-bold text-gray-800">Piket Hari Ini</p>
              {isSayaPiket && (
                <span className="text-[10px] font-semibold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  Hari Ini Jadwalnya Kamu Piket !
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-blue-500" />
            Jadwal Hari Ini
          </h2>
          <button
            onClick={() => onPageChange && onPageChange("student-jadwal")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            Lihat Semua
          </button>
        </div>
        {todaySchedule.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm shadow-sm">
            🎉 Tidak Ada Jadwal Hari Ini.
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
                    {item.start_time?.slice(0, 5)}–{item.end_time?.slice(0, 5)}
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Bell size={18} className="text-yellow-500" />
              Pengumuman
            </h2>
            <button
              onClick={() => onPageChange && onPageChange("student-lainnya")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Lihat Semua
            </button>
          </div>
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
    </>
  );
}
