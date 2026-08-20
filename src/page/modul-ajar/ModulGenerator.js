import {
  getOfficialCP,
  getUnitDetails,
  GROQ_API_URL,
  APP_SECRET,
  GROQ_CONFIG,
} from "./modulConfig";

export const ModulGenerator = {
  /**
   * Generate modul ajar menggunakan Groq API
   * @param {Object} params - Parameter untuk generate modul
   * @returns {Promise<Object>} - Modul data yang sudah di-parse
   */
  async generateModul(params) {
    const {
      namaSekolah,
      namaGuru,
      mapel,
      kelas,
      chapter,
      topik,
      alokasiWaktu,
      dimensi,
    } = params;

    // Validasi input params
    this.validateParams(params);

    const unitDetails = getUnitDetails(chapter, topik, kelas);
    const officialCP = getOfficialCP(kelas);

    const promptParams = {
      namaSekolah,
      namaGuru,
      mapel,
      kelas,
      chapter,
      topik,
      alokasiWaktu,
      dimensi,
      unitDetails,
      officialCP,
    };

    const systemPrompt = this.generateSystemPrompt(kelas);

    // Request 1a: informasiUmum + identifikasi + desainPembelajaran
    const userPrompt1a =
      this.generateUserPromptPart1a(promptParams) +
      this.generateAdditionalInstructionsPart1a(kelas);
    const rawPart1a = await this.callGroq(
      systemPrompt,
      userPrompt1a,
      GROQ_CONFIG.maxTokensPart1a,
      "Bagian 1a",
    );
    const part1aData = this.parsePartialJSON(rawPart1a, "Bagian 1a");

    // Request 1b: pengalamanBelajar saja (paling banyak konten)
    const userPrompt1b =
      this.generateUserPromptPart1b(promptParams) +
      this.generateAdditionalInstructionsPart1b();
    const rawPart1b = await this.callGroq(
      systemPrompt,
      userPrompt1b,
      GROQ_CONFIG.maxTokensPart1b,
      "Bagian 1b",
    );
    const part1bData = this.parsePartialJSON(rawPart1b, "Bagian 1b");

    // Request 2: diferensiasi + asesmen + sumberBelajar
    const userPrompt2 =
      this.generateUserPromptPart2(promptParams) +
      this.generateAdditionalInstructionsPart2();
    const rawPart2 = await this.callGroq(
      systemPrompt,
      userPrompt2,
      GROQ_CONFIG.maxTokensPart2,
      "Bagian 2",
    );
    const part2Data = this.parsePartialJSON(rawPart2, "Bagian 2");

    // Gabungkan ketiga bagian + refleksiGuru statis (tidak perlu digenerate AI)
    const modulData = {
      ...part1aData,
      ...part1bData,
      ...part2Data,
      refleksiGuru: this.getStaticRefleksiGuru(),
    };

    if (!this.validateModulStructure(modulData)) {
      throw new Error(
        "❌ Struktur modul tidak lengkap setelah digabungkan. Silakan coba lagi.",
      );
    }

    return modulData;
  },

  /**
   * Panggil Groq API sekali dan kembalikan raw text content.
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {number} maxTokens
   * @param {string} partLabel - label untuk pesan error (mis. "Bagian 1")
   * @returns {Promise<string>} - raw generated content
   */
  /**
   * Delay/sleep helper
   * @param {number} ms
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Panggil Groq API sekali, dengan retry otomatis kalau kena rate limit TPM
   * (limit TPM di Groq bersifat akumulatif per menit di seluruh request, jadi
   * saat kena limit, Groq kasih tau berapa detik lagi harus nunggu — kita
   * tunggu sesuai saran itu lalu coba ulang).
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {number} maxTokens
   * @param {string} partLabel - label untuk pesan error (mis. "Bagian 1")
   * @param {number} retriesLeft - sisa kesempatan retry kalau kena rate limit
   * @returns {Promise<string>} - raw generated content
   */
  async callGroq(
    systemPrompt,
    userPrompt,
    maxTokens,
    partLabel,
    retriesLeft = 2,
  ) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "x-app-secret": APP_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: GROQ_CONFIG.temperature,
          top_p: GROQ_CONFIG.topP,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          response.statusText ||
          "Unknown error";

        // Rate limit TPM: Groq kasih tau berapa detik harus nunggu.
        // Tunggu sesuai saran (+buffer 2 detik) lalu retry otomatis,
        // daripada langsung gagal ke user.
        const isRateLimit =
          errorMessage.includes("Rate limit reached") ||
          errorMessage.includes("rate_limit");

        if (isRateLimit && retriesLeft > 0) {
          const waitMatch = errorMessage.match(/try again in\s+([\d.]+)s/i);
          const waitSeconds = waitMatch ? parseFloat(waitMatch[1]) : 15;
          console.warn(
            `${partLabel}: kena rate limit TPM, menunggu ${waitSeconds}s sebelum retry (${retriesLeft} percobaan tersisa)...`,
          );
          await this.sleep((waitSeconds + 2) * 1000);
          return this.callGroq(
            systemPrompt,
            userPrompt,
            maxTokens,
            partLabel,
            retriesLeft - 1,
          );
        }

        throw new Error(`Groq API Error: ${errorMessage}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error("Invalid response structure from AI");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error(`Modul Generation Error (${partLabel}):`, error);

      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "❌ Gagal terhubung ke server AI. Periksa koneksi internet Anda.",
        );
      }

      if (error.message.includes("Groq API Error")) {
        throw new Error(
          `❌ Error dari AI (${partLabel}): ${error.message.replace("Groq API Error: ", "")}`,
        );
      }

      if (error.message.includes("Invalid response structure")) {
        throw new Error(
          `❌ Respons AI (${partLabel}) tidak valid. Silakan coba lagi dalam beberapa saat.`,
        );
      }

      if (
        error.message.includes("NetworkError") ||
        error.message.includes("timeout")
      ) {
        throw new Error("❌ Koneksi terputus. Periksa jaringan internet Anda.");
      }

      throw new Error(
        `❌ Terjadi kesalahan (${partLabel}): ${error.message || "Unknown error"}`,
      );
    }
  },

  /**
   * Generate modul dengan retry mechanism
   * @param {Object} params - Parameter untuk generate modul
   * @param {number} maxRetries - Maksimal percobaan ulang (default: 2)
   * @returns {Promise<Object>} - Modul data
   */
  async generateModulWithRetry(params, maxRetries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateModul(params);
      } catch (error) {
        lastError = error;

        // Jangan retry kalau error validasi input
        if (
          error.message.includes("Parameter") ||
          error.message.includes("wajib")
        ) {
          throw error;
        }

        // Jika masih ada kesempatan retry
        if (attempt < maxRetries) {
          console.warn(`Attempt ${attempt + 1} failed, retrying...`);
          // Delay sebelum retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt)),
          );
        }
      }
    }

    throw lastError;
  },

  /**
   * Validasi input parameters
   * @param {Object} params - Parameter yang akan divalidasi
   */
  validateParams(params) {
    const required = [
      "namaSekolah",
      "namaGuru",
      "mapel",
      "kelas",
      "topik",
      "alokasiWaktu",
      "dimensi",
    ];

    for (const field of required) {
      if (!params[field]) {
        throw new Error(`❌ Parameter '${field}' wajib diisi!`);
      }
    }

    // Validasi kelas
    if (!["7", "8", "9"].includes(params.kelas)) {
      throw new Error("❌ Kelas harus 7, 8, atau 9!");
    }

    // Validasi alokasi waktu
    if (params.alokasiWaktu < 1 || params.alokasiWaktu > 10) {
      throw new Error("❌ Alokasi waktu harus antara 1-10 JP!");
    }

    // Validasi dimensi
    if (!Array.isArray(params.dimensi) || params.dimensi.length === 0) {
      throw new Error(
        "❌ Dimensi profil lulusan harus berupa array dan tidak boleh kosong!",
      );
    }
  },

  /**
   * Generate system prompt berdasarkan kelas
   * @param {string} kelas - Kelas siswa (7, 8, atau 9)
   * @returns {string} - System prompt
   */
  generateSystemPrompt(kelas) {
    const kelasSpecs = {
      7: "Fokus pada pembelajaran dasar, aktivitas interaktif, dan membangun kepercayaan diri siswa dalam berbahasa Inggris dengan pendekatan yang menyenangkan dan kontekstual.",
      8: "Fokus pada pembelajaran berbasis nilai moral, lingkungan, dan pengembangan karakter dengan pendekatan storytelling dan project-based learning sederhana.",
      9: "Fokus pada berbagai jenis teks kompleks, critical thinking, dan project-based learning yang menantang.",
    };

    return `Guru Bahasa Inggris expert Kurikulum Merdeka, ahli Modul Ajar format Kemendikdasmen 2025 & pedagogi Pembelajaran Mendalam (berkesadaran, bermakna, menggembirakan).

KELAS ${kelas}: ${kelasSpecs[kelas]}

4 ELEMEN WAJIB (urutan tetap, jangan tukar isi antar elemen):
1. IDENTIFIKASI: kesiapan siswa, karakteristik materi, Dimensi Profil Lulusan (TANPA Tujuan Pembelajaran)
2. DESAIN PEMBELAJARAN: Capaian Pembelajaran resmi, topik kontekstual, integrasi KKA+numerasi, Tujuan Pembelajaran, kerangka pembelajaran
3. PENGALAMAN BELAJAR: prinsip berkesadaran-bermakna-menggembirakan, tahap memahami-mengaplikasi-merefleksi, kegiatan awal-inti-penutup
4. ASESMEN: diagnostik, formatif (10 soal+kunci), sumatif (opsional)

ATURAN: JSON valid PERSIS sesuai template (key/posisi jangan diubah); komponen koheren; Fase D; nilai Pancasila konkret; diferensiasi sesuai kebutuhan heterogen; asesmen autentik; KKA/numerasi wajib contoh aktivitas konkret bukan sekadar istilah.`;
  },

  /**
   * Generate user prompt dengan detail parameter
   * @param {Object} params - Parameter untuk prompt
   * @returns {string} - User prompt
   */
  generateUserPromptPart1a(params) {
    const {
      namaSekolah,
      namaGuru,
      mapel,
      kelas,
      topik,
      alokasiWaktu,
      dimensi,
      unitDetails,
      officialCP,
    } = params;

    return `
BUAT BAGIAN 1A (informasiUmum, identifikasi, desainPembelajaran) DARI MODUL AJAR PEMBELAJARAN MENDALAM SESUAI FORMAT KEMENDIKDASMEN 2025:

UMUM: Sekolah=${namaSekolah} | Guru=${namaGuru} | Mapel=${mapel} | Kelas=${kelas} (Fase D) | Tema=${topik} | Tipe Teks=${unitDetails.textType || "General"} | Waktu=${alokasiWaktu} JP (${alokasiWaktu * 40} menit)

ELEMEN 1: Dimensi Profil Lulusan=${dimensi.join(", ")}. Kesiapan siswa: literasi digital dasar, media digital terbatas, suka praktik&diskusi (bukan ceramah), tugas tidak membebani.

ELEMEN 2 — CP resmi: Menyimak-Berbicara="${officialCP.listening_speaking}" | Membaca-Memirsa="${officialCP.reading_viewing}" | Menulis-Mempresentasikan="${officialCP.writing_presenting}". Integrasikan KKA & literasi numerasi dengan aktivitas konkret relevan ke ${topik} (bukan sekadar istilah).

MATERI: Buku "English for Nusantara" Kelas ${kelas}, hal ${unitDetails.pages || "TBD"} | Skills=${unitDetails.skills || "Integrated Skills"} | Grammar=${unitDetails.grammar || "Basic Grammar"} | Vocab=${unitDetails.vocabulary || "General vocabulary"} | Kompetensi=${unitDetails.coreCompetencies || "General communication"}

FORMAT JSON (ikuti persis, key/urutan jangan diubah, cukup 3 elemen di atas — JANGAN tambah field pengalamanBelajar/diferensiasi/asesmen/sumberBelajar):
${this.getJSONTemplatePart1a()}
`;
  },

  /**
   * Generate user prompt Part 1b: pengalamanBelajar saja
   * @param {Object} params - Parameter untuk prompt
   * @returns {string} - User prompt
   */
  generateUserPromptPart1b(params) {
    const { kelas, topik, alokasiWaktu, unitDetails } = params;

    return `
BUAT BAGIAN 1B (pengalamanBelajar SAJA) DARI MODUL AJAR PEMBELAJARAN MENDALAM SESUAI FORMAT KEMENDIKDASMEN 2025:

KONTEKS: Kelas=${kelas} (Fase D) | Tema=${topik} | Waktu=${alokasiWaktu} JP (${alokasiWaktu * 40} menit) | Tipe Teks=${unitDetails.textType || "General"} | Halaman buku=${unitDetails.pages || "TBD"} | Skills=${unitDetails.skills || "Integrated Skills"} | Grammar=${unitDetails.grammar || "Basic Grammar"} | Vocab=${unitDetails.vocabulary || "General vocabulary"}

Kegiatan harus mewujudkan prinsip berkesadaran-bermakna-menggembirakan, tahap memahami-mengaplikasi-merefleksi, dan kegiatan awal-inti-penutup yang detail & konkret (bukan generik).

FORMAT JSON (ikuti persis, key/urutan jangan diubah, HANYA field pengalamanBelajar — JANGAN tambah field lain):
${this.getJSONTemplatePart1b()}
`;
  },

  /**
   * Generate user prompt Part 2: diferensiasi, asesmen, sumberBelajar
   * @param {Object} params - Parameter untuk prompt
   * @returns {string} - User prompt
   */
  generateUserPromptPart2(params) {
    const { kelas, topik, unitDetails } = params;

    return `
BUAT BAGIAN 2 (diferensiasi, asesmen, sumberBelajar) DARI MODUL AJAR PEMBELAJARAN MENDALAM SESUAI FORMAT KEMENDIKDASMEN 2025:

KONTEKS: Kelas=${kelas} (Fase D) | Tema=${topik} | Tipe Teks=${unitDetails.textType || "General"} | Grammar=${unitDetails.grammar || "Basic Grammar"} | Vocab=${unitDetails.vocabulary || "General vocabulary"} | Halaman buku=${unitDetails.pages || "TBD"}

Asesmen awal: 2-3 soal diagnostik singkat. Asesmen formatif: WAJIB tepat 10 soal+kunci jawaban tentang ${topik}, sesuai grammar/vocab di atas.

FORMAT JSON (ikuti persis, key/urutan jangan diubah, cukup 3 elemen di atas — JANGAN tambah field informasiUmum/identifikasi/desainPembelajaran/pengalamanBelajar/refleksiGuru):
${this.getJSONTemplatePart2()}
`;
  },

  /**
   * Generate template JSON untuk modul ajar
   * @returns {string} - JSON template string
   */
  getJSONTemplatePart1a() {
    return `{
  "informasiUmum": {
    "identitas": {
      "namaSekolah": "[namaSekolah]",
      "namaGuru": "[namaGuru]",
      "fase": "D",
      "kelas": "[kelas]",
      "mataPelajaran": "Bahasa Inggris",
      "tema": "[topik]",
      "subTema": "[sub-tema relevan]",
      "jenisText": "[textType]",
      "alokasiWaktu": "[alokasiWaktu] JP ([alokasiWaktu * 40] menit)",
      "tahunAjaran": "[thn ajaran berjalan]",
      "mingguKe": "[minggu ke- dlm semester]"
    },
    "bahanAjar": {
      "sumberUtama": "Buku English for Nusantara Kelas [kelas]",
      "halaman": "[pages]",
      "materiInti": "[materi inti]",
      "prasyaratPengetahuan": "[prasyarat pengetahuan]"
    }
  },
  "identifikasi": {
    "kesiapanPesertaDidik": "[kesiapan: literasi digital, gaya belajar praktik&diskusi, keterbatasan media digital]",
    "karakteristikMateri": "[karakteristik materi unit ini & tingkat kesulitan utk kelas [kelas]]",
    "dimensiProfilLulusan": {
      "dimensiUtama": "[dimensi]",
      "alasanPemilihan": "[relevansi dimensi dgn topik [topik]]",
      "indikatorDimensi": [
        { "dimensi": "[dimensi 1]", "indikator": "[indikator perilaku]" },
        { "dimensi": "[dimensi 2]", "indikator": "[indikator perilaku]" }
      ],
      "integrasiDalamPembelajaran": {
        "kegiatanIntegrasi": "[kegiatan konkret integrasi nilai Pancasila]",
        "strategiPenguatan": "[strategi penguatan internalisasi nilai]"
      }
    }
  },
  "desainPembelajaran": {
    "capaianPembelajaran": {
      "elemen": ["Menyimak-Berbicara", "Membaca-Memirsa", "Menulis-Mempresentasikan"],
      "capaianUtama": {
        "menyimakBerbicara": "[listening_speaking]",
        "membacaMemirsa": "[reading_viewing]",
        "menulisMempresentasikan": "[writing_presenting]"
      },
      "indikatorKeberhasilan": [
        { "keterampilan": "Menyimak", "indikator": "[3-4 indikator]" },
        { "keterampilan": "Berbicara", "indikator": "[3-4 indikator]" },
        { "keterampilan": "Membaca", "indikator": "[3-4 indikator]" },
        { "keterampilan": "Menulis", "indikator": "[3-4 indikator]" }
      ]
    },
    "topikKontekstual": "[relevansi topik [topik] dgn kehidupan siswa kelas [kelas]]",
    "integrasiLintasDisiplin": {
      "kodingKecerdasanArtifisial": "[1 aktivitas konkret KKA terkait topik [topik], bukan sekadar istilah]",
      "literasiNumerasi": "[1 aktivitas konkret literasi numerasi terkait topik [topik]]"
    },
    "tujuanPembelajaran": {
      "tujuanUmum": "Setelah mengikuti pembelajaran, siswa mampu [coreCompetencies] menggunakan [textType] dengan tepat dalam konteks yang relevan",
      "tujuanKhusus": [
        { "aspek": "Pengetahuan", "tujuan": "[tujuan pengetahuan]" },
        { "aspek": "Keterampilan", "tujuan": "[tujuan keterampilan]" },
        { "aspek": "Sikap", "tujuan": "[tujuan sikap]" }
      ],
      "kriteriaKeberhasilan": ["[array kriteria keberhasilan, 1 poin per item]"]
    },
    "kerangkaPembelajaran": {
      "praktikPedagogis": "[strategi pedagogis sesuai gaya belajar praktik&diskusi]",
      "lingkunganBelajar": "[lingkungan fisik/psikologis pendukung]",
      "kemitraanPembelajaran": "[kemitraan relevan, mis. ortu/komunitas, jika ada]",
      "pemanfaatanDigital": "[pemanfaatan digital REALISTIS, media terbatas]"
    }
  }
}`;
  },

  /**
   * Generate template JSON Part 1b (pengalamanBelajar saja — paling banyak konten)
   * @returns {string} - JSON template string
   */
  getJSONTemplatePart1b() {
    return `{
  "pengalamanBelajar": {
    "prinsip": {
      "prinsipUtama": "Berkesadaran, Bermakna, dan Menggembirakan",
      "penerapan": "[ringkas: bagaimana kegiatan mewujudkan 3 prinsip]"
    },
    "tahapanKognitif": {
      "memahami": "[siswa membangun pemahaman baru ttg [topik]]",
      "mengaplikasi": "[siswa menerapkan pemahaman dlm konteks nyata]",
      "merefleksi": "[siswa merefleksikan proses & hasil belajar]"
    },
    "kegiatanPembelajaran": {
    "pendahuluan": {
      "waktu": "10 menit",
      "tujuan": "[tujuan pendahuluan]",
      "kegiatan": ["[4-5 langkah: salam/doa/presensi, apersepsi [topik], tujuan pembelajaran, ice breaking]"],
      "metode": "Interactive questioning, storytelling, brainstorming",
      "media": "[media yang digunakan]",
      "nilaiKarakter": "Religius, Komunikatif, Rasa Ingin Tahu"
    },
    "inti": {
      "waktu": "[alokasiWaktu * 40 - 20] menit",
      "tahapan": {
        "eksplorasi": {
          "waktu": "[Math.floor((alokasiWaktu * 40 - 20) * 0.4)] menit",
          "tujuan": "[tujuan eksplorasi]",
          "kegiatan": ["[3-4 langkah: amati [textType] hal [pages], tanya jawab, identifikasi [vocabulary]/[grammar]]"],
          "metode": "Discovery learning, questioning, observation",
          "peranGuru": "Fasilitator, motivator",
          "peranSiswa": "Aktif mengeksplorasi, bertanya, mengamati"
        },
        "elaborasi": {
          "waktu": "[Math.floor((alokasiWaktu * 40 - 20) * 0.4)] menit",
          "tujuan": "[tujuan elaborasi]",
          "kegiatan": ["[3-4 langkah: latihan [skills] kelompok kecil LKPD, guidance [grammar], karya [textType]]"],
          "metode": "Collaborative learning, project-based learning, practice",
          "peranGuru": "Pembimbing, pemberi umpan balik",
          "peranSiswa": "Berlatih, berkolaborasi, menghasilkan karya"
        },
        "konfirmasi": {
          "waktu": "[Math.floor((alokasiWaktu * 40 - 20) * 0.2)] menit",
          "tujuan": "[tujuan konfirmasi]",
          "kegiatan": ["[3-4 langkah: presentasi hasil kerja, feedback guru, refleksi siswa]"],
          "metode": "Presentation, feedback, reflection",
          "peranGuru": "Evaluator, pemberi penguatan",
          "peranSiswa": "Mempresentasikan, merefleksi, mengkonfirmasi pemahaman"
        }
      },
      "nilaiKarakter": "Kolaboratif, Kreatif, Komunikatif, Percaya Diri"
    },
    "penutup": {
      "waktu": "10 menit",
      "tujuan": "[tujuan penutup]",
      "kegiatan": ["[4-5 langkah: refleksi bersama, simpulan, umpan balik, preview materi berikutnya, doa/salam]"],
      "metode": "Reflection, summary, reinforcement",
      "nilaiKarakter": "Reflektif, Religius, Bertanggung Jawab"
    }
    }
  }
}`;
  },

  /**
   * Generate template JSON Part 2 (diferensiasi, asesmen, sumberBelajar)
   * @returns {string} - JSON template string
   */
  getJSONTemplatePart2() {
    return `{
  "diferensiasi": {
    "diferensiasiKonten": {
      "pemula": { "materi": "Materi dasar, vocab sederhana", "dukungan": "Scaffolding banyak" },
      "menengah": { "materi": "Materi standar + latihan tambahan", "dukungan": "Guidance sesuai kebutuhan" },
      "mahir": { "materi": "Materi diperkaya, tantangan lebih", "dukungan": "Proyek mandiri, tutor sebaya" }
    },
    "diferensiasiProses": {
      "visual": "Gambar/diagram/video", "auditori": "Audio/diskusi/presentasi",
      "kinestetik": "Role play/games/hands-on", "readwrite": "Teks/catatan/worksheet"
    },
    "diferensiasiProduk": {
      "pilihan1": { "jenis": "Presentasi lisan", "deskripsi": "Individu/kelompok" },
      "pilihan2": { "jenis": "Karya tulis kreatif", "deskripsi": "Sesuai jenis teks dipelajari" },
      "pilihan3": { "jenis": "Video/poster digital", "deskripsi": "Media visual" },
      "pilihan4": { "jenis": "Proyek kolaboratif", "deskripsi": "Produk kelompok" }
    }
  },
  "asesmen": {
    "asesmenAwal": {
      "tujuan": "Cek kesiapan siswa sebelum masuk materi [topik]",
      "soal": ["[diagnostik 1]", "[diagnostik 2]", "[diagnostik 3]"]
    },
    "asesmenFormatif": {
      "teknik": ["Observasi", "Tanya jawab", "Exit ticket", "Peer assessment", "Kuis singkat"],
      "instrumen": "Checklist, rubrik, kuis",
      "waktu": "Selama pembelajaran",
      "tujuan": "Memantau perkembangan & umpan balik segera",
      "soalFormatif": [
        {
          "nomor": 1,
          "tipeSoal": "[pilihan ganda/isian singkat/uraian singkat]",
          "pertanyaan": "[Soal terkait [topik], sesuai [grammar]/[vocabulary]]",
          "pilihanJawaban": "[opsi A-D jika pilihan ganda, atau null]",
          "kunciJawaban": "[Jawaban benar]"
        }
        // WAJIB: lanjutkan pola di atas s.d. nomor 10 (total 10 objek, struktur sama).
      ]
    },
    "asesmenSumatif": {
      "catatan": "Opsional — isi hanya jika unit ini penutup topik besar",
      "teknik": ["Tes tertulis", "Performance assessment", "Portfolio", "Project-based"],
      "instrumen": "Soal tes, rubrik kinerja, panduan portofolio",
      "waktu": "Akhir pembelajaran",
      "tujuan": "Mengukur pencapaian hasil belajar komprehensif"
    },
    "rubrikPenilaian": {
      "aspekPenilaian": [
        { "aspek": "Pengetahuan", "indikator": "[indikator]", "skala": "1-4" },
        { "aspek": "Keterampilan", "indikator": "[indikator]", "skala": "1-4" },
        { "aspek": "Sikap", "indikator": "[indikator]", "skala": "1-4" }
      ]
    }
  },
  "sumberBelajar": {
    "sumberUtama": ["Buku English for Nusantara Kelas [kelas] hal [pages]", "Buku guru/siswa Kurikulum Merdeka"],
    "sumberPendukung": ["Video edukasi", "Worksheet/LKPD", "Realia terkait tema"],
    "teknologiDigital": ["Google Classroom", "Kahoot/Quizizz", "Canva"]
  }
}`;
  },

  /**
   * Refleksi guru statis (diisi guru setelah mengajar, tidak perlu digenerate AI)
   * @returns {Object}
   */
  getStaticRefleksiGuru() {
    return {
      evaluasiPembelajaran: {
        kelebihan: "[Isi setelah pembelajaran: aspek yang berjalan efektif]",
        kendala: "[Isi setelah pembelajaran: hambatan yang ditemui]",
        strategiMengatasi:
          "[Isi setelah pembelajaran: rencana mengatasi kendala]",
      },
      tindakLanjut: {
        remedial: "Program untuk siswa yang belum mencapai target",
        pengayaan: "Aktivitas untuk siswa yang telah mencapai target",
        perbaikanRPP: "Penyempurnaan untuk pembelajaran berikutnya",
      },
      catatanKhusus: {
        siswaBerkebutuhan:
          "[Isi setelah pembelajaran: observasi siswa yang perlu perhatian khusus]",
        ketercapaianTujuan:
          "[Isi setelah pembelajaran: analisis pencapaian tujuan]",
        rekomendasi: "[Isi setelah pembelajaran: saran untuk topik serupa]",
      },
    };
  },

  /**
   * Generate additional instructions berdasarkan kelas
   * @param {string} kelas - Kelas siswa
   * @returns {string} - Additional instructions
   */
  generateAdditionalInstructionsPart1a(kelas) {
    return `

PETUNJUK KHUSUS:
- Isi semua [] dengan konten relevan & spesifik
- Sesuaikan fase perkembangan siswa kelas ${kelas}; integrasikan literasi digital & keterampilan abad 21
- "tahunAjaran" = tahun ajaran berjalan sesuai tanggal hari ini (format "2025/2026"), jangan tahun lewat
- JANGAN tukar posisi field antar elemen: "tujuanPembelajaran" tetap di "desainPembelajaran"; kesiapan/karakteristik siswa tetap di "identifikasi"`;
  },

  /**
   * Generate additional instructions Part 1b
   * @returns {string} - Additional instructions
   */
  generateAdditionalInstructionsPart1b() {
    return `

PETUNJUK KHUSUS:
- Isi semua [] dengan konten relevan & spesifik; waktu tiap kegiatan proporsional
- Pendekatan saintifik (5M) di kegiatan inti
- Deep Learning (berkesadaran-bermakna-menggembirakan) wajib terasa di seluruh isi`;
  },

  /**
   * Generate additional instructions Part 2
   * @returns {string} - Additional instructions
   */
  generateAdditionalInstructionsPart2() {
    return `

PETUNJUK KHUSUS:
- Isi semua [] dengan konten relevan & spesifik
- Asesmen sesuai tujuan pembelajaran; diferensiasi praktis & dapat diterapkan
- WAJIB tepat 10 soal di array "soalFormatif" (bukan kurang, bukan lebih) + kunci jawaban masing-masing`;
  },

  /**
   * Parse JSON dari salah satu bagian response AI (tanpa validasi struktur
   * penuh — validasi struktur lengkap dilakukan setelah kedua bagian digabung).
   * @param {string} generatedContent - Raw content dari AI
   * @param {string} partLabel - label untuk pesan error (mis. "Bagian 1")
   * @returns {Object} - Parsed partial modul data
   */
  parsePartialJSON(generatedContent, partLabel) {
    try {
      return JSON.parse(generatedContent);
    } catch (e) {
      // Lanjut ke extraction manual
    }

    let cleaned = generatedContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    if (start === -1) {
      throw new Error(
        `❌ AI (${partLabel}) tidak menghasilkan format JSON. Mohon coba kembali.`,
      );
    }

    let depth = 0;
    let end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) {
      throw new Error(
        `❌ JSON (${partLabel}): respons AI terpotong sebelum selesai (kemungkinan maxTokens terlalu kecil). Coba lagi atau naikkan GROQ_CONFIG.maxTokensPart1/Part2.`,
      );
    }

    const jsonStr = cleaned.slice(start, end + 1);

    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error(`JSON Parse Error (${partLabel}):`, parseError);
      throw new Error(
        `❌ AI (${partLabel}) menghasilkan format yang tidak valid. Coba ulangi.`,
      );
    }
  },

  /**
   * Parse dan validate generated content dari AI (legacy, single-call — tidak
   * dipakai lagi oleh generateModul, dipertahankan untuk kompatibilitas)
   * @param {string} generatedContent - Raw content dari AI
   * @returns {Object} - Parsed modul data
   */
  parseGeneratedContent(generatedContent) {
    // Coba parse langsung dulu
    try {
      const directParse = JSON.parse(generatedContent);
      if (this.validateModulStructure(directParse)) {
        return directParse;
      }
    } catch (e) {
      // Lanjut ke extraction manual
    }

    // Bersihkan code fence markdown kalau ada
    let cleaned = generatedContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Ambil dari "{" pertama. Hitung kurung kurawal secara manual (bukan
    // regex greedy) supaya kalau responsnya kepotong di tengah, kita tahu
    // persis itu masalah truncation, bukan format yang salah total.
    const start = cleaned.indexOf("{");
    if (start === -1) {
      throw new Error("AI tidak menghasilkan format JSON. Mohon coba kembali.");
    }

    let depth = 0;
    let end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) {
      // Kurung tidak pernah balance sampai akhir teks -> respons kepotong
      // (kemungkinan besar karena max_tokens kurang besar).
      throw new Error(
        "JSON: respons AI terpotong sebelum selesai (kemungkinan max_tokens terlalu kecil). Coba lagi atau naikkan GROQ_CONFIG.maxTokens.",
      );
    }

    const jsonStr = cleaned.slice(start, end + 1);

    try {
      const modulData = JSON.parse(jsonStr);

      if (!this.validateModulStructure(modulData)) {
        throw new Error("Struktur JSON tidak lengkap");
      }

      return modulData;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error(
        "AI menghasilkan format yang tidak valid. Coba ulangi atau periksa kembali isian Anda.",
      );
    }
  },

  /**
   * Validasi struktur modul yang dihasilkan
   * @param {Object} data - Modul data yang akan divalidasi
   * @returns {boolean} - True jika struktur valid
   */
  validateModulStructure(data) {
    const requiredFields = [
      "informasiUmum",
      "identifikasi",
      "desainPembelajaran",
      "pengalamanBelajar",
      "diferensiasi",
      "asesmen",
      "sumberBelajar",
    ];

    // Cek apakah semua field yang diperlukan ada
    for (const field of requiredFields) {
      if (!data || !data[field]) {
        console.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validasi nested structure sesuai 4 elemen resmi Pembelajaran Mendalam
    if (
      !data.informasiUmum.identitas ||
      !data.identifikasi.dimensiProfilLulusan ||
      !data.desainPembelajaran.capaianPembelajaran?.capaianUtama ||
      !data.desainPembelajaran.tujuanPembelajaran ||
      !data.desainPembelajaran.kerangkaPembelajaran ||
      !data.pengalamanBelajar.tahapanKognitif ||
      !data.pengalamanBelajar.kegiatanPembelajaran?.pendahuluan ||
      !data.pengalamanBelajar.kegiatanPembelajaran?.inti ||
      !data.pengalamanBelajar.kegiatanPembelajaran?.penutup ||
      !data.asesmen.asesmenFormatif?.soalFormatif ||
      data.asesmen.asesmenFormatif.soalFormatif.length < 10
    ) {
      console.warn("Incomplete nested structure");
      return false;
    }

    return true;
  },
};
