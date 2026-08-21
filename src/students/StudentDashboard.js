import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useStudentProfile from "./useStudentProfile";
import {
  DAY_NAMES,
  getDayName,
  formatDate,
  getStatusMeta,
  isOngoing,
} from "./StudentHelpers";
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
        // Pake tanggal lokal (WIB), bukan today.toISOString() yang convert
        // ke UTC dulu — kalau dipake toISOString, jam 00:00-06:59 WIB bakal
        // ke-hitung tanggal kemarin (UTC+7).
        const todayStr = `${today.getFullYear()}-${String(
          today.getMonth() + 1,
        ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const todayName = getDayName(today);

        const [
          { data: myAtt, error: myAttErr },
          { data: schedData, error: schedErr },
          { data: piketData, error: piketErr },
          { data: annData, error: annErr },
        ] = await Promise.all([
          // Presensi hari ini — status sendiri (khusus row "walikelas" /
          // harian, karena ada juga row "mapel" dari absensi Bahasa Inggris
          // yang gak dipake buat dashboard ini)
          // Catatan: attendance.student_id itu FK ke students.id, BUKAN
          // users.id — jadi pake student.studentRecordId, bukan student.id.
          supabase
            .from("attendance")
            .select("status")
            .eq("student_id", student.studentRecordId)
            .eq("date", todayStr)
            .eq("type", "walikelas")
            .maybeSingle(),

          // Jadwal hari ini doang (jadwal mingguan lengkap ada di menu Jadwal)
          // Catatan: tabel "jadwal" gak eksis, diganti "class_schedules"
          // (tabel baru, input manual, khusus jadwal per kelas — beda
          // dari "teacher_schedules" yang per-guru)
          supabase
            .from("class_schedules")
            .select("id, day, subject, start_time, end_time, teacher_name")
            .eq("class_id", student.homeroom_class_id)
            .eq("day", todayName)
            .order("start_time", { ascending: true }),

          // Piket hari ini
          supabase
            .from("piket_schedule")
            .select("siswa_id, users:siswa_id (full_name)")
            .eq("kelas_id", student.homeroom_class_id)
            .eq("hari", todayName),

          // Pengumuman terbaru (3 aja di dashboard, selebihnya di menu Lainnya)
          supabase
            .from("pengumuman")
            .select("id, title, content, created_at")
            .eq("target_class", student.homeroom_class_id)
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        // Kumpulin semua error query (kalau ada) biar keliatan di UI,
        // bukan diem-diem nampilin data kosong kayak sebelumnya.
        const errors = [
          myAttErr && "presensi kamu",
          schedErr && "jadwal",
          piketErr && "piket",
          annErr && "pengumuman",
        ].filter(Boolean);

        if (errors.length > 0) {
          console.error("Dashboard query errors:", {
            myAttErr,
            schedErr,
            piketErr,
            annErr,
          });
          setDataError(`Gagal memuat data: ${errors.join(", ")}.`);
        }

        setTodayStatus(myAtt?.status || null);
        setTodaySchedule(schedData || []);
        setPiketToday(piketData || []);
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

  // Susun nama piket + tandain mana yang siswa yang lagi login (buat notice)
  const piketNames = piketToday
    .map((p) => ({
      siswaId: p.siswa_id,
      name: p.users?.full_name,
      isMe: p.siswa_id === student?.id,
    }))
    .filter((p) => p.name);
  const isSayaPiket = piketNames.some((p) => p.isMe);

  // Split 2 kolom: kolom 1 duluan diisi (4 orang), sisanya kolom 2 (3 orang,
  // atau 4-4 kalau totalnya 8 kayak hari Jumat) — otomatis ngikutin jumlah,
  // gak di-hardcode per hari.
  const piketHalf = Math.ceil(piketNames.length / 2);
  const piketCol1 = piketNames.slice(0, piketHalf);
  const piketCol2 = piketNames.slice(piketHalf);

  // Gabungin jam pelajaran yang beruntun & mapelnya sama jadi 1 blok
  // (misal jam ke-1 & ke-2 sama-sama Bahasa Inggris → jadi "2JP (1-2)").
  // Nomor jam pelajaran (period) diambil dari urutan array aja (index+1),
  // karena todaySchedule udah di-sort ascending by start_time dari query.
  const scheduleBlocks = [];
  todaySchedule.forEach((item, idx) => {
    const period = idx + 1;
    const prev = scheduleBlocks[scheduleBlocks.length - 1];
    const nyambung =
      prev &&
      prev.subject === item.subject &&
      prev.teacher_name === item.teacher_name &&
      prev.end_time === item.start_time;

    if (nyambung) {
      prev.end_time = item.end_time;
      prev.endPeriod = period;
      prev.jp += 1;
    } else {
      scheduleBlocks.push({
        id: item.id,
        subject: item.subject,
        teacher_name: item.teacher_name,
        start_time: item.start_time,
        end_time: item.end_time,
        startPeriod: period,
        endPeriod: period,
        jp: 1,
      });
    }
  });

  const timeToMinutes = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const nowMinutes = (() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  })();

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
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-600">Presensi Saya :</p>
          <div
            className={`flex items-center gap-1.5 text-base font-bold px-3 py-1.5 rounded-xl border ${statusMeta.color}`}>
            <StatusIcon size={18} />
            {statusMeta.label}
          </div>
        </div>
      </section>

      {/* ====== PIKET HARI INI ====== */}
      {piketNames.length > 0 && (
        <section>
          <div
            className={`rounded-2xl border p-4 shadow-sm ${
              isSayaPiket
                ? "bg-orange-50 border-orange-300"
                : "bg-white border-gray-100"
            }`}>
            <div className="flex items-center gap-2 mb-3">
              <UsersIcon size={18} className="text-orange-500" />
              <p className="text-sm font-bold text-gray-800">Piket Hari Ini</p>
            </div>

            {/* Notice khusus kalau siswa yang login kebagian piket hari ini */}
            {isSayaPiket && (
              <div className="flex items-center gap-2 bg-orange-500 text-white text-xs font-semibold px-3 py-2.5 rounded-xl mb-3">
                <span className="text-base leading-none">🧹</span>
                <span>Kamu kebagian piket hari ini, jangan lupa ya!</span>
              </div>
            )}

            {isSayaPiket ? (
              // Kalau kebagian piket: tampilin daftar 1 kelompok (2 kolom)
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                <div className="space-y-1.5">
                  {piketCol1.map((p) => (
                    <div
                      key={p.siswaId}
                      className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-lg truncate ${
                        p.isMe
                          ? "bg-orange-500 text-white font-semibold"
                          : "bg-gray-50 text-gray-700"
                      }`}>
                      {p.isMe ? "👉 " : ""}
                      {p.name}
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {piketCol2.map((p) => (
                    <div
                      key={p.siswaId}
                      className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-lg truncate ${
                        p.isMe
                          ? "bg-orange-500 text-white font-semibold"
                          : "bg-gray-50 text-gray-700"
                      }`}>
                      {p.isMe ? "👉 " : ""}
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Kalau bukan giliran dia: gak usah nampilin nama kelompok
              // lain, cukup notice simpel biar clean.
              <p className="text-sm text-gray-400 text-center py-1">
                Tidak ada jadwal piket buat Anda hari ini
              </p>
            )}
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
        {scheduleBlocks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm shadow-sm">
            🎉 Tidak Ada Jadwal Hari Ini.
          </div>
        ) : (
          <div className="space-y-2">
            {scheduleBlocks.map((block) => {
              const ongoing = isOngoing(block.start_time, block.end_time);
              const endMinutes = timeToMinutes(block.end_time);
              const statusLabel = ongoing
                ? "Berlangsung"
                : nowMinutes > endMinutes
                  ? "Selesai"
                  : "Akan Datang";
              const jpLabel =
                block.jp > 1
                  ? `${block.jp}JP (${block.startPeriod}-${block.endPeriod})`
                  : `${block.jp}JP (${block.startPeriod})`;

              return (
                <div
                  key={block.id}
                  className={`rounded-2xl border p-4 shadow-sm transition ${
                    ongoing
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-100"
                  }`}>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {jpLabel}
                  </span>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-medium text-gray-800">
                      {block.start_time?.slice(0, 5)} –{" "}
                      {block.end_time?.slice(0, 5)}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        ongoing
                          ? "text-blue-600"
                          : statusLabel === "Selesai"
                            ? "text-gray-400"
                            : "text-emerald-600"
                      }`}>
                      {statusLabel}
                    </p>
                  </div>
                  <p className="font-bold text-gray-800 uppercase mt-1">
                    {block.subject}
                  </p>
                  {block.teacher_name && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      🧑‍🏫 {block.teacher_name}
                    </p>
                  )}
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
