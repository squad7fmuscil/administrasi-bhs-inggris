// src/students/belajar/MapelGrid.js
// ========================================================================
// Level 1 dari fitur Belajar: grid card mata pelajaran.
// - Mapel status "active" -> bisa diklik, masuk ke ChapterList.
// - Mapel status "coming-soon" -> card tetep kelihatan (biar siswa liat
//   roadmap lengkapnya) tapi diabu-abuin & gak bisa diklik.
// ========================================================================
import React from "react";
import { ArrowRight, Lock, GraduationCap } from "lucide-react";

export default function MapelGrid({ mapelList, onSelectMapel }) {
  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Belajar
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Pilih mata pelajaran yang mau kamu pelajari
            </p>
          </div>
        </div>
      </div>

      {/* Grid Card Mapel */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {mapelList.map((mapel) => {
          const isActive = mapel.status === "active";

          return (
            <div
              key={mapel.id}
              onClick={() => isActive && onSelectMapel(mapel.id)}
              className={`
                group relative overflow-hidden rounded-2xl
                border border-black/5 shadow-sm
                p-4 sm:p-6
                flex flex-col items-center text-center
                sm:items-start sm:text-left
                transition duration-300 ease-in-out
                ${mapel.bgLight} sm:bg-white
                ${
                  isActive
                    ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg sm:hover:shadow-2xl"
                    : "opacity-60 cursor-not-allowed grayscale-[35%]"
                }
              `}>
              {/* top accent bar - desktop only, cuma buat mapel aktif */}
              {isActive && (
                <div
                  className={`hidden sm:block absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${mapel.gradient}`}></div>
              )}

              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${mapel.gradient} flex items-center justify-center shadow-md mb-2 sm:mb-4 text-2xl sm:text-3xl`}>
                <span>{mapel.icon}</span>
              </div>

              <h2 className="text-sm sm:text-xl font-semibold sm:font-bold text-gray-800 mb-0 sm:mb-2 leading-tight">
                {mapel.nama}
              </h2>

              {isActive ? (
                <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all mt-auto pt-2">
                  <span>Mulai Belajar</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1 sm:mt-auto sm:pt-2">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-400">
                    Segera Hadir
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
