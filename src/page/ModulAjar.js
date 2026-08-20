import React, { useState } from "react";
import {
  BookOpen,
  Users,
  Clock,
  Target,
  CheckCircle,
  FileText,
  Monitor,
  Printer,
} from "lucide-react";
import { ModulGenerator } from "./modul-ajar/ModulGenerator";
import { ModulOutput, ModulTemplates } from "./modul-ajar/ModulTemplates";
import {
  semuaDimensi,
  gradeData,
  getOfficialCP,
  getAllChaptersForGrade,
  getUnitsForChapter,
  getUnitDetails,
} from "./modul-ajar/modulConfig";

const EasyModul = () => {
  const [namaSekolah, setNamaSekolah] = useState("SMP Muslimin Cililin");
  const [namaGuru, setNamaGuru] = useState("");
  const [mapel, setMapel] = useState("Bahasa Inggris");
  const [kelas, setKelas] = useState("7");
  const [chapter, setChapter] = useState("Chapter 1 - About Me");
  const [topik, setTopik] = useState("Unit 1 - Galang from Kalimantan");
  const [alokasiWaktu, setAlokasiWaktu] = useState("2");
  const [dimensi, setDimensi] = useState(["Komunikasi", "Kolaborasi"]);
  const [loading, setLoading] = useState(false);
  const [hasilModul, setHasilModul] = useState(null);
  const [error, setError] = useState("");

  const handleGradeChange = (newGrade) => {
    setKelas(newGrade);
    const firstChapter = getAllChaptersForGrade(newGrade)[0];
    const firstUnit = getUnitsForChapter(firstChapter, newGrade)[0];
    setChapter(firstChapter || "");
    setTopik(firstUnit || "");
  };

  const handleChapterChange = (newChapter) => {
    setChapter(newChapter);
    const firstUnit = getUnitsForChapter(newChapter, kelas)[0];
    setTopik(firstUnit || "");
  };

  const handleDimensiChange = (d) => {
    setDimensi((prevDimensi) =>
      prevDimensi.includes(d)
        ? prevDimensi.filter((item) => item !== d)
        : [...prevDimensi, d],
    );
  };

  const resetModul = () => {
    setNamaSekolah("SMP Muslimin Cililin");
    setNamaGuru("");
    setMapel("Bahasa Inggris");
    setKelas("7");
    setChapter("Chapter 1 - About Me");
    setTopik("Unit 1 - Galang from Kalimantan");
    setAlokasiWaktu("2");
    setDimensi(["Komunikasi", "Kolaborasi"]);
    setHasilModul(null);
    setError("");
  };

  const generateModul = async () => {
    if (
      !namaSekolah.trim() ||
      !namaGuru.trim() ||
      !topik ||
      dimensi.length < 2
    ) {
      setError(
        "Pastikan semua field bertanda (*) sudah terisi dan pilih minimal 2 Dimensi Profil Lulusan.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setHasilModul(null);

    try {
      const modulData = await ModulGenerator.generateModul({
        namaSekolah,
        namaGuru,
        mapel,
        kelas,
        chapter,
        topik,
        alokasiWaktu,
        dimensi,
      });

      setHasilModul(modulData);
    } catch (err) {
      setError(
        `Terjadi kesalahan: ${err.message}. Mohon periksa koneksi internet Anda atau coba lagi nanti.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const printModul = () => {
    window.print();
  };

  const exportToWord = () => {
    if (!hasilModul) {
      alert("Mohon buat modul terlebih dahulu sebelum mengekspor.");
      return;
    }
    ModulTemplates.exportToWord(hasilModul, kelas);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-blue-900">
              {" "}
              EasyModul Generator{" "}
            </h1>
          </div>
          <p className="text-blue-600 text-lg">
            {" "}
            Generator Modul Ajar Kurikulum Merdeka 2025{" "}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6" /> Informasi Modul Ajar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Sekolah */}
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                {" "}
                Nama Sekolah *{" "}
              </label>
              <input
                type="text"
                value={namaSekolah}
                onChange={(e) => setNamaSekolah(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Contoh: SMP Muslimin Cililin"
                disabled={loading}
              />
            </div>
            {/* Nama Guru */}
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                {" "}
                Nama Guru *{" "}
              </label>
              <input
                type="text"
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Masukkan nama lengkap Anda"
                disabled={loading}
              />
            </div>
            {/* Kelas */}
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                {" "}
                Kelas *{" "}
              </label>
              <select
                value={kelas}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                disabled={loading}>
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
            </div>
            {/* Alokasi Waktu */}
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                {" "}
                Alokasi Waktu (JP){" "}
              </label>
              <input
                type="number"
                value={alokasiWaktu}
                onChange={(e) => setAlokasiWaktu(e.target.value)}
                min="1"
                max="4"
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>
            {/* Chapter */}
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                {" "}
                Chapter *{" "}
              </label>
              <select
                value={chapter}
                onChange={(e) => handleChapterChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                disabled={loading}>
                {getAllChaptersForGrade(kelas).map((chap) => (
                  <option key={chap} value={chap}>
                    {" "}
                    {chap}{" "}
                  </option>
                ))}
              </select>
            </div>
            {/* Unit/Topik */}
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                {" "}
                Unit/Topik *{" "}
              </label>
              <select
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                disabled={loading}>
                {getUnitsForChapter(chapter, kelas).map((unit) => (
                  <option key={unit} value={unit}>
                    {" "}
                    {unit}{" "}
                  </option>
                ))}
              </select>
              {topik && (
                <div className="mt-2 flex gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {getUnitDetails(chapter, topik, kelas).textType ||
                      "General"}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {getUnitDetails(chapter, topik, kelas).skills ||
                      "Integrated Skills"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dimensi Profil Lulusan */}
          <div className="mt-6">
            <label className="block text-blue-900 font-semibold mb-4">
              {" "}
              Pilih Dimensi Profil Lulusan (Minimal 3){" "}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {semuaDimensi.map((d) => (
                <label
                  key={d}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-blue-50 ${
                    dimensi.includes(d)
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-blue-200 bg-white text-blue-700"
                  }`}>
                  <input
                    type="checkbox"
                    checked={dimensi.includes(d)}
                    onChange={() => handleDimensiChange(d)}
                    className="mr-2 accent-blue-600"
                    disabled={loading}
                  />
                  <span className="text-sm">{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={generateModul}
              disabled={
                loading ||
                dimensi.length < 2 ||
                !topik ||
                !namaSekolah.trim() ||
                !namaGuru.trim()
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2">
              <CheckCircle
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Membangun Modul..." : "Buat Modul Ajar"}
            </button>
            <button
              onClick={resetModul}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              Reset
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
              <p className="font-semibold">Terjadi Kesalahan:</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Output Section */}
        {hasilModul && (
          <ModulOutput
            hasilModul={hasilModul}
            kelas={kelas}
            onReset={resetModul}
            onPrint={printModul}
            onExportWord={exportToWord}
          />
        )}
      </div>
    </div>
  );
};

export default EasyModul;
