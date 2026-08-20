import React, { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import {
  CalendarRange,
  Printer,
  FileDown,
  RotateCcw,
  CheckCircle,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import {
  getAllChaptersForGrade,
  getUnitsForChapter,
  getUnitDetails,
} from "./modul-ajar/modulConfig";
import { TpEnricher } from "./modul-ajar/TpEnricher";

// Fase mengacu pada Kepmendikdasmen/BSKAP No. 046/H/KR/2025.
const FASE_MAP = { 7: "D", 8: "D", 9: "D" };

const SEMESTER_LABEL = { 1: "Ganjil", 2: "Genap" };

const BULAN_SEMESTER = {
  1: ["Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  2: ["Januari", "Februari", "Maret", "April", "Mei", "Juni"],
};

const formatTp = (text) => {
  if (!text) return "";
  const trimmed = text.trim();
  // Samakan gaya kalimat jadi "Peserta didik mampu ..." seperti pada
  // format Prosem resmi, kalau teks sumber belum berawalan begitu.
  if (/^peserta didik/i.test(trimmed)) return trimmed;
  const lower = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return `Peserta didik mampu ${lower}`;
};

// Satu baris Promes = satu Chapter/Bab. Tujuan Pembelajaran (TP) tiap baris
// diambil otomatis dari field coreCompetencies pada setiap Unit di dalam
// chapter tersebut (lihat modulConfig.js), lalu bisa diedit manual oleh guru.
const buildDefaultUnitItems = (kelas) => {
  const chapters = getAllChaptersForGrade(kelas);
  let urutan = 1;
  return chapters.map((chapter) => {
    const units = getUnitsForChapter(chapter, kelas);
    const tp = units
      .map((unit) =>
        formatTp(getUnitDetails(chapter, unit, kelas).coreCompetencies),
      )
      .filter(Boolean)
      .join("\n");
    return {
      id: chapter,
      chapter,
      units,
      selected: true,
      minggu: Math.max(units.length, 1),
      urutan: urutan++,
      tp,
    };
  });
};

const buildDefaultMinggu = (semester) => {
  const obj = {};
  BULAN_SEMESTER[semester].forEach((bulan) => {
    obj[bulan] = 4;
  });
  return obj;
};

const PromesPage = ({ currentUser }) => {
  const [namaSekolah, setNamaSekolah] = useState("SMP Muslimin Cililin");
  const [mataPelajaran, setMataPelajaran] = useState("Bahasa Inggris");
  const [namaGuru, setNamaGuru] = useState(currentUser?.full_name || "");
  const [nipGuru, setNipGuru] = useState("");
  const [namaKepsek, setNamaKepsek] = useState("H. Ade Nurmughni, S.Pd.");
  const [nipKepsek, setNipKepsek] = useState("");
  const [kelas, setKelas] = useState("7");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [semester, setSemester] = useState("1");
  const [jpPerMinggu, setJpPerMinggu] = useState(4);
  const [tempatTanggal, setTempatTanggal] = useState("");
  const [mingguEfektif, setMingguEfektif] = useState(() =>
    buildDefaultMinggu("1"),
  );
  const [unitItems, setUnitItems] = useState(() => buildDefaultUnitItems("7"));
  const [kegiatanLain, setKegiatanLain] = useState([
    { id: "pts", label: "Penilaian Tengah Semester", minggu: 1, urutan: 90 },
    { id: "pas", label: "Penilaian Akhir Semester", minggu: 1, urutan: 99 },
  ]);
  const [hasil, setHasil] = useState(null);
  const [error, setError] = useState("");
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    setUnitItems(buildDefaultUnitItems(kelas));
    setHasil(null);
  }, [kelas]);

  useEffect(() => {
    setMingguEfektif(buildDefaultMinggu(semester));
    setHasil(null);
  }, [semester]);

  const updateUnitItem = (id, field, value) => {
    setUnitItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  const updateKegiatan = (id, field, value) => {
    setKegiatanLain((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  const addKegiatan = () => {
    setKegiatanLain((prev) => [
      ...prev,
      {
        id: `kegiatan-${Date.now()}`,
        label: "Kegiatan Baru",
        minggu: 1,
        urutan: (prev[prev.length - 1]?.urutan || 0) + 1,
      },
    ]);
  };

  const removeKegiatan = (id) => {
    setKegiatanLain((prev) => prev.filter((it) => it.id !== id));
  };

  // Perkaya/perbaiki teks TP tiap bab pakai AI (reuse Edge Function
  // "modul-proxy" yang sama dengan Modul Ajar). Jadwal minggu efektif &
  // urutan tidak diubah, cuma kalimat TP-nya yang diperbaiki AI.
  const handleEnrichTp = async () => {
    setEnriching(true);
    setError("");
    try {
      const items = unitItems.map((it) => ({
        id: it.id,
        chapter: it.chapter,
        units: it.units,
        tp: it.tp,
      }));
      const enriched = await TpEnricher.enrichTp({
        mapel: mataPelajaran,
        kelas,
        items,
      });
      setUnitItems((prev) =>
        prev.map((it) =>
          enriched[it.id] ? { ...it, tp: enriched[it.id] } : it,
        ),
      );
    } catch (err) {
      setError(err.message || "Gagal memperkaya TP dengan AI.");
    } finally {
      setEnriching(false);
    }
  };

  const totalMingguEfektif = Object.values(mingguEfektif).reduce(
    (a, b) => a + Number(b || 0),
    0,
  );

  const generatePromes = () => {
    if (!namaGuru.trim()) {
      setError("Nama Guru wajib diisi sebelum membuat Program Semester.");
      return;
    }
    const dipilih = unitItems.filter((it) => it.selected);
    if (dipilih.length === 0) {
      setError("Pilih minimal 1 Bab/Unit yang akan diajarkan semester ini.");
      return;
    }

    const jpMinggu = Number(jpPerMinggu) || 0;

    // Gabungkan unit terpilih + kegiatan lain, urutkan berdasarkan field urutan
    const gabungan = [
      ...dipilih.map((it) => {
        const minggu = Number(it.minggu) || 1;
        return {
          key: it.id,
          label: it.chapter,
          tpList: (it.tp || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          minggu,
          jp: minggu * jpMinggu,
          urutan: Number(it.urutan) || 0,
          tipe: "materi",
        };
      }),
      ...kegiatanLain.map((it) => {
        const minggu = Number(it.minggu) || 1;
        return {
          key: it.id,
          label: it.label,
          tpList: [],
          minggu,
          jp: minggu * jpMinggu,
          urutan: Number(it.urutan) || 0,
          tipe: "kegiatan",
        };
      }),
    ].sort((a, b) => a.urutan - b.urutan);

    // Bangun daftar slot minggu (per bulan)
    const bulanList = BULAN_SEMESTER[semester];
    const slots = [];
    bulanList.forEach((bulan) => {
      const n = Number(mingguEfektif[bulan] || 0);
      for (let i = 1; i <= n; i++) {
        slots.push({ bulan, mingguKe: i });
      }
    });

    // Alokasikan setiap item ke slot secara berurutan
    let cursor = 0;
    const teralokasi = gabungan.map((item) => {
      const start = cursor;
      const end = Math.min(cursor + item.minggu, slots.length);
      cursor = end;
      return { ...item, slotStart: start, slotEnd: end };
    });

    const totalMingguDibutuhkan = gabungan.reduce(
      (sum, it) => sum + it.minggu,
      0,
    );

    setError("");
    setHasil({
      namaSekolah,
      mataPelajaran,
      namaGuru,
      nipGuru,
      namaKepsek,
      nipKepsek,
      kelas,
      fase: FASE_MAP[kelas],
      tahunAjaran,
      semester,
      semesterLabel: SEMESTER_LABEL[semester] || semester,
      jpPerMinggu: jpMinggu,
      tempatTanggal,
      bulanList,
      mingguEfektif: { ...mingguEfektif },
      slots,
      items: teralokasi,
      totalMingguDibutuhkan,
      totalMingguTersedia: slots.length,
    });
  };

  const resetForm = () => {
    setNamaSekolah("SMP Muslimin Cililin");
    setMataPelajaran("Bahasa Inggris");
    setNamaGuru("");
    setNipGuru("");
    setNamaKepsek("H. Ade Nurmughni, S.Pd.");
    setNipKepsek("");
    setTahunAjaran("2026/2027");
    setJpPerMinggu(4);
    setTempatTanggal("");
    setMingguEfektif(buildDefaultMinggu(semester));
    setUnitItems(buildDefaultUnitItems(kelas));
    setKegiatanLain([
      { id: "pts", label: "Penilaian Tengah Semester", minggu: 1, urutan: 90 },
      { id: "pas", label: "Penilaian Akhir Semester", minggu: 1, urutan: 99 },
    ]);
    setHasil(null);
    setError("");
  };

  const [pdfExporting, setPdfExporting] = useState(false);

  // Langsung generate & download PDF tanpa lewat dialog print browser.
  const handleExportPdf = async () => {
    const element = document.getElementById("promes-output");
    if (!element) return;

    setPdfExporting(true);
    const clone = element.cloneNode(true);
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
    clone.style.boxShadow = "none";
    clone.style.border = "none";

    const mapelSlug = (hasil.mataPelajaran || "Mapel").replace(/\s+/g, "");
    const fileName = `Promes_${mapelSlug}_Kelas${hasil.kelas}_${
      hasil.semesterLabel
    }_${hasil.tahunAjaran.replace("/", "-")}.pdf`;

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
  // matriks Promes terbaca rapi saat dibuka di Microsoft Word.
  const buildExportHtml = (data) => {
    const cellStyle =
      "border:1px solid #333;padding:3px 4px;font-size:10px;font-family:Calibri,Arial,sans-serif;text-align:center;";
    const headStyle = cellStyle + "background:#dbeafe;font-weight:bold;";

    const bulanHeaderCells = data.bulanList
      .map((bulan) => {
        const span = Number(data.mingguEfektif[bulan] || 0);
        if (span === 0) return "";
        return `<th colspan="${span}" style="${headStyle}">${bulan}</th>`;
      })
      .join("");

    const mingguHeaderCells = data.slots
      .map(
        (slot) => `<th style="${headStyle}width:22px;">${slot.mingguKe}</th>`,
      )
      .join("");

    const bodyRows = data.items
      .map((item, idx) => {
        const cells = data.slots
          .map((_, i) => {
            const filled = i >= item.slotStart && i < item.slotEnd;
            return `<td style="${cellStyle}">${filled ? "v" : ""}</td>`;
          })
          .join("");
        const labelStyle =
          "border:1px solid #333;padding:3px 6px;font-size:10px;font-family:Calibri,Arial,sans-serif;" +
          (item.tipe === "kegiatan" ? "font-style:italic;color:#555;" : "");
        const tpHtml = item.tpList.length
          ? "<br/>" +
            item.tpList
              .map(
                (tp, i) =>
                  `<span style="display:block;padding-left:12px;">${idx + 1}.${i + 1} ${tp}</span>`,
              )
              .join("")
          : "";
        return `
          <tr>
            <td style="${cellStyle}width:28px;">${idx + 1}</td>
            <td style="${labelStyle}text-align:left;min-width:180px;"><b>${item.label}</b>${tpHtml}</td>
            <td style="${cellStyle}width:50px;">${item.jp} JP</td>
            ${cells}
          </tr>`;
      })
      .join("");

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Program Semester</title></head>
      <body style="font-family:Calibri,Arial,sans-serif;">
        <h2 style="text-align:center;text-transform:uppercase;">Program Semester (Promes)</h2>
        <table style="margin-bottom:16px;font-size:12px;width:100%;">
          <tr>
            <td style="width:120px;">Mata Pelajaran</td><td style="width:20px;">:</td><td style="width:280px;">${data.mataPelajaran}</td>
            <td style="width:120px;">Kelas / Semester</td><td style="width:20px;">:</td><td>${data.kelas} / ${data.semesterLabel}</td>
          </tr>
          <tr>
            <td>Alokasi Waktu</td><td>:</td><td>${data.jpPerMinggu} JP / Minggu</td>
            <td>Tahun Ajaran</td><td>:</td><td>${data.tahunAjaran}</td>
          </tr>
          <tr>
            <td>Satuan Pendidikan</td><td>:</td><td>${data.namaSekolah}</td>
            <td>Fase</td><td>:</td><td>${data.fase}</td>
          </tr>
        </table>
        <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">
          <tr>
            <th style="${headStyle}width:28px;" rowspan="2">No</th>
            <th style="${headStyle}text-align:left;min-width:180px;" rowspan="2">Materi Pokok / Tujuan Pembelajaran</th>
            <th style="${headStyle}width:50px;" rowspan="2">Alokasi Waktu</th>
            ${bulanHeaderCells}
          </tr>
          <tr>${mingguHeaderCells}</tr>
          ${bodyRows}
        </table>
        <p style="font-size:10px;">
          Tanda &ldquo;v&rdquo; menunjukkan minggu pelaksanaan pembelajaran / kegiatan.
        </p>
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
      alert("Silakan buat Program Semester terlebih dahulu.");
      return;
    }
    const htmlContent = buildExportHtml(hasil);
    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const mapelSlug = (hasil.mataPelajaran || "Mapel").replace(/\s+/g, "");
    link.download = `Promes_${mapelSlug}_Kelas${hasil.kelas}_${
      hasil.semesterLabel
    }_${hasil.tahunAjaran.replace("/", "-")}.doc`;
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
            <CalendarRange className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-blue-900">
              Program Semester Generator
            </h1>
          </div>
          <p className="text-blue-600 text-lg">
            Bahasa Inggris SMP &mdash; Fase D (mengacu Kepmendikdasmen/BSKAP No.
            046/H/KR/2025)
          </p>
        </div>

        {/* Form Identitas */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100 no-print">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            Identitas Program
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
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Mata Pelajaran *
              </label>
              <input
                type="text"
                value={mataPelajaran}
                onChange={(e) => setMataPelajaran(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-blue-900 font-semibold mb-2">
                Alokasi Waktu (JP / Minggu) *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={jpPerMinggu}
                onChange={(e) => setJpPerMinggu(e.target.value)}
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
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none">
                <option value="1">Ganjil (Juli&ndash;Desember)</option>
                <option value="2">Genap (Januari&ndash;Juni)</option>
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
          </div>
        </div>

        {/* Minggu Efektif */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100 no-print">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            Minggu Efektif per Bulan
          </h2>
          <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" /> Isi jumlah minggu efektif (bukan
            libur/PTS/PAS) untuk tiap bulan pada semester {semester}.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BULAN_SEMESTER[semester].map((bulan) => (
              <div key={bulan}>
                <label className="block text-blue-900 font-medium mb-1 text-sm">
                  {bulan}
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={mingguEfektif[bulan] ?? 0}
                  onChange={(e) =>
                    setMingguEfektif((prev) => ({
                      ...prev,
                      [bulan]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-center focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-blue-900 font-semibold">
            Total minggu efektif tersedia: {totalMingguEfektif} minggu
          </p>
        </div>

        {/* Pilih Bab/Unit */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100 no-print">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Bab / Unit yang Diajarkan Semester Ini
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-100 text-blue-900">
                  <th className="border border-blue-200 px-3 py-2 w-12">
                    Pilih
                  </th>
                  <th className="border border-blue-200 px-3 py-2 text-left">
                    Bab / Chapter
                  </th>
                  <th className="border border-blue-200 px-3 py-2 text-left">
                    Unit di dalamnya
                  </th>
                  <th className="border border-blue-200 px-3 py-2 text-left min-w-[220px]">
                    Tujuan Pembelajaran (auto dari modul, bisa diedit)
                  </th>
                  <th className="border border-blue-200 px-3 py-2 w-28">
                    Durasi (minggu)
                  </th>
                  <th className="border border-blue-200 px-3 py-2 w-24">
                    Urutan
                  </th>
                </tr>
              </thead>
              <tbody>
                {unitItems.map((it) => (
                  <tr key={it.id} className={it.selected ? "" : "opacity-40"}>
                    <td className="border border-blue-200 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={it.selected}
                        onChange={(e) =>
                          updateUnitItem(it.id, "selected", e.target.checked)
                        }
                        className="accent-blue-600 w-4 h-4"
                      />
                    </td>
                    <td className="border border-blue-200 px-3 py-2">
                      {it.chapter}
                    </td>
                    <td className="border border-blue-200 px-3 py-2 text-slate-500">
                      <ul className="list-disc list-inside">
                        {it.units.map((u) => (
                          <li key={u}>{u}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-blue-200 px-3 py-2">
                      <textarea
                        rows={Math.max(it.units.length, 2)}
                        value={it.tp}
                        onChange={(e) =>
                          updateUnitItem(it.id, "tp", e.target.value)
                        }
                        placeholder={
                          "Peserta didik mampu ...\nPeserta didik mampu ..."
                        }
                        className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
                      />
                    </td>
                    <td className="border border-blue-200 px-3 py-2 text-center">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={it.minggu}
                        onChange={(e) =>
                          updateUnitItem(it.id, "minggu", e.target.value)
                        }
                        className="w-16 px-2 py-1 border border-blue-200 rounded text-center"
                      />
                    </td>
                    <td className="border border-blue-200 px-3 py-2 text-center">
                      <input
                        type="number"
                        value={it.urutan}
                        onChange={(e) =>
                          updateUnitItem(it.id, "urutan", e.target.value)
                        }
                        className="w-16 px-2 py-1 border border-blue-200 rounded text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kegiatan Non Pembelajaran */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100 no-print">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-blue-900">
              Kegiatan Non-Pembelajaran (PTS, PAS, dll.)
            </h2>
            <button
              onClick={addKegiatan}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-100 text-blue-900">
                  <th className="border border-blue-200 px-3 py-2 text-left">
                    Nama Kegiatan
                  </th>
                  <th className="border border-blue-200 px-3 py-2 w-28">
                    Durasi (minggu)
                  </th>
                  <th className="border border-blue-200 px-3 py-2 w-24">
                    Urutan
                  </th>
                  <th className="border border-blue-200 px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {kegiatanLain.map((it) => (
                  <tr key={it.id}>
                    <td className="border border-blue-200 px-3 py-2">
                      <input
                        type="text"
                        value={it.label}
                        onChange={(e) =>
                          updateKegiatan(it.id, "label", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-blue-200 rounded"
                      />
                    </td>
                    <td className="border border-blue-200 px-3 py-2 text-center">
                      <input
                        type="number"
                        min="1"
                        max="4"
                        value={it.minggu}
                        onChange={(e) =>
                          updateKegiatan(it.id, "minggu", e.target.value)
                        }
                        className="w-16 px-2 py-1 border border-blue-200 rounded text-center"
                      />
                    </td>
                    <td className="border border-blue-200 px-3 py-2 text-center">
                      <input
                        type="number"
                        value={it.urutan}
                        onChange={(e) =>
                          updateKegiatan(it.id, "urutan", e.target.value)
                        }
                        className="w-16 px-2 py-1 border border-blue-200 rounded text-center"
                      />
                    </td>
                    <td className="border border-blue-200 px-3 py-2 text-center">
                      <button
                        onClick={() => removeKegiatan(it.id)}
                        className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
              onClick={generatePromes}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Buat Program Semester
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

        {/* Output */}
        {hasil && (
          <div
            className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100"
            id="promes-output">
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
                Program Semester (Promes)
              </h2>
              <p className="text-sm">
                Semester {hasil.semesterLabel} &mdash; Tahun Pelajaran{" "}
                {hasil.tahunAjaran}
              </p>
            </div>

            <table className="w-full text-sm mb-6">
              <tbody>
                <tr>
                  <td className="py-1 w-40 font-semibold">Mata Pelajaran</td>
                  <td className="py-1 w-56">: {hasil.mataPelajaran}</td>
                  <td className="py-1 w-40 font-semibold">Kelas / Semester</td>
                  <td className="py-1">
                    : {hasil.kelas} / {hasil.semesterLabel}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Alokasi Waktu</td>
                  <td className="py-1">: {hasil.jpPerMinggu} JP / Minggu</td>
                  <td className="py-1 font-semibold">Tahun Ajaran</td>
                  <td className="py-1">: {hasil.tahunAjaran}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold">Satuan Pendidikan</td>
                  <td className="py-1">: {hasil.namaSekolah}</td>
                  <td className="py-1 font-semibold">Fase</td>
                  <td className="py-1">: {hasil.fase}</td>
                </tr>
              </tbody>
            </table>

            {hasil.totalMingguDibutuhkan > hasil.totalMingguTersedia && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg text-sm">
                Perhatian: total durasi yang dibutuhkan (
                {hasil.totalMingguDibutuhkan} minggu) melebihi minggu efektif
                yang tersedia ({hasil.totalMingguTersedia} minggu). Sebagian
                item di bawah ini tidak mendapat slot &mdash; silakan sesuaikan
                durasi/minggu efektif.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th
                      rowSpan={2}
                      className="border border-slate-300 px-2 py-2 w-10">
                      No
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-slate-300 px-2 py-2 text-left min-w-[220px]">
                      Materi Pokok / Tujuan Pembelajaran
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-slate-300 px-2 py-2 w-20">
                      Alokasi Waktu
                    </th>
                    {hasil.bulanList.map((bulan) => {
                      const span = Number(hasil.mingguEfektif[bulan] || 0);
                      if (span === 0) return null;
                      return (
                        <th
                          key={bulan}
                          colSpan={span}
                          className="border border-slate-300 px-2 py-2">
                          {bulan}
                        </th>
                      );
                    })}
                  </tr>
                  <tr className="bg-slate-50">
                    {hasil.slots.map((slot, i) => (
                      <th
                        key={i}
                        className="border border-slate-300 px-2 py-1 w-8">
                        {slot.mingguKe}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hasil.items.map((item, idx) => (
                    <tr key={item.key}>
                      <td className="border border-slate-300 px-2 py-2 text-center align-top">
                        {idx + 1}
                      </td>
                      <td
                        className={`border border-slate-300 px-2 py-2 align-top ${
                          item.tipe === "kegiatan"
                            ? "italic text-slate-600"
                            : ""
                        }`}>
                        <span className="font-semibold">{item.label}</span>
                        {item.tpList.length > 0 && (
                          <ul className="mt-1 pl-4 list-none">
                            {item.tpList.map((tp, i) => (
                              <li key={i} className="font-normal">
                                {idx + 1}.{i + 1} {tp}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center align-top whitespace-nowrap">
                        {item.jp} JP
                      </td>
                      {hasil.slots.map((slot, i) => (
                        <td
                          key={i}
                          className="border border-slate-300 text-center align-top">
                          {i >= item.slotStart && i < item.slotEnd ? "v" : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-slate-600">
              Tanda &ldquo;v&rdquo; menunjukkan minggu pelaksanaan pembelajaran
              atau kegiatan (baris bercetak miring = PTS/PAS/Kegiatan
              Non-Pembelajaran).
            </div>

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
          #promes-output { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PromesPage;
