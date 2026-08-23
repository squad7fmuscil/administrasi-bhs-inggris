// students/StudentPengumuman.js
// Isi menu "Pengumuman" di halaman Akun. Read-only dari sisi siswa —
// pengumuman dibuat/dikelola dari akun Admin/Guru, di sini cuma nampilin
// daftarnya. Fetch baru jalan pas accordion-nya diklik (component ini
// baru di-mount saat itu).
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { formatDateShort } from "./StudentHelpers";
import { Pin } from "lucide-react";

export default function StudentPengumuman({ student }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!student) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("pengumuman")
          // target_class null = pengumuman umum buat semua kelas
          .select("id, title, content, created_at, target_class, is_pinned")
          .or(
            `target_class.eq.${student.homeroom_class_id},target_class.is.null`,
          )
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(30);

        if (err) throw err;
        setAnnouncements(data || []);
      } catch (err) {
        console.error("[StudentPengumuman] Gagal ambil pengumuman:", err);
        setError("Gagal memuat pengumuman.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [student]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
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

  if (announcements.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-6">
        Belum ada pengumuman.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {announcements.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl p-3 ${
            item.is_pinned
              ? "bg-amber-50 border border-amber-200"
              : "bg-gray-50"
          }`}>
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-800 text-sm flex items-center gap-1.5 min-w-0">
              {item.is_pinned && (
                <Pin
                  size={13}
                  fill="currentColor"
                  className="text-amber-600 shrink-0"
                />
              )}
              <span className="truncate">{item.title}</span>
            </p>
            <span className="text-[11px] text-gray-400 shrink-0">
              {formatDateShort(item.created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-1 text-justify">
            {item.content}
          </p>
        </div>
      ))}
    </div>
  );
}
