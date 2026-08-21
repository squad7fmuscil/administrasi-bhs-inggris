// students/StudentJadwal.js
// Jadwal pelajaran mingguan penuh buat siswa (read-only, cuma kelas sendiri).
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useStudentProfile from "./useStudentProfile";
import { DAY_NAMES, getDayName, isOngoing } from "./StudentHelpers";

// Jumat jam pelajarannya beda (lebih pendek) dari hari lain — dipake buat
// nimpa start_time/end_time dari database khusus pas activeDay === "Jumat".
// Key = nomor jam ke berapa (period), bukan dari data class_schedules.
const FRIDAY_TIMES = {
  1: { start: "06:30", end: "07:05" },
  2: { start: "07:05", end: "07:40" },
  3: { start: "07:40", end: "08:10" },
  4: { start: "08:10", end: "08:40" },
  5: { start: "08:40", end: "09:10" },
  6: { start: "09:40", end: "10:10" },
  7: { start: "10:10", end: "10:40" },
  8: { start: "", end: "" },
  9: { start: "", end: "" },
};

// Senin - Jumat (KBM cuma Senin-Jumat, Sabtu & Minggu libur)
const SCHOOL_DAYS = DAY_NAMES.filter((d) => d !== "Minggu" && d !== "Sabtu");

export default function StudentJadwal() {
  const {
    student,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Kalau hari ini bukan hari sekolah (mis. Sabtu/Minggu), default balik
  // ke Senin biar gak nyangkut ke hari lain yang gak jelas asal-usulnya.
  const today = getDayName();
  const [activeDay, setActiveDay] = useState(
    SCHOOL_DAYS.includes(today) ? today : "Senin",
  );

  useEffect(() => {
    if (!student) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Catatan: tabel "jadwal" gak eksis, diganti "class_schedules"
        // (tabel baru, input manual, khusus jadwal per kelas).
        const { data, error: err } = await supabase
          .from("class_schedules")
          .select("id, day, subject, start_time, end_time, teacher_name")
          .eq("class_id", student.homeroom_class_id)
          .order("start_time", { ascending: true });

        if (err) throw err;
        setSchedule(data || []);
      } catch (err) {
        console.error("[StudentJadwal] Gagal ambil jadwal:", err);
        setError("Gagal memuat jadwal. Coba refresh halaman.");
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
        Sesi gak ketemu. Silakan login ulang.
      </div>
    );
  }

  const daySchedule = schedule
    .filter((item) => item.day === activeDay)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Tab hari */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SCHOOL_DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              activeDay === day
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-gray-200 text-gray-600"
            }`}>
            {day}
          </button>
        ))}
      </div>

      {daySchedule.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">
          🎉 Tidak ada jadwal di hari {activeDay}.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">
                    Jam Ke
                  </th>
                  <th className="py-2.5 px-4 font-semibold">Mapel</th>
                  <th className="py-2.5 px-4 font-semibold whitespace-nowrap">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody>
                {daySchedule.map((item, idx) => {
                  const period = idx + 1;

                  // Khusus hari Jumat, timpa waktu dari database pake jam
                  // Jumat yang lebih pendek (FRIDAY_TIMES), berdasarkan
                  // nomor jam ke berapa.
                  const isJumat = activeDay === "Jumat";
                  const startTime = isJumat
                    ? FRIDAY_TIMES[period]?.start
                    : item.start_time;
                  const endTime = isJumat
                    ? FRIDAY_TIMES[period]?.end
                    : item.end_time;

                  const ongoing =
                    activeDay === getDayName() && isOngoing(startTime, endTime);

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-50 last:border-0 transition ${
                        ongoing ? "bg-blue-50" : ""
                      }`}>
                      <td className="py-3 px-4">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            ongoing
                              ? "bg-blue-600 text-white"
                              : "bg-blue-50 text-blue-600"
                          }`}>
                          {period}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">
                          {item.subject}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          {item.teacher_name || "-"}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-blue-600 whitespace-nowrap">
                        {startTime && endTime
                          ? `${startTime.slice(0, 5)}–${endTime.slice(0, 5)}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
