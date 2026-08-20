import React, { useState, useEffect } from "react";

export default function MateriDetail({ setCurrentPage }) {
  const [materi, setMateri] = useState(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("selectedMateri");
    if (saved) {
      setMateri(JSON.parse(saved));
    } else {
      setCurrentPage("easygrammar");
    }
  }, [setCurrentPage]);

  if (!materi) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setCurrentPage("easygrammar")}
          className="text-blue-600 mb-4 flex items-center gap-1">
          ← Kembali
        </button>

        <h1 className="text-2xl font-bold text-gray-800">{materi.judul}</h1>
        <p className="text-gray-500 mt-1">{materi.desc}</p>

        <div className="mt-6 bg-white p-5 rounded-xl shadow-md border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">📖 Penjelasan</h2>
          <p className="text-gray-600 whitespace-pre-line">{materi.materi}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              sessionStorage.setItem("latihanJudul", materi.judul);
              setCurrentPage("easygrammar_latihan");
            }}
            className="py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition">
            📝 Latihan Soal
          </button>
          <button
            onClick={() => setCurrentPage("easygrammar_checker")}
            className="py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
            ✍️ Cek Grammar
          </button>
        </div>
      </div>
    </div>
  );
}
