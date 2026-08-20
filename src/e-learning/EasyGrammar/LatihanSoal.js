import React, { useState, useEffect, useCallback } from "react";
import { generateSoal, explainAnswer } from "../../services/groqService";

export default function LatihanSoal({ setCurrentPage }) {
  const [judul, setJudul] = useState("");
  const [soal, setSoal] = useState([]);
  const [jawaban, setJawaban] = useState({});
  const [hasil, setHasil] = useState(null);
  const [penjelasan, setPenjelasan] = useState({});
  const [loadingPenjelasan, setLoadingPenjelasan] = useState({});

  const [loadingSoal, setLoadingSoal] = useState(true);
  const [errorSoal, setErrorSoal] = useState("");

  const loadSoal = useCallback(async (topic) => {
    setLoadingSoal(true);
    setErrorSoal("");
    setJawaban({});
    setHasil(null);
    setPenjelasan({});

    try {
      const data = await generateSoal(topic, 3);
      setSoal(data);
    } catch (err) {
      setErrorSoal(err.message);
      setSoal([]);
    } finally {
      setLoadingSoal(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("latihanJudul");
    if (!saved) {
      setCurrentPage("easygrammar");
      return;
    }
    setJudul(saved);
    loadSoal(saved);
  }, [setCurrentPage, loadSoal]);

  const handleSubmit = () => {
    let benar = 0;
    soal.forEach((q, idx) => {
      if (jawaban[idx] === q.jawaban) benar++;
    });
    setHasil({ benar, total: soal.length });
  };

  const handleJelaskan = async (idx) => {
    const q = soal[idx];
    setLoadingPenjelasan((prev) => ({ ...prev, [idx]: true }));

    try {
      const teks = await explainAnswer({
        soal: q.soal,
        pilihanUser: jawaban[idx],
        jawabanBenar: q.jawaban,
      });
      setPenjelasan((prev) => ({ ...prev, [idx]: teks }));
    } catch (err) {
      setPenjelasan((prev) => ({
        ...prev,
        [idx]: `⚠️ Gagal ambil penjelasan: ${err.message}`,
      }));
    } finally {
      setLoadingPenjelasan((prev) => ({ ...prev, [idx]: false }));
    }
  };

  if (loadingSoal) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <p className="text-gray-500">⏳ AI sedang menyiapkan soal...</p>
      </div>
    );
  }

  if (errorSoal) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-600 mb-4">⚠️ {errorSoal}</p>
          <button
            onClick={() => loadSoal(judul)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setCurrentPage("easygrammar_materi")}
          className="text-blue-600 mb-4">
          ← Kembali
        </button>

        <h1 className="text-xl font-bold text-gray-800 mb-2">
          📝 Latihan: {judul}
        </h1>
        <p className="text-gray-500 text-sm mb-4">
          Soal di bawah dibuat otomatis oleh AI. Pilih jawaban yang benar!
        </p>

        {soal.map((q, idx) => {
          const sudahDijawab = hasil !== null;
          const jawabanSalah =
            sudahDijawab &&
            jawaban[idx] !== undefined &&
            jawaban[idx] !== q.jawaban;

          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-4">
              <p className="font-medium text-gray-800">
                {idx + 1}. {q.soal}
              </p>
              <div className="mt-2 space-y-2">
                {q.pilihan.map((p, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`soal-${idx}`}
                      value={p}
                      disabled={sudahDijawab}
                      checked={jawaban[idx] === p}
                      onChange={() => setJawaban({ ...jawaban, [idx]: p })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{p}</span>
                  </label>
                ))}
              </div>

              {jawabanSalah && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-red-600">
                    ❌ Jawabanmu: <b>{jawaban[idx]}</b> — Jawaban benar:{" "}
                    <b>{q.jawaban}</b>
                  </p>

                  {!penjelasan[idx] && (
                    <button
                      onClick={() => handleJelaskan(idx)}
                      disabled={loadingPenjelasan[idx]}
                      className="mt-2 text-sm text-blue-600 hover:underline disabled:text-gray-400">
                      {loadingPenjelasan[idx]
                        ? "⏳ Meminta penjelasan..."
                        : "💡 Kenapa salah?"}
                    </button>
                  )}

                  {penjelasan[idx] && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        {penjelasan[idx]}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!hasil && (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(jawaban).length < soal.length}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:bg-gray-300">
            ✅ Kumpulkan Jawaban
          </button>
        )}

        {hasil && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="font-bold text-green-800 text-center">
                🎯 Skor: {hasil.benar} / {hasil.total}
              </p>
              <p className="text-sm text-green-600 text-center mt-1">
                {hasil.benar === hasil.total
                  ? "🌟 Sempurna! Kamu hebat!"
                  : "💪 Tetap semangat, belajar lagi ya!"}
              </p>
            </div>
            <button
              onClick={() => loadSoal(judul)}
              className="w-full py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition">
              🔄 Generate Soal Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
