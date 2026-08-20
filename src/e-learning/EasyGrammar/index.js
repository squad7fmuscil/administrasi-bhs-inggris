import React from "react";

const materiList = [
  {
    id: 1,
    judul: "Simple Present Tense",
    desc: "Kebiasaan & fakta umum",
    materi:
      "Digunakan untuk menyatakan kebiasaan, fakta umum, atau jadwal.\nContoh: I eat breakfast every day. / The sun rises in the east.",
  },
  {
    id: 2,
    judul: "Present Continuous",
    desc: "Kejadian yang sedang berlangsung",
    materi:
      "Digunakan untuk menyatakan kejadian yang sedang terjadi sekarang.\nContoh: She is reading a book now. / They are playing football.",
  },
  {
    id: 3,
    judul: "Simple Past Tense",
    desc: "Kejadian di masa lalu",
    materi:
      "Digunakan untuk menyatakan kejadian yang terjadi di masa lalu.\nContoh: They visited Bali last year. / I ate fried rice yesterday.",
  },
  {
    id: 4,
    judul: "Present Perfect",
    desc: "Pengalaman & kejadian belum selesai",
    materi:
      "Digunakan untuk menyatakan pengalaman atau kejadian yang dimulai di masa lalu dan masih berhubungan dengan sekarang.\nContoh: I have seen that movie. / She has lived here for 5 years.",
  },
  {
    id: 5,
    judul: "Passive Voice",
    desc: "Kalimat pasif",
    materi:
      "Kalimat pasif fokus pada objek yang dikenai tindakan.\nContoh: The cake was eaten by him. / The book is read by students.",
  },
];

export default function EasyGrammar({ setCurrentPage }) {
  const handleMateriClick = (materi) => {
    sessionStorage.setItem("selectedMateri", JSON.stringify(materi));
    setCurrentPage("easygrammar_materi");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          📚 Easy Grammar
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Pilih materi tata bahasa yang ingin dipelajari
        </p>

        <div className="space-y-3">
          {materiList.map((m) => (
            <div
              key={m.id}
              onClick={() => handleMateriClick(m)}
              className="bg-white p-4 rounded-xl shadow-md border border-gray-100 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">{m.judul}</h2>
                  <p className="text-sm text-gray-400">{m.desc}</p>
                </div>
                <div className="text-gray-300">→</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            onClick={() => setCurrentPage("easygrammar_checker")}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
            ✍️ Cek Grammar Tulisanmu
          </button>
        </div>
      </div>
    </div>
  );
}
