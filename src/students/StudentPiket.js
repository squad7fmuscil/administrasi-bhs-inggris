// students/StudentPiket.js
// Isi menu "Jadwal Piket" di halaman Akun. Dulu logic ini nempel di
// StudentLainnya.js dan langsung fetch begitu halaman kebuka; sekarang
// dipisah jadi komponen sendiri yang cuma di-mount (jadi cuma fetch)
// pas accordion-nya diklik.
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { DAY_NAMES } from "./StudentHelpers";

// Ikutin jadwal KBM: Senin-Jumat (samain sama SCHOOL_DAYS di StudentJadwal.js)
const SCHOOL_DAYS = DAY_NAMES.filter((d) => d !== "Minggu" && d !== "Sabtu");

export default function StudentPiket({ student }) {
  const [piketWeek, setPiketWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!student) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("piket_schedule")
          .select("id, hari, siswa_id, users:siswa_id (full_name)")
          .eq("kelas_id", student.homeroom_class_id);

        if (err) throw err;
        setPiketWeek(data || []);
      } catch (err) {
        console.error("[StudentPiket] Gagal ambil jadwal piket:", err);
        setError("Gagal memuat jadwal piket.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [student]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
        ⚠️ {error}
      </div>
    );
  }

  const piketByDay = SCHOOL_DAYS.map((day) => ({
    day,
    names: piketWeek
      .filter((p) => p.hari === day)
      .map((p) => p.users?.full_name)
      .filter(Boolean),
  }));

  return (
    <div className="divide-y divide-gray-50">
      {piketByDay.map(({ day, names }) => (
        <div key={day} className="py-2.5">
          <span className="text-sm font-semibold text-gray-700">{day}</span>
          <div className="mt-1.5 space-y-1 pl-1">
            {names.length > 0 ? (
              names.map((name, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-orange-400 text-lg leading-[1.1] shrink-0">
                    •
                  </span>
                  <span className="text-sm text-gray-500">{name}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
