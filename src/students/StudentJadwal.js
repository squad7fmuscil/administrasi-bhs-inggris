// students/StudentJadwal.js
// Jadwal pelajaran mingguan penuh buat siswa (read-only, cuma kelas sendiri).
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useStudentProfile from "./useStudentProfile";
import { DAY_NAMES, getDayName, isOngoing } from "./studentHelpers";
import { Clock } from "lucide-react";

// Senin - Sabtu (sesuaikan kalau sekolah lo masuk Minggu / gak masuk Sabtu)
const SCHOOL_DAYS = DAY_NAMES.filter((d) => d !== "Minggu");

export default function StudentJadwal() {
  const {
    student,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(getDayName());

  useEffect(() => {
    if (!student) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("jadwal")
          .select("id, day, subject, start_time, end_time, teacher_name")
          .eq("class", student.homeroom_class_id)
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
        <div className="space-y-2">
          {daySchedule.map((item) => {
            const ongoing =
              activeDay === getDayName() &&
              isOngoing(item.start_time, item.end_time);
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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ongoing
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                    <Clock size={18} />
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
                <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {item.start_time?.slice(0, 5)}–{item.end_time?.slice(0, 5)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
