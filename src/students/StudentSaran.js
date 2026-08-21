// components/SaranMasukanSiswa.js (sesuaikan folder kalau beda sama
// DashboardHomeTeacher.js — file ini ditaruh 1 folder yang sama)
//
// Kebalikan dari PengumumanWaliKelas: kalau itu guru NULIS pengumuman
// buat siswa, ini guru MEMBACA saran/masukan yang dikirim siswa dari
// tabel `saran_masukan`. Difilter per kelas (classId = homeroom_class_id
// wali kelas yang lagi login).
//
// Klik badge status di tiap kartu buat siklus statusnya:
// baru -> dibaca -> ditindaklanjuti -> baru (lagi).
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const STATUS_META = {
  baru: {
    label: "Baru",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
  dibaca: {
    label: "Dibaca",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  ditindaklanjuti: {
    label: "Ditindaklanjuti",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
};

const cycleStatus = (current) => {
  if (current === "baru") return "dibaca";
  if (current === "dibaca") return "ditindaklanjuti";
  return "baru";
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SaranMasukanSiswa({ classId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!classId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("saran_masukan")
          .select(
            "id, message, status, created_at, users:student_id (full_name)",
          )
          .eq("class_id", classId)
          .order("created_at", { ascending: false })
          .limit(30);

        if (err) throw err;
        setItems(data || []);
      } catch (err) {
        console.error("[SaranMasukanSiswa] Gagal ambil saran/masukan:", err);
        setError("Gagal memuat saran/masukan.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [classId]);

  const handleStatusClick = async (item) => {
    const nextStatus = cycleStatus(item.status);
    setUpdatingId(item.id);
    try {
      const { error: err } = await supabase
        .from("saran_masukan")
        .update({ status: nextStatus })
        .eq("id", item.id);

      if (err) throw err;
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: nextStatus } : it,
        ),
      );
    } catch (err) {
      console.error("[SaranMasukanSiswa] Gagal update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-slate-100 dark:border-slate-700 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center min-w-0">
          <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-sky-500 to-blue-500 rounded-full mr-3 shrink-0"></span>
          <span className="truncate">Saran/Masukan Siswa</span>
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 sm:py-10 text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Belum ada saran/masukan
          </p>
          <p className="text-sm">
            Saran dari siswa kelas ini bakal muncul di sini
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => {
            const meta = STATUS_META[item.status] || STATUS_META.baru;
            return (
              <div
                key={item.id}
                className="p-3 sm:p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/30 rounded-xl border border-sky-100 dark:border-sky-900/50 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {item.users?.full_name || "Siswa"}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {item.message}
                </p>
                <button
                  type="button"
                  onClick={() => handleStatusClick(item)}
                  disabled={updatingId === item.id}
                  className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full disabled:opacity-50 ${meta.badge}`}>
                  {updatingId === item.id ? "Menyimpan..." : meta.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
