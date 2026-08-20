import React from "react";
import {
  FileStack,
  FileText,
  BookOpen,
  ClipboardList,
  BookOpenCheck,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

export default function ELearningDashboard({ setCurrentPage }) {
  const menuCards = [
    {
      id: "easymateri",
      title: "Easy Materi",
      desc: "Materi interaktif per chapter lengkap dengan teori, contoh, latihan, dan quiz.",
      icon: FileStack,
      gradient: "from-indigo-500 to-purple-600",
      bgLight: "bg-indigo-50",
    },
    {
      id: "easytext",
      title: "Easy Text",
      desc: "Generate berbagai jenis teks (procedure, narrative, recount, dll) dengan bantuan AI.",
      icon: FileText,
      gradient: "from-orange-500 to-red-600",
      bgLight: "bg-orange-50",
    },
    {
      id: "easyvocab",
      title: "Easy Vocab",
      desc: "Generate daftar vocabulary sesuai chapter, lengkap dengan pelafalan dan contoh kalimat.",
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-600",
      bgLight: "bg-pink-50",
    },
    {
      id: "easysoal",
      title: "Easy Soal",
      desc: "Generate soal latihan maupun ujian semester otomatis lengkap dengan kunci jawaban.",
      icon: ClipboardList,
      gradient: "from-green-500 to-emerald-600",
      bgLight: "bg-emerald-50",
    },
    {
      id: "easygrammar",
      title: "Easy Grammar",
      desc: "Pelajari materi grammar, latihan soal otomatis, dan cek grammar tulisanmu dengan AI.",
      icon: BookOpenCheck,
      gradient: "from-blue-500 to-cyan-600",
      bgLight: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                E-Learning
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Pilih tools yang ingin kamu gunakan untuk membuat materi ajar
              </p>
            </div>
          </div>
        </div>

        {/*
          Cards Grid
          - Mobile (default): kompak ala "Aksi Cepat" -> 2 kolom, bg tint warna,
            icon + label doang, tanpa deskripsi & tombol "Buka".
          - Desktop (sm ke atas): card lengkap dengan deskripsi + tombol "Buka".
        */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {menuCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setCurrentPage(card.id)}
                className={`
                  group relative overflow-hidden cursor-pointer transition duration-300 ease-in-out
                  rounded-2xl
                  ${card.bgLight} sm:bg-white
                  border border-black/5 sm:border-0
                  shadow-sm sm:shadow-xl
                  hover:-translate-y-1 hover:shadow-lg sm:hover:shadow-2xl
                  p-4 sm:p-6
                  flex flex-col items-center text-center
                  sm:items-start sm:text-left
                `}>
                {/* top accent bar - desktop only */}
                <div
                  className={`hidden sm:block absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${card.gradient}`}></div>

                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md mb-2 sm:mb-4`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>

                <h2 className="text-sm sm:text-xl font-semibold sm:font-bold text-gray-800 mb-0 sm:mb-2 leading-tight">
                  {card.title}
                </h2>

                {/* deskripsi - desktop only */}
                <p className="hidden sm:block text-sm text-gray-500 leading-relaxed mb-4">
                  {card.desc}
                </p>

                {/* tombol Buka - desktop only */}
                <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:gap-3 transition-all">
                  <span>Buka</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
