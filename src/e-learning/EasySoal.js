import React, { useState } from "react";
import {
  ClipboardList,
  ArrowLeft,
  Sparkles,
  Loader2,
  Download,
  Copy,
  BookOpen,
  FileQuestion,
} from "lucide-react";

// Import data chapters
import chapter0Data from "./EasySoal/grade7/chapter0Data";
import chapter1Data from "./EasySoal/grade7/chapter1Data";
import chapter2Data from "./EasySoal/grade7/chapter2Data";
import chapter3Data from "./EasySoal/grade7/chapter3Data";
import chapter4Data from "./EasySoal/grade7/chapter4Data";
import chapter5Data from "./EasySoal/grade7/chapter5Data";

export default function EasySoal({ setCurrentPage }) {
  const [formData, setFormData] = useState({
    mode: "chapter",
    chapters: [],
    singleChapter: "",
    jenisSoal: {
      pg: "10",
      tf: "5",
      matching: "5",
      essay: "0",
    },
    tingkatKesulitan: "sedang",
    fokusMateri: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // Array chapters
  const chapters = [
    chapter0Data,
    chapter1Data,
    chapter2Data,
    chapter3Data,
    chapter4Data,
    chapter5Data,
  ];

  // Preset untuk ujian semester
  const ujianPresets = [
    {
      id: "semester-1",
      label: "Ujian Semester 1 (Chapter 0-3)",
      chapters: ["chapter-0", "chapter-1", "chapter-2", "chapter-3"],
      jenisSoal: { pg: "20", tf: "10", matching: "10", essay: "5" },
    },
    {
      id: "semester-2",
      label: "Ujian Semester 2 (Chapter 4-5)",
      chapters: ["chapter-4", "chapter-5"],
      jenisSoal: { pg: "20", tf: "10", matching: "10", essay: "5" },
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJenisSoalChange = (jenis, value) => {
    setFormData((prev) => ({
      ...prev,
      jenisSoal: { ...prev.jenisSoal, [jenis]: value },
    }));
  };

  const handleModeChange = (mode) => {
    setFormData((prev) => ({
      ...prev,
      mode,
      jenisSoal:
        mode === "ujian"
          ? { pg: "20", tf: "10", matching: "10", essay: "5" }
          : { pg: "10", tf: "5", matching: "5", essay: "0" },
    }));
  };

  const handleUjianPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      chapters: preset.chapters,
      jenisSoal: preset.jenisSoal,
    }));
  };

  const handleChapterToggle = (chapterId) => {
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.includes(chapterId)
        ? prev.chapters.filter((id) => id !== chapterId)
        : [...prev.chapters, chapterId],
    }));
  };

  const generatePrompt = () => {
    const selectedChapters =
      formData.mode === "chapter"
        ? [chapters.find((c) => c.id === formData.singleChapter)]
        : formData.chapters
            .map((id) => chapters.find((c) => c.id === id))
            .filter(Boolean);

    const totalSoal =
      parseInt(formData.jenisSoal.pg) +
      parseInt(formData.jenisSoal.tf) +
      parseInt(formData.jenisSoal.matching) +
      parseInt(formData.jenisSoal.essay);

    let materiDetail = "";
    selectedChapters.forEach((chapter) => {
      if (chapter) {
        materiDetail += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        materiDetail += `${chapter.label.toUpperCase()}\n`;
        materiDetail += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        if (chapter.description) {
          materiDetail += `Description: ${chapter.description}\n\n`;
        }

        if (chapter.topics) {
          materiDetail += `📚 TOPICS:\n${chapter.topics
            .map((t) => `  • ${t}`)
            .join("\n")}\n\n`;
        }

        if (chapter.vocabulary) {
          materiDetail += `📖 VOCABULARY:\n${chapter.vocabulary
            .map((v) => `  • ${v}`)
            .join("\n")}\n\n`;
        }

        if (chapter.grammar) {
          materiDetail += `📝 GRAMMAR POINTS:\n${chapter.grammar
            .map((g) => `  • ${g}`)
            .join("\n")}\n\n`;
        }

        if (chapter.keyPhrases) {
          materiDetail += `💬 KEY PHRASES:\n${chapter.keyPhrases
            .map((k) => `  • ${k}`)
            .join("\n")}\n\n`;
        }

        if (chapter.sampleSentences) {
          materiDetail += `📋 SAMPLE SENTENCES:\n${chapter.sampleSentences
            .map((s) => `  • ${s}`)
            .join("\n")}\n\n`;
        }
      }
    });

    return `
Kamu adalah seorang *Expert Guru Bahasa Inggris SMP* yang sangat berpengalaman dan professional dalam menyusun soal-soal berkualitas tinggi.
Fokus utamamu adalah membuat soal sesuai *Kurikulum Merdeka* dan buku *"English for Nusantara Kelas VII"* terbitan Kemendikdasmen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMASI SOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mata Pelajaran: Bahasa Inggris
Kelas: VII SMP/MTs
Buku Referensi: English for Nusantara (Kemendikbudristek)
Mode: ${formData.mode === "chapter" ? "Latihan Per Chapter" : "Ujian Semester"}
Materi: ${selectedChapters.map((c) => c?.label).join(", ")}
Total Soal: ${totalSoal}
Tingkat Kesulitan: ${formData.tingkatKesulitan.toUpperCase()}
${formData.fokusMateri ? `\n🎯 Fokus Khusus: ${formData.fokusMateri}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 MATERI YANG HARUS DICAKUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${materiDetail}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 KOMPOSISI SOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  parseInt(formData.jenisSoal.pg) > 0
    ? `✓ ${formData.jenisSoal.pg} Soal Pilihan Ganda (Multiple Choice)`
    : ""
}
${
  parseInt(formData.jenisSoal.tf) > 0
    ? `✓ ${formData.jenisSoal.tf} Soal True/False (Benar/Salah)`
    : ""
}
${
  parseInt(formData.jenisSoal.matching) > 0
    ? `✓ ${formData.jenisSoal.matching} Soal Matching (Menjodohkan)`
    : ""
}
${
  parseInt(formData.jenisSoal.essay) > 0
    ? `✓ ${formData.jenisSoal.essay} Soal Essay (Uraian)`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ INSTRUKSI PEMBUATAN SOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PRINSIP UTAMA:
1. SEMUA soal HARUS berdasarkan materi di atas
2. Gunakan HANYA vocabulary dan grammar yang sudah diajarkan
3. Konteks soal relevan dengan kehidupan siswa SMP
4. Soal harus jelas, tidak ambigu, dan tidak trick question
5. Kunci jawaban harus 100% benar dan bisa dipertanggungjawabkan

📊 TINGKAT KESULITAN: ${formData.tingkatKesulitan.toUpperCase()}

${
  formData.tingkatKesulitan === "mudah"
    ? `
🎯 Focus:
• Vocabulary recognition & basic comprehension
🧩 Karakteristik:
• Soal bersifat langsung (straightforward)
• Pilihan jawaban jelas berbeda satu sama lain
• Tidak ada jebakan (no tricky options)
• Dapat dijawab dengan recall sederhana
`
    : ""
}

${
  formData.tingkatKesulitan === "sedang"
    ? `
🎯 Focus:
• Mix of vocabulary, grammar, and simple application
🧩 Karakteristik:
• Membutuhkan pemahaman konteks (context-based)
• Terdapat 1–2 distractor yang masuk akal (reasonable)
• Siswa perlu analisis ringan untuk menemukan jawaban
• Beberapa soal berbentuk dialog atau teks pendek
`
    : ""
}

${
  formData.tingkatKesulitan === "sulit"
    ? `
🎯 Focus:
• Critical thinking & deeper understanding (HOTS)
🧩 Karakteristik:
• Soal menuntut penerapan (application) dan inferensi
• Distraktor tricky namun tetap fair
• Melibatkan implied meaning, reasoning, atau analisis teks
• Siswa harus menggunakan bahasa secara kontekstual
`
    : ""
}

📝 FORMAT SOAL:

1️⃣ PILIHAN GANDA:
   • Gunakan konteks nyata (text, dialog, situasi, gambar deskripsi)
   • 4 pilihan jawaban (A, B, C, D)
   • Semua pilihan harus gramatikal correct dan logis
   • Hanya 1 jawaban yang paling tepat
   • Hindari pilihan "semua benar" atau "tidak ada yang benar"

2️⃣ TRUE/FALSE:
   • Statement jelas dan tidak ambigu
   • Bisa tentang fakta, grammar usage, atau comprehension
   • Mix antara true dan false statements (jangan semua true/false)
   • Gunakan materi yang varied (vocabulary, grammar, facts)

3️⃣ MATCHING:
   • Column A: ${formData.jenisSoal.matching} items
   • Column B: ${
     parseInt(formData.jenisSoal.matching) + 2
   } items (include distractors)
   • Bisa: vocabulary-meaning, question-answer, English-Indonesian, etc
   • Distractors harus logis tapi tidak match dengan apapun di Column A
   • Clear instructions tentang cara menjodohkan

4️⃣ ESSAY (jika ada):
   • Open-ended question yang memicu siswa menulis
   • Berikan panduan jumlah kalimat minimum
   • Bisa: introduce yourself, describe something, write about experience
   • Include simple scoring rubric atau expected answer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 FORMAT OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ${
      formData.mode === "ujian" ? "UJIAN SEMESTER" : "LATIHAN"
    } - BAHASA INGGRIS KELAS VII
## ${selectedChapters.map((c) => c?.label).join(" + ")}

**Nama:** ___________________________  
**Kelas:** ___________________________  
**Tanggal:** ___________________________

**Jumlah Soal:** ${totalSoal}  
**Alokasi Waktu:** ${Math.ceil(totalSoal * 1.5)} menit

---

${
  parseInt(formData.jenisSoal.pg) > 0
    ? `
## PART A: MULTIPLE CHOICE

**Instructions:** Choose the correct answer by crossing (X) A, B, C, or D!

[Buat ${formData.jenisSoal.pg} soal pilihan ganda berkualitas]
[Variasikan jenis soal: Vocabulary, Grammar, Comprehension, Application]
[Setiap soal STANDALONE - dapat dipahami tanpa soal lain]
[Gunakan HANYA materi dari chapter yang dipilih]
`
    : ""
}

${
  parseInt(formData.jenisSoal.tf) > 0
    ? `
## PART B: TRUE OR FALSE

**Instructions:** Write **T** if the statement is True and **F** if it is False!

[Buat ${formData.jenisSoal.tf} soal True/False]
[Mix antara vocabulary facts, grammar correctness, dan comprehension]
[Variasikan antara T dan F]
`
    : ""
}

${
  parseInt(formData.jenisSoal.matching) > 0
    ? `
## PART C: MATCHING

**Instructions:** Match the items in Column A with the correct answer in Column B! Write the letter of your answer.

**Column A**
[Buat ${formData.jenisSoal.matching} items numbered 1-${
        formData.jenisSoal.matching
      }]

**Column B**
[Buat ${
        parseInt(formData.jenisSoal.matching) + 2
      } items lettered a-${String.fromCharCode(
        96 + parseInt(formData.jenisSoal.matching) + 2,
      )}]
[Include 2 distractors yang tidak match]
`
    : ""
}

${
  parseInt(formData.jenisSoal.essay) > 0
    ? `
## PART D: ESSAY

**Instructions:** Answer the following questions in complete sentences!

[Buat ${formData.jenisSoal.essay} soal essay]
[Questions harus open-ended dan memicu creative writing]
[Berikan guidance yang jelas]
`
    : ""
}

---

## 🔑 ANSWER KEY

### Part A - Multiple Choice
[Tulis jawaban yang benar untuk SEMUA soal]

### Part B - True/False
[Tulis T atau F untuk SEMUA soal]

### Part C - Matching
[Tulis matching yang benar untuk SEMUA items]

${
  parseInt(formData.jenisSoal.essay) > 0
    ? `
### Part D - Essay
**Scoring Rubric:**
• Content (3 points): Information is complete and accurate
• Grammar (2 points): Correct use of simple present tense
• Vocabulary (2 points): Appropriate word choice
• Mechanics (1 point): Correct spelling and punctuation

**Sample Answer:**
[Berikan contoh jawaban lengkap]
`
    : ""
}

---

⚠️ CRITICAL REMINDERS:
• Gunakan HANYA vocabulary dan grammar dari materi yang disebutkan
• Semua soal harus standalone - tidak bergantung satu sama lain
• Variasikan topic soal - jangan semua tentang hal yang sama
• Pastikan kunci jawaban 100% correct
• Soal harus sesuai level kognitif siswa kelas 7
• Gunakan konteks yang familiar untuk siswa Indonesia

Buatlah dengan SANGAT DETAIL, LENGKAP, dan SIAP PAKAI!`;
  };

  const generateSoal = async () => {
    if (formData.mode === "chapter" && !formData.singleChapter) {
      setError("Pilih chapter terlebih dahulu!");
      return;
    }
    if (formData.mode === "ujian" && formData.chapters.length === 0) {
      setError("Pilih minimal 1 chapter untuk ujian!");
      return;
    }

    const totalSoal =
      parseInt(formData.jenisSoal.pg) +
      parseInt(formData.jenisSoal.tf) +
      parseInt(formData.jenisSoal.matching) +
      parseInt(formData.jenisSoal.essay);

    if (totalSoal === 0) {
      setError("Minimal harus ada 1 soal!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const prompt = generatePrompt();

      // Panggil lewat Supabase Edge Function (modul-proxy), BUKAN Groq
      // langsung. API key Groq disimpen aman di server, gak pernah nempel
      // di kode/bundle frontend.
      const APP_SECRET = import.meta.env.VITE_APP_SECRET;

      if (!APP_SECRET) {
        throw new Error(
          "APP_SECRET tidak ditemukan! Pastikan VITE_APP_SECRET sudah diset di file .env",
        );
      }

      const response = await fetch(
        "https://dgrncsnsgtrsotnynsrl.supabase.co/functions/v1/modul-proxy",
        {
          method: "POST",
          headers: {
            "x-app-secret": APP_SECRET,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content:
                  "Kamu adalah expert guru Bahasa Inggris SMP yang sangat berpengalaman dan professional dalam membuat soal berkualitas tinggi sesuai kurikulum merdeka dan buku English for Nusantara. Kamu sangat detail, teliti, dan selalu membuat soal yang akurat sesuai materi.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
            top_p: 0.9,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
            `API Error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const soalContent = data.choices[0].message.content;

      setResult(soalContent);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Gagal generate soal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateSoal();
  };

  const exportToText = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const chapterLabel =
      formData.mode === "chapter"
        ? chapters
            .find((c) => c.id === formData.singleChapter)
            ?.label.replace(/[^a-z0-9]/gi, "_")
        : "Ujian_Semester";
    const fileName = `Soal_${chapterLabel}_${new Date().getTime()}.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert("✅ Soal berhasil dicopy ke clipboard!");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali ke Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Easy Soal</h1>
              <p className="text-gray-600">
                Generate soal Bahasa Inggris dengan AI
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Mode Soal
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleModeChange("chapter")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.mode === "chapter"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-semibold text-sm">Per Chapter</div>
                  <div className="text-xs text-gray-500 mt-1">
                    10 PG, 5 T/F, 5 Matching
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("ujian")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.mode === "ujian"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-semibold text-sm">Ujian Semester</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Multi-chapter exam
                  </div>
                </button>
              </div>
            </div>

            {/* Chapter Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Pilih Materi
              </h2>

              {formData.mode === "chapter" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chapter *
                  </label>
                  <select
                    name="singleChapter"
                    value={formData.singleChapter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required>
                    <option value="">Pilih Chapter</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.label}
                      </option>
                    ))}
                  </select>

                  {formData.singleChapter && (
                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-sm font-semibold text-green-800 mb-2">
                        📚 Topik yang akan dicakup:
                      </p>
                      <ul className="text-sm text-green-700 space-y-1">
                        {chapters
                          .find((c) => c.id === formData.singleChapter)
                          ?.topics.map((topic, idx) => (
                            <li key={idx}>• {topic}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Preset Ujian Semester (Opsional)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ujianPresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleUjianPreset(preset)}
                          className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition text-left">
                          <p className="font-semibold text-gray-800">
                            {preset.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {preset.jenisSoal.pg} PG • {preset.jenisSoal.tf} T/F
                            • {preset.jenisSoal.matching} Matching •{" "}
                            {preset.jenisSoal.essay} Essay
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Atau Pilih Chapter Manual *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {chapters.map((chapter) => (
                      <label
                        key={chapter.id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                          formData.chapters.includes(chapter.id)
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}>
                        <input
                          type="checkbox"
                          checked={formData.chapters.includes(chapter.id)}
                          onChange={() => handleChapterToggle(chapter.id)}
                          className="mr-3"
                        />
                        <span className="font-semibold">{chapter.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Soal Configuration */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Konfigurasi Soal
              </h2>

              {/* Jenis Soal - Grid 4 kolom sejajar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pilihan Ganda
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.jenisSoal.pg}
                    onChange={(e) =>
                      handleJenisSoalChange("pg", e.target.value)
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-center font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    True/False
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.jenisSoal.tf}
                    onChange={(e) =>
                      handleJenisSoalChange("tf", e.target.value)
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-center font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Matching
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.jenisSoal.matching}
                    onChange={(e) =>
                      handleJenisSoalChange("matching", e.target.value)
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-center font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Essay
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.jenisSoal.essay}
                    onChange={(e) =>
                      handleJenisSoalChange("essay", e.target.value)
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-center font-semibold"
                  />
                </div>
              </div>

              {/* Tingkat Kesulitan - Single row */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tingkat Kesulitan
                </label>
                <select
                  name="tingkatKesulitan"
                  value={formData.tingkatKesulitan}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none">
                  <option value="mudah">Mudah</option>
                  <option value="sedang">Sedang</option>
                  <option value="sulit">Sulit</option>
                </select>
              </div>

              {/* Fokus Materi */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Fokus Materi Khusus (Opsional)
                </label>
                <textarea
                  name="fokusMateri"
                  value={formData.fokusMateri}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                  placeholder="Contoh: Fokus pada vocabulary tentang family members dan telling the time"
                />
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="font-semibold text-green-800 mb-2">
                  📊 Total Soal:
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {parseInt(formData.jenisSoal.pg) +
                    parseInt(formData.jenisSoal.tf) +
                    parseInt(formData.jenisSoal.matching) +
                    parseInt(formData.jenisSoal.essay)}{" "}
                  Soal
                </p>
                <p className="text-sm text-green-700 mt-2">
                  ⏱️ Estimasi waktu:{" "}
                  {Math.ceil(
                    (parseInt(formData.jenisSoal.pg) +
                      parseInt(formData.jenisSoal.tf) +
                      parseInt(formData.jenisSoal.matching) +
                      parseInt(formData.jenisSoal.essay)) *
                      1.5,
                  )}{" "}
                  menit
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-700 font-semibold">❌ {error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Generating Soal... (30-60 detik)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate Soal dengan AI</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                ⚡ Powered by Groq API • Model: Llama 3.3 70B
              </p>
            </div>
          </form>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-green-600" />✅ Soal
                Berhasil Dibuat!
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-semibold shadow-md">
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={exportToText}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-semibold shadow-md">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    setResult("");
                    setError("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm font-semibold">
                  Generate Baru
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="bg-gray-50 rounded-xl p-6 max-h-[600px] overflow-y-auto border-2 border-gray-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {result}
              </pre>
            </div>

            {/* Tips */}
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>💡 Tips:</strong> Soal sudah siap pakai! Anda bisa copy
                ke Word/Google Docs atau download untuk diedit lebih lanjut
                sesuai kebutuhan.
              </p>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            📚 Tentang English for Nusantara
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Buku teks resmi Bahasa Inggris untuk SMP/MTs Kelas VII sesuai
            Kurikulum Merdeka dari Kemendikbudristek.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-gray-700">Soal sesuai materi buku</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-gray-700">Vocabulary & grammar akurat</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-gray-700">Format standar ujian</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-gray-700">
                Lengkap dengan kunci jawaban
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-gray-700">
                5 jenis soal: PG, T/F, Matching, Essay, HOTS
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-gray-700">Pembahasan untuk soal sulit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
