// students/StudentLainnya.js
// Halaman "Akun": profil siswa + ganti password + keluar (lewat komponen
// StudentProfile), jadwal piket mingguan, dan semua pengumuman.
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useStudentProfile from "./useStudentProfile";
import StudentProfile from "./StudentProfile";
import { DAY_NAMES, formatDateShort } from "./StudentHelpers";
import { Users as UsersIcon, Bell } from "lucide-react";

const SCHOOL_DAYS = DAY_NAMES.filter((d) => d !== "Minggu");

export default function StudentLainnya() {
  const {
    student,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile();
  const [piketWeek, setPiketWeek] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!student) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [piketRes, annRes] = await Promise.all([
          supabase
            .from("piket_schedule")
            .select("id, hari, siswa_id, users:siswa_id (full_name)")
            .eq("kelas_id", student.homeroom_class_id),
          supabase
            .from("pengumuman")
            // target_class null = pengumuman umum buat semua kelas
            .select("id, title, content, created_at, target_class")
            .or(
              `target_class.eq.${student.homeroom_class_id},target_class.is.null`,
            )
            .order("created_at", { ascending: false })
            .limit(30),
        ]);

        if (piketRes.error) throw piketRes.error;
        if (annRes.error) throw annRes.error;

        setPiketWeek(piketRes.data || []);
        setAnnouncements(annRes.data || []);
      } catch (err) {
        console.error("[StudentLainnya] Gagal ambil data:", err);
        setError("Gagal memuat data. Coba refresh halaman.");
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
        Sesi Tidak Ketemu. Silakan Login Ulang.
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
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Profil + Ganti Password + Keluar */}
      <StudentProfile student={student} />

      {/* Piket mingguan */}
      <section>
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-2">
          <UsersIcon size={18} className="text-orange-500" />
          Jadwal Piket
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {piketByDay.map(({ day, names }) => (
            <div key={day} className="flex items-start justify-between p-3.5">
              <span className="text-sm font-semibold text-gray-700 w-20 shrink-0">
                {day}
              </span>
              <span className="text-sm text-gray-500 text-right">
                {names.length > 0 ? names.join(" · ") : "-"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Semua pengumuman */}
      <section>
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-2">
          <Bell size={18} className="text-yellow-500" />
          Semua Pengumuman
        </h2>
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">
            Belum Ada Pengumuman.
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-800 text-sm">
                    {item.title}
                  </p>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {formatDateShort(item.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
