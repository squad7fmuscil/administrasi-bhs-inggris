import React, { useState } from "react";
import { checkGrammar } from "../../services/groqService";

export default function EasyGrammarChecker({ setCurrentPage }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!input.trim()) return alert("Tulis dulu teksnya!");
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const parsed = await checkGrammar(input);
      setResult(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setCurrentPage("easygrammar")}
          className="text-blue-600 mb-4">
          ← Kembali
        </button>

        <h1 className="text-xl font-bold text-gray-800 mb-2">✍️ Cek Grammar</h1>
        <p className="text-gray-500 text-sm mb-4">
          Tulis kalimat bahasa Inggris, AI akan perbaiki grammar-nya.
        </p>

        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows="4"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Contoh: I go to school yesterday."
          />
          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full mt-3 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400">
            {loading ? "⏳ Memproses..." : "🚀 Cek Grammar"}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-xl">
            <p className="text-red-700 text-sm">⚠️ {error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <p className="font-semibold text-green-800 text-sm">
                ✅ Perbaikan Grammar
              </p>
              <p className="text-green-700 mt-1">{result.correction}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <p className="font-semibold text-blue-800 text-sm">
                💡 Saran Perbaikan
              </p>
              <p className="text-blue-700 mt-1">{result.suggestion}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
              <p className="font-semibold text-purple-800 text-sm">
                🌟 Alternatif Natural
              </p>
              <p className="text-purple-700 mt-1">{result.alternative}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
