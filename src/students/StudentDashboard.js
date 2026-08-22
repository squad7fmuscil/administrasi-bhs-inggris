import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useStudentProfile from "./useStudentProfile";
import {
  DAY_NAMES,
  getDayName,
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

// Ambang batas buat badge "Kehadiran Bagus" — 90% itu standar umum yang
// dipake sekolah buat kategori kehadiran baik (biasanya juga jadi syarat
// minimal terkait kenaikan kelas). Gampang diubah di sini kalau kebijakan
// sekolah beda.
const ATTENDANCE_GOOD_THRESHOLD = 90;

const getGreetingWord = () => {
  const h = new Date().getHours();
  if (h < 10) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
};

// Nama depan doang buat greeting — apapun panjang nama lengkapnya
// (2 kata atau 4 kata), hasilnya tetep pendek & konsisten, ketimbang
// disingkat jadi inisial (mis. "Ahmad F. R.") yang kurang enak dilihat.
const getDisplayName = (fullName) => {
  if (!fullName) return "Siswa";
  return fullName.trim().split(/\s+/)[0];
};

export default function StudentDashboard({ onPageChange }) {
  const {
    student,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile();

  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceRate, setAttendanceRate] = useState(null); // persen hadir bulan ini, null kalau belum ada data
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

        // Awal bulan berjalan, buat scope hitung persentase kehadiran
        // ("bulan ini" biar relevan sama kondisi terkini, bukan history
        // dari awal tahun ajaran yang query-nya lebih berat).
        const firstOfMonthStr = `${today.getFullYear()}-${String(
          today.getMonth() + 1,
        ).padStart(2, "0")}-01`;

        const [
          { data: myAtt, error: myAttErr },
          { data: schedData, error: schedErr },
          { data: piketData, error: piketErr },
          { data: annData, error: annErr },
          { data: monthAttData, error: monthAttErr },
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

          // History presensi bulan ini (khusus row "walikelas", sama kayak
          // query todayStatus) — dipake buat itung persentase kehadiran.
          // Nilai status "Hadir" (H besar) — samain kayak Attendance.js.
          supabase
            .from("attendance")
            .select("status")
            .eq("student_id", student.studentRecordId)
            .eq("type", "walikelas")
            .gte("date", firstOfMonthStr)
            .lte("date", todayStr),
        ]);

        // Kumpulin semua error query (kalau ada) biar keliatan di UI,
        // bukan diem-diem nampilin data kosong kayak sebelumnya.
        const errors = [
          myAttErr && "presensi kamu",
          schedErr && "jadwal",
          piketErr && "piket",
          annErr && "pengumuman",
          monthAttErr && "riwayat kehadiran",
        ].filter(Boolean);

        if (errors.length > 0) {
          console.error("Dashboard query errors:", {
            myAttErr,
            schedErr,
            piketErr,
            annErr,
            monthAttErr,
          });
          setDataError(`Gagal memuat data: ${errors.join(", ")}.`);
        }

        setTodayStatus(myAtt?.status || null);
        setTodaySchedule(schedData || []);
        setPiketToday(piketData || []);
        setAnnouncements(annData || []);

        // CATATAN: nilai kolom `status` yang berarti "hadir" itu string
        // "Hadir" (H besar) — samain persis kayak yang dipake di
        // Attendance.js pas guru input presensi.
        if (monthAttData && monthAttData.length > 0) {
          const hadirCount = monthAttData.filter(
            (r) => r.status === "Hadir",
          ).length;
          setAttendanceRate(
            Math.round((hadirCount / monthAttData.length) * 100),
          );
        } else {
          setAttendanceRate(null);
        }
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/70 shadow-sm p-5">
        {/* Aksen bulat dekoratif, samar, di pojok — cuma vibe, gak ganggu konten */}
        <div className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/40 blur-2xl"></div>
        <div className="pointer-events-none absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-purple-200/30 blur-2xl"></div>

        <div className="relative flex items-center gap-3.5">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-md shadow-blue-900/10 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {(student?.full_name?.[0] || "S").toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">
              {getGreetingWord()}
            </p>
            <h2 className="text-lg font-bold text-gray-800 truncate">
              {getDisplayName(student?.full_name)} 👋
            </h2>
          </div>
        </div>

        {attendanceRate !== null &&
          attendanceRate >= ATTENDANCE_GOOD_THRESHOLD && (
            <div className="relative mt-3.5 flex items-center justify-center gap-2 bg-emerald-500/90 text-white text-xs font-semibold px-3.5 py-2 rounded-xl w-fit mx-auto">
              <span className="text-sm leading-none">🌟</span>
              <span>
                Kehadiran Kamu Bulan Ini Bagus Sekali ({attendanceRate}%)
              </span>
            </div>
          )}
      </section>

      {/* ====== PRESENSI HARI INI ====== */}
      <section>
        <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-600">Presensi Saya :</p>
          <div
            className={`flex items-center gap-1.5 text-base font-bold px-3 py-1.5 rounded-xl border ${statusMeta.color}`}>
            <StatusIcon size={18} />
            {statusMeta.label}
          </div>
        </div>
      </section>

      {/* ====== PIKET HARI INI ====== */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 shrink-0 rounded-full bg-orange-100 flex items-center justify-center">
            <UsersIcon size={14} className="text-orange-500" />
          </div>
          <h2 className="text-base font-bold text-gray-800">Piket Hari Ini</h2>
        </div>

        {piketNames.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm shadow-sm">
            🧹 Tidak Ada Jadwal Piket Hari Ini.
          </div>
        ) : (
          <div
            className={`rounded-2xl border p-4 shadow-sm ${
              isSayaPiket
                ? "bg-orange-50 border-orange-300"
                : "bg-white border-gray-100"
            }`}>
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
        )}
      </section>

      {/* ====== JADWAL HARI INI ====== */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <div className="w-7 h-7 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock size={14} className="text-blue-500" />
            </div>
            Jadwal Hari Ini
          </h2>
          <button
            onClick={() => onPageChange && onPageChange("student-jadwal")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 active:scale-95 transition-transform">
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
                  className={`rounded-2xl border p-4 shadow-sm transition active:scale-[0.98] ${
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
              <div className="w-7 h-7 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center">
                <Bell size={14} className="text-yellow-500" />
              </div>
              Pengumuman
            </h2>
            <button
              onClick={() =>
                onPageChange && onPageChange("student-lainnya", "pengumuman")
              }
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 active:scale-95 transition-transform">
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
                <p className="text-sm text-gray-700 mt-1 text-justify">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
