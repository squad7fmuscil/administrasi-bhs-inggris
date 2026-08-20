import React, { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import {
  CalendarDays,
  BookOpen,
  Printer,
  FileDown,
  RotateCcw,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  getAllChaptersForGrade,
  getUnitsForChapter,
  getUnitDetails,
  getOfficialCP,
} from "./modul-ajar/modulConfig";
import { TpEnricher } from "./modul-ajar/TpEnricher";

// Fase mengacu pada Kepmendikdasmen/BSKAP No. 046/H/KR/2025.
// Kelas 7, 8, 9 SMP/MTs seluruhnya berada pada Fase D.
const FASE_MAP = { 7: "D", 8: "D", 9: "D" };

const formatTp = (text) => {
  if (!text) return "";
  const trimmed = text.trim();
  if (/^peserta didik/i.test(trimmed)) return trimmed;
  const lower = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return `Peserta didik mampu ${lower}`;
};

// Satu baris Prota = satu Chapter/Bab. Tujuan Pembelajaran (TP) tiap baris
// diambil otomatis dari coreCompetencies tiap Unit di dalamnya (sama seperti
// pendekatan Promes), Materi Pokok diambil dari daftar nama Unit.
const buildDefaultChapters = (kelas) => {
  const chapters = getAllChaptersForGrade(kelas);
  const half = Math.ceil(chapters.length / 2);
  return chapters.map((chapter, idx) => {
    const units = getUnitsForChapter(chapter, kelas);
    const tp = units
      .map((unit) =>
        formatTp(getUnitDetails(chapter, unit, kelas).coreCompetencies),
      )
      .filter(Boolean)
      .join("\n");
    return {
      chapter,
      units,
      jumlahUnit: units.length,
      materiPokok: units.join(", "),
      tp,
      // default 4 JP per unit (umum: 1 unit = 2x pertemuan @2JP)
      jp: units.length * 4,
      semester: idx < half ? "1" : "2",
      keterangan: "",
    };
  });
};

const ProtaPage = ({ currentUser }) => {
  const [namaSekolah, setNamaSekolah] = useState("SMP Muslimin Cililin");
  const [namaGuru, setNamaGuru] = useState(currentUser?.full_name || "");
  const [nipGuru, setNipGuru] = useState("");
  const [namaKepsek, setNamaKepsek] = useState("H. Ade Nurmughni, S.Pd.");
  const [nipKepsek, setNipKepsek] = useState("");
  const [kelas, setKelas] = useState("7");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [targetNilai, setTargetNilai] = useState("75");
  const [tempatTanggal, setTempatTanggal] = useState("");
  const [chapterConfig, setChapterConfig] = useState(() =>
    buildDefaultChapters("7"),
  );
  const [hasil, setHasil] = useState(null);
  const [error, setError] = useState("");
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    setChapterConfig(buildDefaultChapters(kelas));
    setHasil(null);
  }, [kelas]);

  const officialCP = getOfficialCP(kelas);

  const updateChapterField = (idx, field, value) => {
    setChapterConfig((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const totalJPSemester = (semester) =>
    chapterConfig
      .filter((r) => r.semester === semester)
      .reduce((sum, r) => sum + Number(r.jp || 0), 0);

  // Perkaya/perbaiki teks TP tiap bab pakai AI (reuse Edge Function
  // "modul-proxy" yang sama dengan Modul Ajar). Materi/topik & alokasi JP
  // tidak diubah, cuma kalimat TP-nya yang diperbaiki AI.
  const handleEnrichTp = async () => {
    setEnriching(true);
    setError("");
    try {
      const items = chapterConfig.map((row) => ({
        id: row.chapter,
        chapter: row.chapter,
        units: row.units,
        tp: row.tp,
      }));
      const enriched = await TpEnricher.enrichTp({
        mapel: "Bahasa Inggris",
        kelas,
        items,
      });
      setChapterConfig((prev) =>
        prev.map((row) =>
          enriched[row.chapter] ? { ...row, tp: enriched[row.chapter] } : row,
        ),
      );
    } catch (err) {
      setError(err.message || "Gagal memperkaya TP dengan AI.");
    } finally {
      setEnriching(false);
    }
  };

  const generateProta = () => {
    if (!namaGuru.trim()) {
      setError("Nama Guru wajib diisi sebelum membuat Program Tahunan.");
      return;
    }
    setError("");
    // Nomor urut kontinu lintas semester (Semester 1 dulu, lalu Semester 2),
    // dipakai untuk kolom "No" pada tabel kontinu di hasil.
    const ordered = [...chapterConfig].sort((a, b) =>
      a.semester.localeCompare(b.semester),
    );
    const withNo = ordered.map((row, i) => ({ ...row, no: i + 1 }));
    setHasil({
      namaSekolah,
      namaGuru,
      nipGuru,
      namaKepsek,
      nipKepsek,
      kelas,
      fase: FASE_MAP[kelas],
      tahunAjaran,
      targetNilai,
      tempatTanggal,
      chapterConfig: withNo,
      totalSem1: totalJPSemester("1"),
      totalSem2: totalJPSemester("2"),
    });
  };

  const resetForm = () => {
    setNamaSekolah("SMP Muslimin Cililin");
    setNamaGuru("");
    setNipGuru("");
    setNamaKepsek("H. Ade Nurmughni, S.Pd.");
    setNipKepsek("");
    setTahunAjaran("2026/2027");
    setTargetNilai("75");
    setTempatTanggal("");
    setChapterConfig(buildDefaultChapters(kelas));
    setHasil(null);
    setError("");
  };

  const [pdfExporting, setPdfExporting] = useState(false);

  // Langsung generate & download PDF tanpa lewat dialog print browser.
  // Elemen dengan class "no-print" (tombol-tombol aksi) dibuang dulu dari
  // clone-nya supaya nggak ikut ke-render di file PDF.
  const handleExportPdf = async () => {
    const element = document.getElementById("prota-output");
    if (!element) return;

    setPdfExporting(true);
    const clone = element.cloneNode(true);
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
    clone.style.boxShadow = "none";
    clone.style.border = "none";

    const fileName = `Prota_BahasaInggris_Kelas${hasil.kelas}_${hasil.tahunAjaran.replace(
      "/",
      "-",
    )}.pdf`;

    try {
      await html2pdf()
        .set({
          margin: 10,
          filename: fileName,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(clone)
        .save();
    } catch (err) {
      setError("Gagal mengekspor PDF: " + err.message);
    } finally {
      setPdfExporting(false);
    }
  };

  // Membangun HTML ber-inline-style (tidak bergantung Tailwind) agar
  // terbaca rapi saat dibuka di Microsoft Word.
  const buildExportHtml = (data) => {
    const cellStyle =
      "border:1px solid #333;padding:6px 8px;font-size:11px;font-family:Calibri,Arial,sans-serif;vertical-align:top;";
    const headStyle =
      cellStyle + "background:#dbeafe;font-weight:bold;text-align:center;";

    const tpHtml = (row) => {
      const list = (row.tp || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length === 0) return "";
      return (
        "<br/>" +
        list
          .map(
            (tp, i) =>
              `<span style="display:block;padding-left:10px;">${row.no}.${i + 1} ${tp}</span>`,
          )
          .join("")
      );
    };

    const bodyRows = (sem) => {
      const rows = data.chapterConfig.filter((r) => r.semester === sem);
      const total = rows.reduce((s, r) => s + Number(r.jp || 0), 0);
      return (
        rows
          .map(
            (r) => `
        <tr>
          <td style="${cellStyle}text-align:center;">${r.no}</td>
          <td style="${cellStyle}text-align:center;">${sem}</td>
          <td style="${cellStyle}"><b>${r.chapter}</b>${tpHtml(r)}</td>
          <td style="${cellStyle}">${r.materiPokok}</td>
          <td style="${cellStyle}text-align:center;">${r.jp} JP</td>
          <td style="${cellStyle}">${r.keterangan || ""}</td>
        </tr>`,
          )
          .join("") +
        `
        <tr>
          <td colspan="4" style="${cellStyle}text-align:right;font-weight:bold;background:#f1f5f9;">Jumlah Semester ${sem}</td>
          <td style="${cellStyle}text-align:center;font-weight:bold;background:#f1f5f9;">${total} JP</td>
          <td style="${cellStyle}background:#f1f5f9;"></td>
        </tr>`
      );
    };

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Program Tahunan</title></head>
      <body style="font-family:Calibri,Arial,sans-serif;">
        <h2 style="text-align:center;text-transform:uppercase;">Program Tahunan (Prota)</h2>
        <table style="margin-bottom:16px;font-size:12px;">
          <tr><td style="width:160px;">Nama Sekolah</td><td>: ${data.namaSekolah}</td></tr>
          <tr><td>Mata Pelajaran</td><td>: Bahasa Inggris</td></tr>
          <tr><td>Kelas / Semester</td><td>: ${data.kelas} &ndash; 1 &amp; 2 (Fase ${data.fase})</td></tr>
          <tr><td>Tahun Pelajaran</td><td>: ${data.tahunAjaran}</td></tr>
          <tr><td>Target Nilai Prota</td><td>: ${data.targetNilai || "-"}</td></tr>
        </table>
        <div style="border:1px solid #94a3b8;padding:10px;font-size:12px;margin-bottom:16px;">
          <p style="font-weight:bold;margin:0 0 6px 0;">Capaian Pembelajaran (Fase D)</p>
          <p style="margin:0 0 6px 0;"><b>Menyimak &ndash; Berbicara:</b> ${officialCP.listening_speaking}</p>
          <p style="margin:0 0 6px 0;"><b>Membaca &ndash; Memirsa:</b> ${officialCP.reading_viewing}</p>
          <p style="margin:0;"><b>Menulis &ndash; Mempresentasikan:</b> ${officialCP.writing_presenting}</p>
        </div>
        <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">
          <tr>
            <th style="${headStyle}width:32px;">No</th>
            <th style="${headStyle}width:36px;">SMT</th>
            <th style="${headStyle}text-align:left;">Bab / Tujuan Pembelajaran</th>
            <th style="${headStyle}text-align:left;width:160px;">Materi Pokok</th>
            <th style="${headStyle}width:70px;">Alokasi Waktu</th>
            <th style="${headStyle}width:110px;">Keterangan</th>
          </tr>
          ${bodyRows("1")}
          ${bodyRows("2")}
        </table>
        <table style="width:100%;margin-top:40px;font-size:12px;">
          <tr>
            <td style="width:50%;text-align:center;">
              Mengetahui,<br/>Kepala Sekolah<br/><br/><br/><br/>
              <b><u>${data.namaKepsek || "________________"}</u></b><br/>
              NIP. ${data.nipKepsek || "-"}
            </td>
            <td style="width:50%;text-align:center;">
              ${data.tempatTanggal || "..............................."}<br/>
              Guru Mata Pelajaran<br/><br/><br/><br/>
              <b><u>${data.namaGuru}</u></b><br/>
              NIP. ${data.nipGuru || "-"}
            </td>
          </tr>
        </table>
      </body>
      </html>`;
  };

  const handleExportWord = () => {
    if (!hasil) {
      alert("Silakan buat Program Tahunan terlebih dahulu.");
      return;
    }
    const htmlContent = buildExportHtml(hasil);
    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Prota_BahasaInggris_Kelas${hasil.kelas}_${hasil.tahunAjaran.replace(
      "/",
      "-",
    )}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 no-print">
          <div className="flex justify-center items-center gap-3 mb-4">
            <CalendarDays className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-blue-900">
              Program Tahunan Generator
            </h1>
          </div>
          <p className="text-blue-600 text-lg">
            Bahasa Inggris SMP &mdash; Fase D (mengacu Kepmendikdasmen/BSKAP No.
            046/H/KR/2025)
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100 no-print">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Identitas Program
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Nama Sekolah *
              </label>
              <input
                type="text"
                value={namaSekolah}
                onChange={(e) => setNamaSekolah(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Nama Guru *
              </label>
              <input
                type="text"
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Masukkan nama lengkap Anda"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                NIP Guru
              </label>
              <input
                type="text"
                value={nipGuru}
                onChange={(e) => setNipGuru(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Kelas *
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none">
                <option value="7">Kelas 7 (Fase D)</option>
                <option value="8">Kelas 8 (Fase D)</option>
                <option value="9">Kelas 9 (Fase D)</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Tahun Ajaran *
              </label>
              <input
                type="text"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="2026/2027"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Target Nilai Prota (KKTP)
              </label>
              <input
                type="text"
                value={targetNilai}
                onChange={(e) => setTargetNilai(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="75"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={namaKepsek}
                onChange={(e) => setNamaKepsek(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={nipKepsek}
                onChange={(e) => setNipKepsek(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Tempat, Tanggal Penetapan
              </label>
              <input
                type="text"
                value={tempatTanggal}
                onChange={(e) => setTempatTanggal(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Cililin, 14 Juli 2025"
              />
            </div>
          </div>

          {/* Info CP */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            <p className="font-semibold flex items-center gap-2 mb-1">
              <Info className="w-4 h-4" /> Capaian Pembelajaran Fase D (elemen
              Menyimak-Berbicara, Membaca-Memirsa, Menulis-Mempresentasikan)
              otomatis dilampirkan pada hasil di bawah, mengikuti data resmi
              dari EasyModul.
            </p>
          </div>

          {/* Alokasi per Bab */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-blue-900 mb-4">
              Alokasi Waktu &amp; Sebaran Semester per Bab
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-100 text-blue-900">
                    <th className="border border-blue-200 px-3 py-2 text-left">
                      No
                    </th>
                    <th className="border border-blue-200 px-3 py-2 text-left">
                      Bab / Chapter
                    </th>
                    <th className="border border-blue-200 px-3 py-2 text-left">
                      Materi Pokok
                    </th>
                    <th className="border border-blue-200 px-3 py-2 text-left min-w-[220px]">
                      Tujuan Pembelajaran (auto, bisa diedit)
                    </th>
                    <th className="border border-blue-200 px-3 py-2">
                      Jumlah Unit
                    </th>
                    <th className="border border-blue-200 px-3 py-2">
                      Alokasi Waktu (JP)
                    </th>
                    <th className="border border-blue-200 px-3 py-2">
                      Semester
                    </th>
                    <th className="border border-blue-200 px-3 py-2 text-left">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chapterConfig.map((row, idx) => (
                    <tr key={row.chapter} className="hover:bg-blue-50">
                      <td className="border border-blue-200 px-3 py-2 text-center">
                        {idx + 1}
                      </td>
                      <td className="border border-blue-200 px-3 py-2">
                        {row.chapter}
                      </td>
                      <td className="border border-blue-200 px-3 py-2 text-slate-600 text-xs">
                        {row.materiPokok}
                      </td>
                      <td className="border border-blue-200 px-3 py-2">
                        <textarea
                          rows={Math.max(row.jumlahUnit, 2)}
                          value={row.tp}
                          onChange={(e) =>
                            updateChapterField(idx, "tp", e.target.value)
                          }
                          placeholder={
                            "Peserta didik mampu ...\nPeserta didik mampu ..."
                          }
                          className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
                        />
                      </td>
                      <td className="border border-blue-200 px-3 py-2 text-center">
                        {row.jumlahUnit}
                      </td>
                      <td className="border border-blue-200 px-3 py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={row.jp}
                          onChange={(e) =>
                            updateChapterField(idx, "jp", e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-blue-200 rounded text-center"
                        />
                      </td>
                      <td className="border border-blue-200 px-3 py-2 text-center">
                        <select
                          value={row.semester}
                          onChange={(e) =>
                            updateChapterField(idx, "semester", e.target.value)
                          }
                          className="px-2 py-1 border border-blue-200 rounded">
                          <option value="1">Semester 1</option>
                          <option value="2">Semester 2</option>
                        </select>
                      </td>
                      <td className="border border-blue-200 px-3 py-2">
                        <input
                          type="text"
                          value={row.keterangan}
                          onChange={(e) =>
                            updateChapterField(
                              idx,
                              "keterangan",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-semibold text-blue-900">
                    <td
                      colSpan={3}
                      className="border border-blue-200 px-3 py-2 text-right">
                      Total JP Semester 1
                    </td>
                    <td className="border border-blue-200 px-3 py-2 text-center">
                      {totalJPSemester("1")} JP
                    </td>
                    <td className="border border-blue-200 px-3 py-2"></td>
                  </tr>
                  <tr className="bg-blue-50 font-semibold text-blue-900">
                    <td
                      colSpan={3}
                      className="border border-blue-200 px-3 py-2 text-right">
                      Total JP Semester 2
                    </td>
                    <td className="border border-blue-200 px-3 py-2 text-center">
                      {totalJPSemester("2")} JP
                    </td>
                    <td className="border border-blue-200 px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={handleEnrichTp}
              disabled={enriching}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2">
              <CheckCircle
                className={`w-5 h-5 ${enriching ? "animate-spin" : ""}`}
              />
              {enriching ? "Memperkaya TP..." : "✨ Perkaya TP dengan AI"}
            </button>
            <button
              onClick={generateProta}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Buat Program Tahunan
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Output Section */}
        {hasil && (
          <div
            className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100"
            id="prota-output">
            <div className="flex justify-end gap-3 mb-6 no-print">
              <button
                onClick={handleExportPdf}
                disabled={pdfExporting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-5 rounded-lg flex items-center gap-2">
                <Printer className="w-4 h-4" />
                {pdfExporting ? "Membuat PDF..." : "Unduh PDF"}
              </button>
              <button
                onClick={handleExportWord}
                className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-5 rounded-lg flex items-center gap-2">
                <FileDown className="w-4 h-4" /> Ekspor Word
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold uppercase">
                Program Tahunan (Prota)
              </h2>
              <p className="text-sm">Tahun Pelajaran {hasil.tahunAjaran}</p>
            </div>

            <table className="w-full text-sm mb-6">
              <tbody>
                <tr>
                  <td className="py-1 w-40 font-semibold">Nama Sekolah</td>
                  <td className="py-1">: {hasil.namaSekolah}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Mata Pelajaran</td>
                  <td className="py-1">: Bahasa Inggris</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Kelas / Semester</td>
                  <td className="py-1">
                    : {hasil.kelas} &ndash; 1 &amp; 2 (Fase {hasil.fase})
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Tahun Pelajaran</td>
                  <td className="py-1">: {hasil.tahunAjaran}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Target Nilai Prota</td>
                  <td className="py-1">: {hasil.targetNilai || "-"}</td>
                </tr>
              </tbody>
            </table>

            <div className="mb-6 text-sm border border-slate-300 rounded-lg p-4">
              <p className="font-bold mb-2">Capaian Pembelajaran (Fase D)</p>
              <p className="mb-2">
                <span className="font-semibold">
                  Menyimak &ndash; Berbicara:{" "}
                </span>
                {officialCP.listening_speaking}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Membaca &ndash; Memirsa: </span>
                {officialCP.reading_viewing}
              </p>
              <p>
                <span className="font-semibold">
                  Menulis &ndash; Mempresentasikan:{" "}
                </span>
                {officialCP.writing_presenting}
              </p>
            </div>

            <table className="w-full border-collapse text-sm mb-8">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 w-12">No</th>
                  <th className="border border-slate-300 px-3 py-2 w-14">
                    SMT
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-left min-w-[240px]">
                    Bab / Tujuan Pembelajaran
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-left w-48">
                    Materi Pokok
                  </th>
                  <th className="border border-slate-300 px-3 py-2 w-24">
                    Alokasi Waktu
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-left w-32">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {["1", "2"].map((sem) => (
                  <React.Fragment key={sem}>
                    {hasil.chapterConfig
                      .filter((r) => r.semester === sem)
                      .map((row) => (
                        <tr key={row.chapter}>
                          <td className="border border-slate-300 px-3 py-2 text-center align-top">
                            {row.no}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center align-top">
                            {sem}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 align-top">
                            <span className="font-semibold">{row.chapter}</span>
                            {row.tp && (
                              <ul className="mt-1 pl-4 list-none">
                                {row.tp
                                  .split("\n")
                                  .filter(Boolean)
                                  .map((tp, i) => (
                                    <li key={i} className="font-normal">
                                      {row.no}.{i + 1} {tp}
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 align-top text-slate-600">
                            {row.materiPokok}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center align-top whitespace-nowrap">
                            {row.jp} JP
                          </td>
                          <td className="border border-slate-300 px-3 py-2 align-top">
                            {row.keterangan}
                          </td>
                        </tr>
                      ))}
                    <tr className="bg-slate-50 font-semibold">
                      <td
                        colSpan={4}
                        className="border border-slate-300 px-3 py-2 text-right">
                        Jumlah Semester {sem}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        {sem === "1" ? hasil.totalSem1 : hasil.totalSem2} JP
                      </td>
                      <td className="border border-slate-300 px-3 py-2"></td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 text-sm mt-12">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p>Kepala Sekolah</p>
                <div className="h-20"></div>
                <p className="font-semibold underline">
                  {hasil.namaKepsek || "________________"}
                </p>
                <p>NIP. {hasil.nipKepsek || "-"}</p>
              </div>
              <div className="text-center">
                <p>
                  {hasil.tempatTanggal || "..............................."}
                </p>
                <p>Guru Mata Pelajaran</p>
                <div className="h-20"></div>
                <p className="font-semibold underline">{hasil.namaGuru}</p>
                <p>NIP. {hasil.nipGuru || "-"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          #prota-output { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ProtaPage;
