import React from "react";
import { Monitor, Printer, FileText } from "lucide-react";

// Pisah component ModulOutput sebagai React component terpisah
export const ModulOutput = ({
  hasilModul,
  kelas,
  onReset,
  onPrint,
  onExportWord,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100 print:shadow-none print:border-none">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <Monitor className="w-6 h-6" /> Hasil Modul Ajar
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Buat Modul Baru
          </button>
          <button
            onClick={onPrint}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print/Save PDF
          </button>
          <button
            onClick={onExportWord}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export ke Word
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">MODUL AJAR</h1>
        <h2 className="text-lg">BAHASA INGGRIS - KELAS {kelas}</h2>
        <p className="text-sm">
          Topik: {hasilModul.informasiUmum.identitas.tema}
        </p>
      </div>

      {/* Modul Sections */}
      {renderModulSections(hasilModul, kelas)}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 print:hidden">
        <button
          onClick={onReset}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
          Buat Modul Baru
        </button>
        <button
          onClick={onPrint}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
          <Printer className="w-5 h-5" />
          Print/Save PDF
        </button>
        <button
          onClick={onExportWord}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Export ke Word
        </button>
      </div>
    </div>
  );
};

// Render semua section modul sebagai function terpisah
const renderModulSections = (hasilModul, kelas) => {
  return (
    <>
      <section className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">
          I. Informasi Umum
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <strong>Nama Sekolah</strong>:
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
            {hasilModul.informasiUmum.identitas.namaSekolah}
          </p>
          <p>
            <strong>Nama Penyusun</strong>:
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
            {hasilModul.informasiUmum.identitas.namaGuru}
          </p>
          <p>
            <strong>Mata Pelajaran</strong>:
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
            {hasilModul.informasiUmum.identitas.mataPelajaran.toUpperCase()}
          </p>
          <p>
            <strong>Fase / Kelas / Semester</strong>: &nbsp;{" "}
            {hasilModul.informasiUmum.identitas.fase} -{" "}
            {hasilModul.informasiUmum.identitas.kelas} / 1
          </p>
          <p>
            <strong>Alokasi Waktu</strong>:
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
            {hasilModul.informasiUmum.identitas.alokasiWaktu}
          </p>
          <p>
            <strong>Tahun Penyusunan</strong>:
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {new Date().getFullYear()}
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">
          II. Capaian Pembelajaran & Tujuan
        </h3>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Capaian Pembelajaran</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            <li>
              <span className="font-semibold">Menyimak-Berbicara:</span>{" "}
              {
                hasilModul.desainPembelajaran.capaianPembelajaran.capaianUtama
                  .menyimakBerbicara
              }
            </li>
            <li>
              <span className="font-semibold">Membaca-Memirsa:</span>{" "}
              {
                hasilModul.desainPembelajaran.capaianPembelajaran.capaianUtama
                  .membacaMemirsa
              }
            </li>
            <li>
              <span className="font-semibold">Menulis-Mempresentasikan:</span>{" "}
              {
                hasilModul.desainPembelajaran.capaianPembelajaran.capaianUtama
                  .menulisMempresentasikan
              }
            </li>
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Tujuan Pembelajaran</h4>
          <p className="text-sm text-blue-700">
            {hasilModul.desainPembelajaran.tujuanPembelajaran.tujuanUmum}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">
            Indikator Keberhasilan
          </h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {hasilModul.desainPembelajaran.tujuanPembelajaran.kriteriaKeberhasilan.map(
              (item, index) => (
                <li key={index}>{item}</li>
              ),
            )}
          </ul>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">
          III. Dimensi Lulusan & Pembelajaran Mendalam
        </h3>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">
            Kesiapan Peserta Didik &amp; Karakteristik Materi
          </h4>
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Kesiapan Peserta Didik:</span>{" "}
            {hasilModul.identifikasi.kesiapanPesertaDidik}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <span className="font-semibold">Karakteristik Materi:</span>{" "}
            {hasilModul.identifikasi.karakteristikMateri}
          </p>
        </div>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">
            Dimensi Profil Lulusan
          </h4>
          <p className="text-sm text-blue-700">
            {hasilModul.identifikasi.dimensiProfilLulusan.dimensiUtama}
          </p>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1 mt-2">
            {hasilModul.identifikasi.dimensiProfilLulusan.indikatorDimensi.map(
              (dim, index) => (
                <li key={index}>
                  <span className="font-semibold">{dim.dimensi}:</span>{" "}
                  {dim.indikator}
                </li>
              ),
            )}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">
            Pendekatan Pembelajaran Mendalam
          </h4>
          <p className="text-sm italic text-blue-700">
            Prinsip: Berkesadaran, Bermakna, dan Menggembirakan
          </p>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1 mt-1">
            <li>
              <span className="font-semibold">Memahami:</span>{" "}
              {hasilModul.pengalamanBelajar.tahapanKognitif.memahami}
            </li>
            <li>
              <span className="font-semibold">Mengaplikasi:</span>{" "}
              {hasilModul.pengalamanBelajar.tahapanKognitif.mengaplikasi}
            </li>
            <li>
              <span className="font-semibold">Merefleksi:</span>{" "}
              {hasilModul.pengalamanBelajar.tahapanKognitif.merefleksi}
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">
          IV. Kegiatan Pembelajaran
        </h3>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Pendahuluan</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {hasilModul.pengalamanBelajar.kegiatanPembelajaran.pendahuluan.kegiatan.map(
              (keg, index) => (
                <li key={index}>{keg}</li>
              ),
            )}
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Kegiatan Inti</h4>
          {Object.entries(
            hasilModul.pengalamanBelajar.kegiatanPembelajaran.inti.tahapan,
          ).map(([tahap, data], index) => (
            <div key={index} className="pl-4 mb-2 border-l-2 border-blue-200">
              <h5 className="font-semibold text-blue-800 capitalize">
                {tahap}
              </h5>
              <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                {data.kegiatan.map((keg, idx) => (
                  <li key={idx}>{keg}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Penutup</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {hasilModul.pengalamanBelajar.kegiatanPembelajaran.penutup.kegiatan.map(
              (keg, index) => (
                <li key={index}>{keg}</li>
              ),
            )}
          </ul>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">
          V. Diferensiasi
        </h3>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Diferensiasi Konten</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            <li>
              <span className="font-semibold">Pemula:</span>{" "}
              {hasilModul.diferensiasi.diferensiasiKonten.pemula.materi}{" "}
            </li>
            <li>
              <span className="font-semibold">Menengah:</span>{" "}
              {hasilModul.diferensiasi.diferensiasiKonten.menengah.materi}
            </li>
            <li>
              <span className="font-semibold">Mahir:</span>{" "}
              {hasilModul.diferensiasi.diferensiasiKonten.mahir.materi}{" "}
            </li>
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Diferensiasi Proses</h4>
          <p className="text-sm text-blue-700">
            {hasilModul.diferensiasi.diferensiasiProses.visual}, &nbsp;
            {hasilModul.diferensiasi.diferensiasiProses.auditori}, &nbsp;
            {hasilModul.diferensiasi.diferensiasiProses.kinestetik}, &nbsp;
            {hasilModul.diferensiasi.diferensiasiProses.readwrite}.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Diferensiasi Produk</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {Object.values(hasilModul.diferensiasi.diferensiasiProduk).map(
              (item, index) => (
                <li key={index}>
                  <span className="font-semibold">{item.jenis}:</span>{" "}
                  {item.deskripsi}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">VI. Asesmen</h3>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Asesmen Formatif</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {hasilModul.asesmen.asesmenFormatif.teknik.map((t, index) => (
              <li key={index}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">
            Soal Formatif &amp; Kunci Jawaban
          </h4>
          <ol className="list-decimal pl-5 text-sm text-blue-700 space-y-2">
            {hasilModul.asesmen.asesmenFormatif.soalFormatif.map((soal) => (
              <li key={soal.nomor}>
                <span className="italic text-blue-500">({soal.tipeSoal})</span>{" "}
                {soal.pertanyaan}
                {soal.pilihanJawaban && (
                  <div className="pl-2 text-blue-600">
                    {Array.isArray(soal.pilihanJawaban)
                      ? soal.pilihanJawaban
                          .map((opsi) =>
                            typeof opsi === "object" && opsi !== null
                              ? `${opsi.label ?? ""}. ${opsi.text ?? ""}`.trim()
                              : String(opsi),
                          )
                          .join(", ")
                      : typeof soal.pilihanJawaban === "object"
                        ? JSON.stringify(soal.pilihanJawaban)
                        : soal.pilihanJawaban}
                  </div>
                )}
                <div className="text-green-700 font-semibold">
                  Kunci: {soal.kunciJawaban}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Asesmen Sumatif</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {hasilModul.asesmen.asesmenSumatif.teknik.map((t, index) => (
              <li key={index}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-6 print:hidden">
        <h3 className="text-lg font-bold text-blue-800 mb-2">
          VII. Sumber Belajar
        </h3>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Sumber Utama</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {hasilModul.sumberBelajar.sumberUtama.map((s, index) => (
              <li key={index}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Sumber Pendukung</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {hasilModul.sumberBelajar.sumberPendukung.map((s, index) => (
              <li key={index}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Teknologi Digital</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            {hasilModul.sumberBelajar.teknologiDigital.map((s, index) => (
              <li key={index}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-6 print:hidden">
        <h3 className="text-lg font-bold text-blue-800 mb-2">
          VIII. Refleksi Guru
        </h3>
        <div className="mb-4">
          <h4 className="font-semibold text-blue-900">Evaluasi Pembelajaran</h4>
          <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
            <li>
              <span className="font-semibold">Kelebihan:</span>{" "}
              {hasilModul.refleksiGuru.evaluasiPembelajaran.kelebihan}
            </li>
            <li>
              <span className="font-semibold">Kendala:</span>{" "}
              {hasilModul.refleksiGuru.evaluasiPembelajaran.kendala}
            </li>
            <li>
              <span className="font-semibold">Strategi Mengatasi:</span>{" "}
              {hasilModul.refleksiGuru.evaluasiPembelajaran.strategiMengatasi}
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-6 print:hidden">
        <h4 className="font-semibold text-blue-900">Tindak Lanjut</h4>
        <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
          <li>
            <span className="font-semibold">Remedial:</span>{" "}
            {hasilModul.refleksiGuru.tindakLanjut.remedial}
          </li>
          <li>
            <span className="font-semibold">Pengayaan:</span>{" "}
            {hasilModul.refleksiGuru.tindakLanjut.pengayaan}
          </li>
          <li>
            <span className="font-semibold">Perbaikan RPP:</span>{" "}
            {hasilModul.refleksiGuru.tindakLanjut.perbaikanRPP}
          </li>
        </ul>
      </section>
    </>
  );
};

// Fungsi export ke Word — pakai teknik Blob + inline HTML ber-marker Word,
// tanpa perlu library eksternal (html-to-docx/file-saver), konsisten dengan
// pendekatan yang dipakai di PromesPage.js dan ProtaPage.js.
const exportToWord = (hasilModul, kelas) => {
  const docContent = generateWordTemplate(hasilModul, kelas);
  const blob = new Blob(["\ufeff", docContent], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const tema = hasilModul?.informasiUmum?.identitas?.tema || "ModulAjar";
  const namaFileAman = tema.replace(/[^a-zA-Z0-9]+/g, "_");
  link.download = `ModulAjar_${namaFileAman}_Kelas${kelas}.doc`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Template untuk Word document
const generateWordTemplate = (hasilModul, kelas) => {
  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Calibri, sans-serif; line-height: 1.5; padding: 2cm; }
          h1 { text-align: center; font-size: 24pt; margin-bottom: 5px; }
          h2 { font-size: 18pt; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 5px; }
          h3 { font-size: 14pt; margin-top: 15px; }
          p { margin: 0 0 5px 0; }
          .identity-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .identity-cell-label { width: 25%; font-weight: bold; vertical-align: top; border: none; }
          .identity-cell-value { width: 75%; vertical-align: top; border: none; }
          ul, ol { margin: 0 0 10px 20px; padding: 0; }
          li { margin-bottom: 5px; }
          .section-header { margin-top: 30px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        </style>
      </head>
      <body>
        ${generateWordContent(hasilModul, kelas)}
      </body>
    </html>
  `;
};

// Generate content untuk Word document
const generateWordContent = (hasilModul, kelas) => {
  return `
    <h1>MODUL AJAR</h1>
    <h2>I. INFORMASI UMUM</h2>
    <table class="identity-table" cellspacing="0" cellpadding="4">
      <tr>
        <td class="identity-cell-label">Nama Sekolah</td>
        <td class="identity-cell-value">: ${
          hasilModul.informasiUmum.identitas.namaSekolah
        }</td>
      </tr>
      <tr>
        <td class="identity-cell-label">Nama Penyusun</td>
        <td class="identity-cell-value">: ${
          hasilModul.informasiUmum.identitas.namaGuru
        }</td>
      </tr>
      <tr>
        <td class="identity-cell-label">Mata Pelajaran</td>
        <td class="identity-cell-value">: ${hasilModul.informasiUmum.identitas.mataPelajaran.toUpperCase()}</td>
      </tr>
      <tr>
        <td class="identity-cell-label">Fase / Kelas / Semester</td>
        <td class="identity-cell-value">: ${
          hasilModul.informasiUmum.identitas.fase
        } - ${hasilModul.informasiUmum.identitas.kelas} / 1</td>
      </tr>
      <tr>
        <td class="identity-cell-label">Alokasi Waktu</td>
        <td class="identity-cell-value">: ${
          hasilModul.informasiUmum.identitas.alokasiWaktu
        }</td>
      </tr>
      <tr>
        <td class="identity-cell-label">Tahun Penyusunan</td>
        <td class="identity-cell-value">: ${new Date().getFullYear()}</td>
      </tr>
    </table>

    <h2 class="section-header">II. CAPAIAN PEMBELAJARAN & TUJUAN</h2>
    <h3>Capaian Pembelajaran</h3>
    <ul>
      <li><strong>Menyimak-Berbicara:</strong> ${
        hasilModul.desainPembelajaran.capaianPembelajaran.capaianUtama
          .menyimakBerbicara
      }</li>
      <li><strong>Membaca-Memirsa:</strong> ${
        hasilModul.desainPembelajaran.capaianPembelajaran.capaianUtama
          .membacaMemirsa
      }</li>
      <li><strong>Menulis-Mempresentasikan:</strong> ${
        hasilModul.desainPembelajaran.capaianPembelajaran.capaianUtama
          .menulisMempresentasikan
      }</li>
    </ul>
    <h3>Tujuan Pembelajaran</h3>
    <p>${hasilModul.desainPembelajaran.tujuanPembelajaran.tujuanUmum}</p>
    <h3>Indikator Keberhasilan</h3>
    <ul>
      ${hasilModul.desainPembelajaran.tujuanPembelajaran.kriteriaKeberhasilan
        .map((item) => `<li>${item}</li>`)
        .join("")}
    </ul>

    <h2 class="section-header">III. DIMENSI LULUSAN & PEMBELAJARAN MENDALAM</h2>
    <h3>Kesiapan Peserta Didik &amp; Karakteristik Materi</h3>
    <p><strong>Kesiapan:</strong> ${
      hasilModul.identifikasi.kesiapanPesertaDidik
    }</p>
    <p><strong>Karakteristik Materi:</strong> ${
      hasilModul.identifikasi.karakteristikMateri
    }</p>
    <h3>Dimensi Profil Lulusan</h3>
    <p>${hasilModul.identifikasi.dimensiProfilLulusan.dimensiUtama}</p>
    <ul>
      ${hasilModul.identifikasi.dimensiProfilLulusan.indikatorDimensi
        .map(
          (dim) => `<li><strong>${dim.dimensi}:</strong> ${dim.indikator}</li>`,
        )
        .join("")}
    </ul>
    <h3>Pendekatan Pembelajaran Mendalam</h3>
    <p><em>Prinsip: Berkesadaran, Bermakna, dan Menggembirakan</em></p>
    <ul>
      <li><strong>Memahami:</strong> ${
        hasilModul.pengalamanBelajar.tahapanKognitif.memahami
      }</li>
      <li><strong>Mengaplikasi:</strong> ${
        hasilModul.pengalamanBelajar.tahapanKognitif.mengaplikasi
      }</li>
      <li><strong>Merefleksi:</strong> ${
        hasilModul.pengalamanBelajar.tahapanKognitif.merefleksi
      }</li>
    </ul>

    <h2 class="section-header">IV. KEGIATAN PEMBELAJARAN</h2>
    <h3>Pendahuluan</h3>
    <ul>
      ${hasilModul.pengalamanBelajar.kegiatanPembelajaran.pendahuluan.kegiatan
        .map((keg) => `<li>${keg}</li>`)
        .join("")}
    </ul>
    <h3>Kegiatan Inti</h3>
    ${Object.entries(
      hasilModul.pengalamanBelajar.kegiatanPembelajaran.inti.tahapan,
    )
      .map(
        ([tahap, data]) => `
      <h4>${tahap.charAt(0).toUpperCase() + tahap.slice(1)}</h4>
      <ul>
        ${data.kegiatan.map((keg) => `<li>${keg}</li>`).join("")}
      </ul>
    `,
      )
      .join("")}
    <h3>Penutup</h3>
    <ul>
      ${hasilModul.pengalamanBelajar.kegiatanPembelajaran.penutup.kegiatan
        .map((keg) => `<li>${keg}</li>`)
        .join("")}
    </ul>

    <h2 class="section-header">V. DIFERENSIASI</h2>
    <h3>Diferensiasi Konten</h3>
    <ul>
      <li><strong>Pemula:</strong> ${
        hasilModul.diferensiasi.diferensiasiKonten.pemula.materi
      }</li>
      <li><strong>Menengah:</strong> ${
        hasilModul.diferensiasi.diferensiasiKonten.menengah.materi
      }</li>
      <li><strong>Mahir:</strong> ${
        hasilModul.diferensiasi.diferensiasiKonten.mahir.materi
      }</li>
    </ul>
    <h3>Diferensiasi Proses</h3>
    <p>${hasilModul.diferensiasi.diferensiasiProses.visual}, ${
      hasilModul.diferensiasi.diferensiasiProses.auditori
    }, ${hasilModul.diferensiasi.diferensiasiProses.kinestetik}, ${
      hasilModul.diferensiasi.diferensiasiProses.readwrite
    }.</p>
    <h3>Diferensiasi Produk</h3>
    <ul>
      ${Object.values(hasilModul.diferensiasi.diferensiasiProduk)
        .map(
          (item) =>
            `<li><strong>${item.jenis}:</strong> ${item.deskripsi}</li>`,
        )
        .join("")}
    </ul>

    <h2 class="section-header">VI. ASESMEN</h2>
    <h3>Asesmen Formatif</h3>
    <ul>
      ${hasilModul.asesmen.asesmenFormatif.teknik
        .map((t) => `<li>${t}</li>`)
        .join("")}
    </ul>
    <h3>Soal Formatif &amp; Kunci Jawaban</h3>
    <ol>
      ${hasilModul.asesmen.asesmenFormatif.soalFormatif
        .map(
          (soal) =>
            `<li>(${soal.tipeSoal}) ${soal.pertanyaan}${
              soal.pilihanJawaban ? `<br/>${soal.pilihanJawaban}` : ""
            }<br/><strong>Kunci: ${soal.kunciJawaban}</strong></li>`,
        )
        .join("")}
    </ol>
    <h3>Asesmen Sumatif</h3>
    <ul>
      ${hasilModul.asesmen.asesmenSumatif.teknik
        .map((t) => `<li>${t}</li>`)
        .join("")}
    </ul>

    <p style="page-break-before: always;"></p>

    <h2 class="section-header">VII. SUMBER BELAJAR</h2>
    <h3>Sumber Utama</h3>
    <ul>
      ${hasilModul.sumberBelajar.sumberUtama
        .map((s) => `<li>${s}</li>`)
        .join("")}
    </ul>
    <h3>Sumber Pendukung</h3>
    <ul>
      ${hasilModul.sumberBelajar.sumberPendukung
        .map((s) => `<li>${s}</li>`)
        .join("")}
    </ul>
    <h3>Teknologi Digital</h3>
    <ul>
      ${hasilModul.sumberBelajar.teknologiDigital
        .map((s) => `<li>${s}</li>`)
        .join("")}
    </ul>

    <h2 class="section-header">VIII. REFLEKSI GURU</h2>
    <h3>Evaluasi Pembelajaran</h3>
    <ul>
      <li><strong>Kelebihan:</strong> ${
        hasilModul.refleksiGuru.evaluasiPembelajaran.kelebihan
      }</li>
      <li><strong>Kendala:</strong> ${
        hasilModul.refleksiGuru.evaluasiPembelajaran.kendala
      }</li>
      <li><strong>Strategi Mengatasi:</strong> ${
        hasilModul.refleksiGuru.evaluasiPembelajaran.strategiMengatasi
      }</li>
    </ul>
    <h3>Tindak Lanjut</h3>
    <ul>
      <li><strong>Remedial:</strong> ${
        hasilModul.refleksiGuru.tindakLanjut.remedial
      }</li>
      <li><strong>Pengayaan:</strong> ${
        hasilModul.refleksiGuru.tindakLanjut.pengayaan
      }</li>
      <li><strong>Perbaikan RPP:</strong> ${
        hasilModul.refleksiGuru.tindakLanjut.perbaikanRPP
      }</li>
    </ul>
  `;
};

// Export object dengan semua fungsi
export const ModulTemplates = {
  ModulOutput,
  exportToWord,
};

export default ModulTemplates;
