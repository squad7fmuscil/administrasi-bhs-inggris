// students/StudentPresensi.js
// Riwayat presensi siswa (read-only, punya sendiri doang — bukan buat absen).
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import useStudentProfile from "./useStudentProfile";
import { formatDateShort, getStatusMeta } from "./StudentHelpers";

export default function StudentPresensi() {
  const {
    student,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: "hadir", label: "Hadir" },
          { key: "sakit", label: "Sakit" },
          { key: "izin", label: "Izin" },
          { key: "alpa", label: "Alpa" },
        ].map(({ key, label }) => {
          const meta = getStatusMeta(key);
          return (
            <div
              key={key}
              className={`rounded-xl border p-3 text-center ${meta.color}`}>
              <p className="text-lg font-bold leading-none">{summary[key]}</p>
              <p className="text-[11px] font-medium mt-1">{label}</p>
            </div>
          );
        })}
      </div>

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
