// src/students/belajar/BelajarMain.js
// ========================================================================
// Satu-satunya pintu masuk fitur "Belajar" yang dipanggil App.js.
// App.js cukup tau: kalau currentPage === "student-belajar", render
// <BelajarMain />. Titik. Semua navigasi DI DALEM fitur ini (pilih mapel ->
// pilih chapter -> detail materi/kuis, dan tombol "kembali"-nya) di-handle
// di sini pake state lokal `view`, BUKAN lewat currentPage-nya App.js.
//
// Struktur folder:
//   src/students/belajar/
//     ├── BelajarMain.js          <- file ini
//     ├── MapelGrid.js            <- level 1: grid card mapel (shared,
//     |                              bukan punya 1 mapel doang)
//     ├── bahasa-inggris/         <- level 2 & 3 KHUSUS mapel ini
//     │     ├── ChapterList.js
//     │     └── ChapterDetail.js
//     ├── matematika/             <- nyusul, pola folder sama persis
//     ├── ipa/
//     ├── informatika/
//     └── kka/
//
// Kenapa ChapterList/ChapterDetail per-folder-mapel (bukan 1 file generic
// di root): tiap mapel kemungkinan besar butuh bentuk konten beda (render
// rumus buat Matematika, code block buat Informatika, dst), jadi tiap
// mapel bebas punya struktur sendiri. Yang menyatukan semuanya cuma
// MAPEL_COMPONENTS registry di bawah ini.
// ========================================================================
import React, { useState, useCallback } from "react";
import MapelGrid from "./MapelGrid";

// Komponen ChapterList & ChapterDetail punya Bahasa Inggris (satu-satunya
// yang aktif sekarang).
import BahasaInggrisChapterList from "./bahasa-inggris/ChapterList";
import BahasaInggrisChapterDetail from "./bahasa-inggris/ChapterDetail";

// Daftar mapel yang ditampilin di grid. Status "coming-soon" = card tetep
// kelihatan (biar siswa tau roadmap lengkapnya) tapi belum bisa diklik
// masuk. Begitu materi mapel lain siap:
//   1. Bikin folder-nya (src/students/belajar/matematika/, dst) isinya
//      ChapterList.js & ChapterDetail.js sendiri
//   2. Import komponennya di atas + tambah entry di MAPEL_COMPONENTS
//   3. Ganti status di sini jadi "active"
// Gak ada satu pun langkah di atas yang nyentuh App.js.
export const MAPEL_LIST = [
  {
    id: "bhs-inggris",
    nama: "Bahasa Inggris",
    icon: "🇬🇧",
    gradient: "from-blue-500 to-cyan-600",
    bgLight: "bg-blue-50",
    status: "active",
  },
  {
    id: "matematika",
    nama: "Matematika",
    icon: "📐",
    gradient: "from-green-500 to-emerald-600",
    bgLight: "bg-emerald-50",
    status: "coming-soon",
  },
  {
    id: "ipa",
    nama: "IPA",
    icon: "🔬",
    gradient: "from-purple-500 to-pink-600",
    bgLight: "bg-pink-50",
    status: "coming-soon",
  },
  {
    id: "informatika",
    nama: "Informatika",
    icon: "💻",
    gradient: "from-orange-500 to-red-600",
    bgLight: "bg-orange-50",
    status: "coming-soon",
  },
  {
    id: "kka",
    nama: "KKA",
    icon: "📖",
    gradient: "from-teal-500 to-cyan-700",
    bgLight: "bg-teal-50",
    status: "coming-soon",
  },
];

// Registry: mapelId -> { ChapterList, ChapterDetail } komponennya.
// Nambah mapel baru = nambah 1 entry di sini, gak ada logic lain yang
// perlu diubah.
const MAPEL_COMPONENTS = {
  "bhs-inggris": {
    ChapterList: BahasaInggrisChapterList,
    ChapterDetail: BahasaInggrisChapterDetail,
  },
  // "matematika": {
  //   ChapterList: MatematikaChapterList,
  //   ChapterDetail: MatematikaChapterDetail,
  // },
};

export default function BelajarMain({ currentUser }) {
  // level: "mapel-grid" | "chapter-list" | "chapter-detail"
  const [view, setView] = useState({
    level: "mapel-grid",
    mapelId: null,
    chapterNum: null,
  });

  // ---------------------------------------------------------------------
  // Navigasi "turun" level
  // ---------------------------------------------------------------------
  const openMapel = useCallback((mapelId) => {
    const mapel = MAPEL_LIST.find((m) => m.id === mapelId);
    console.log("OPEN MAPEL:", {
      mapelId,
      mapel,
      hasComponent: !!MAPEL_COMPONENTS[mapelId],
    });
    // Guard ganda: mapel harus "active" DAN harus punya komponen terdaftar
    // di registry. Kalau salah satu gak kepenuhin, jangan pindah level --
    // daripada nge-render halaman kosong/error.
    if (!mapel || mapel.status !== "active" || !MAPEL_COMPONENTS[mapelId]) {
      console.log("BLOCKED oleh guard, gak lanjut ke chapter-list");
      return;
    }

    console.log("LOLOS guard, set view ke chapter-list untuk:", mapelId);
    setView({ level: "chapter-list", mapelId, chapterNum: null });
    window.scrollTo(0, 0);
  }, []);

  const openChapter = useCallback((chapterNum) => {
    setView((prev) => ({ ...prev, level: "chapter-detail", chapterNum }));
    window.scrollTo(0, 0);
  }, []);

  // ---------------------------------------------------------------------
  // Navigasi "naik" level (tombol Kembali di tiap halaman)
  // ---------------------------------------------------------------------
  const backToMapelGrid = useCallback(() => {
    setView({ level: "mapel-grid", mapelId: null, chapterNum: null });
    window.scrollTo(0, 0);
  }, []);

  const backToChapterList = useCallback(() => {
    setView((prev) => ({ ...prev, level: "chapter-list", chapterNum: null }));
    window.scrollTo(0, 0);
  }, []);

  const activeMapel = MAPEL_LIST.find((m) => m.id === view.mapelId) || null;
  const activeComponents = view.mapelId ? MAPEL_COMPONENTS[view.mapelId] : null;

  console.log("RENDER BelajarMain:", { view, activeMapel, activeComponents });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {view.level === "mapel-grid" && (
          <MapelGrid mapelList={MAPEL_LIST} onSelectMapel={openMapel} />
        )}

        {view.level === "chapter-list" && activeMapel && activeComponents && (
          <activeComponents.ChapterList
            mapel={activeMapel}
            currentUser={currentUser}
            onSelectChapter={openChapter}
            onBack={backToMapelGrid}
          />
        )}

        {view.level === "chapter-detail" && activeMapel && activeComponents && (
          <activeComponents.ChapterDetail
            mapel={activeMapel}
            chapterNum={view.chapterNum}
            currentUser={currentUser}
            onBack={backToChapterList}
          />
        )}
      </div>
    </div>
  );
}
