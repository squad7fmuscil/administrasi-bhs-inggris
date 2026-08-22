// src/students/belajar/bahasa-inggris/ChapterList.js
// ========================================================================
// ChapterList KHUSUS mapel Bahasa Inggris. PLACEHOLDER SEMENTARA.
//
// Kenapa ChapterList/ChapterDetail ditaruh per-folder-mapel (bukan 1 file
// generic di root belajar/): karena tiap mapel kemungkinan besar butuh
// bentuk konten beda-beda (Bhs Inggris: theory+practice teks, Matematika:
// mungkin butuh render rumus, Informatika: mungkin butuh code block, dst).
// Jadi tiap mapel bebas punya struktur ChapterList/ChapterDetail sendiri
// tanpa harus maksa 1 komponen generic muat semua kebutuhan.
//
// Versi aslinya nanti bakal:
// - Ambil daftar chapter dari ./data/chapterData.js (pindahan chapterData
//   yang sekarang masih hardcoded di EasyMateri.js)
// - Nampilin card per chapter (icon, judul, subtitle, badge status)
// - Kasih badge "Lagi dipelajari minggu ini" kalau chapter itu lagi aktif
// - Kasih indikator progress siswa (kalau kuis chapter itu udah dikerjain)
// ========================================================================
import React from "react";
import { ArrowLeft, Construction } from "lucide-react";

export default function ChapterList({
  mapel,
  currentUser,
  onSelectChapter,
  onBack,
}) {
  console.log("CHAPTERLIST RENDER, mapel:", mapel);
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-indigo-600 font-semibold mb-4 hover:gap-3 transition-all">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Pilih Mapel
      </button>

      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div
          className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${mapel.gradient} flex items-center justify-center shadow-md mb-4 text-3xl`}>
          <span>{mapel.icon}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{mapel.nama}</h2>
        <div className="flex items-center justify-center gap-2 text-gray-400 mt-4">
          <Construction className="w-4 h-4" />
          <p className="text-sm">
            Daftar chapter belum dipasang di sini — nyusul setelah data chapter
            dipindah dari EasyMateri.js.
          </p>
        </div>
      </div>
    </div>
  );
}
