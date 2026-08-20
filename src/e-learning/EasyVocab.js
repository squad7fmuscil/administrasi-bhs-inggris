import React, { useState } from "react";
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Languages,
  List,
} from "lucide-react";

// Import data chapters
import chapter0Data from "./EasySoal/grade7/chapter0Data";
import chapter1Data from "./EasySoal/grade7/chapter1Data";
import chapter2Data from "./EasySoal/grade7/chapter2Data";
import chapter3Data from "./EasySoal/grade7/chapter3Data";
import chapter4Data from "./EasySoal/grade7/chapter4Data";
import chapter5Data from "./EasySoal/grade7/chapter5Data";

export default function EasyVocab({ setCurrentPage }) {
  const [formData, setFormData] = useState({
    chapter: "",
    vocabType: "word-list",
    jumlahKata: "20",
    format: "table",
    includePronunciation: true,
    includeExamples: true,
    includeImages: false,
    difficulty: "sedang",
    customRequest: "",
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

  const vocabTypes = [
    { id: "word-list", label: "Word List (Daftar Kata)", icon: "📝" },
    {
      id: "thematic",
      label: "Thematic Vocabulary (Berdasarkan Tema)",
      icon: "🎯",
    },
    { id: "flashcard", label: "Flashcard Format", icon: "🃏" },
    { id: "synonyms-antonyms", label: "Synonyms & Antonyms", icon: "🔄" },
    { id: "collocations", label: "Common Collocations", icon: "🔗" },
    { id: "idioms", label: "Idioms & Phrases", icon: "💬" },
  ];

  const formatOptions = [
    { id: "table", label: "Table Format (Tabel)", icon: "📊" },
    { id: "list", label: "Numbered List", icon: "🔢" },
    { id: "categorized", label: "Categorized by Topics", icon: "📁" },
    { id: "dialogue", label: "In Context (Dialog/Kalimat)", icon: "💬" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const generatePrompt = () => {
    const selectedChapter = chapters.find((c) => c.id === formData.chapter);

    if (!selectedChapter) return "";

    let vocabTypeInstruction = "";

    switch (formData.vocabType) {
      case "word-list":
        vocabTypeInstruction = `
📝 WORD LIST FORMAT:
Buatkan daftar vocabulary paling penting dan relevan dari chapter ini.
Fokus pada kata-kata yang HARUS dikuasai siswa untuk memahami materi.
`;
        break;
      case "thematic":
        vocabTypeInstruction = `
🎯 THEMATIC VOCABULARY:
Kelompokkan vocabulary berdasarkan tema/topik yang ada di chapter.
Setiap tema harus memiliki 5-10 kata yang saling berkaitan.
`;
        break;
      case "flashcard":
        vocabTypeInstruction = `
🃏 FLASHCARD FORMAT:
Buatkan dalam format yang cocok untuk flashcard (kartu belajar).
Front: English word | Back: Indonesian meaning + example sentence
Format simpel dan mudah dipotong untuk dijadikan kartu fisik.
`;
        break;
      case "synonyms-antonyms":
        vocabTypeInstruction = `
🔄 SYNONYMS & ANTONYMS:
Untuk setiap vocabulary, berikan:
- Synonym (persamaan kata)
- Antonym (lawan kata) jika ada
- Contoh penggunaan yang membedakan
`;
        break;
      case "collocations":
        vocabTypeInstruction = `
🔗 COMMON COLLOCATIONS:
Fokus pada kata-kata yang sering digunakan bersama (collocations).
Contoh: "make a mistake", "do homework", "have breakfast"
Berikan penjelasan mengapa kombinasi kata tersebut natural.
`;
        break;
      case "idioms":
        vocabTypeInstruction = `
💬 IDIOMS & PHRASES:
Kumpulkan idiom, phrase, dan ungkapan yang relevan dengan chapter.
Jelaskan arti literal vs arti sebenarnya.
Berikan konteks kapan digunakan.
`;
        break;
    }

    let formatInstruction = "";

    switch (formData.format) {
      case "table":
        formatInstruction = `
Format dalam bentuk TABEL dengan kolom:
| No | English | Indonesian | Part of Speech | Example Sentence${
          formData.includePronunciation ? " | Pronunciation" : ""
        } |
`;
        break;
      case "list":
        formatInstruction = `
Format dalam bentuk NUMBERED LIST:
1. Word (Part of Speech) - Indonesian
   Pronunciation: [if enabled]
   Example: [sentence]
`;
        break;
      case "categorized":
        formatInstruction = `
Format BERDASARKAN KATEGORI/TEMA:

📚 Category 1: [Nama Kategori]
1. word - meaning
2. word - meaning

📚 Category 2: [Nama Kategori]
1. word - meaning
`;
        break;
      case "dialogue":
        formatInstruction = `
Format DALAM KONTEKS (Dialog/Paragraph):

Buat mini dialog atau paragraph pendek yang menggunakan vocabulary tersebut.
Tandai vocabulary dengan **bold** atau KAPITALISASI.
Setelah dialog, berikan daftar vocabulary yang digunakan.
`;
        break;
    }

    return `
Kamu adalah seorang *Expert English Teacher* yang sangat berpengalaman dalam mengajarkan vocabulary untuk siswa SMP kelas 7.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 VOCABULARY GENERATION REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mata Pelajaran: Bahasa Inggris
Kelas: VII SMP/MTs
Buku Referensi: English for Nusantara (Kemendikbudristek)
Chapter: ${selectedChapter.label}
Type: ${vocabTypes.find((v) => v.id === formData.vocabType)?.label}
Jumlah Kata Target: ${formData.jumlahKata} kata
Tingkat Kesulitan: ${formData.difficulty.toUpperCase()}
${
  formData.customRequest ? `\n🎯 Request Khusus: ${formData.customRequest}` : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 MATERI CHAPTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Description:** ${selectedChapter.description || "N/A"}

**Topics:**
${
  selectedChapter.topics
    ? selectedChapter.topics.map((t) => `• ${t}`).join("\n")
    : "N/A"
}

**Existing Vocabulary (Reference):**
${
  selectedChapter.vocabulary
    ? selectedChapter.vocabulary
        .slice(0, 10)
        .map((v) => `• ${v}`)
        .join("\n")
    : "N/A"
}

**Grammar Points:**
${
  selectedChapter.grammar
    ? selectedChapter.grammar.map((g) => `• ${g}`).join("\n")
    : "N/A"
}

**Key Phrases:**
${
  selectedChapter.keyPhrases
    ? selectedChapter.keyPhrases
        .slice(0, 5)
        .map((k) => `• ${k}`)
        .join("\n")
    : "N/A"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${vocabTypeInstruction}

${formatInstruction}

🎯 KRITERIA VOCABULARY:
1. **Relevance**: Vocabulary HARUS sesuai dengan materi chapter
2. **Level-appropriate**: Sesuai kemampuan siswa kelas 7 SMP
3. **Practical**: Kata-kata yang benar-benar berguna dan sering digunakan
4. **Clear meaning**: Terjemahan bahasa Indonesia yang tepat dan mudah dipahami
5. **Context**: ${
      formData.includeExamples
        ? "Berikan contoh kalimat yang natural dan relevan"
        : "Tidak perlu contoh kalimat"
    }

${
  formData.includePronunciation
    ? `
🔊 PRONUNCIATION:
Berikan pronunciation dalam format IPA (International Phonetic Alphabet) atau simplified phonetic.
Contoh: beautiful /ˈbjuː.tɪ.fəl/ atau /byoo-ti-fuhl/
`
    : ""
}

${
  formData.includeImages
    ? `
🖼️ IMAGE SUGGESTIONS:
Untuk kata-kata yang cocok divisualisasikan, berikan saran gambar/ilustrasi yang bisa digunakan guru.
Format: 💡 Image suggestion: [deskripsi gambar]
`
    : ""
}

📊 DIFFICULTY LEVEL: ${formData.difficulty.toUpperCase()}
${
  formData.difficulty === "mudah"
    ? `
• Pilih kata-kata dasar dan umum
• Fokus pada kata benda (nouns) dan kata kerja (verbs) sederhana
• Hindari vocabulary yang terlalu advanced
`
    : ""
}
${
  formData.difficulty === "sedang"
    ? `
• Mix antara vocabulary basic dan intermediate
• Include beberapa kata sifat (adjectives) dan kata keterangan (adverbs)
• Vocabulary yang challenging tapi masih achievable
`
    : ""
}
${
  formData.difficulty === "sulit"
    ? `
• Include vocabulary yang lebih advanced
• Tambahkan phrasal verbs, idioms (jika relevan)
• Vocabulary yang menantang tapi tetap sesuai kurikulum
`
    : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# VOCABULARY LIST
## ${selectedChapter.label}

**Kelas:** VII SMP/MTs  
**Total Words:** ${formData.jumlahKata}  
**Type:** ${vocabTypes.find((v) => v.id === formData.vocabType)?.label}  
**Difficulty:** ${formData.difficulty.toUpperCase()}

---

[GENERATE THE VOCABULARY HERE FOLLOWING ALL INSTRUCTIONS ABOVE]

---

## 📚 LEARNING TIPS

[Berikan 3-5 tips praktis untuk guru/siswa dalam mempelajari vocabulary ini]

1. [Tip 1]
2. [Tip 2]
3. [Tip 3]

---

## 🎯 SUGGESTED ACTIVITIES

[Berikan 2-3 ide aktivitas kelas yang bisa menggunakan vocabulary ini]

**Activity 1:** [Nama & deskripsi singkat]
**Activity 2:** [Nama & deskripsi singkat]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT REMINDERS:
• Pastikan SEMUA vocabulary relevan dengan chapter yang dipilih
• Gunakan bahasa Indonesia yang natural dan mudah dipahami siswa
• Contoh kalimat harus SIMPLE dan sesuai level kelas 7
• Jangan gunakan vocabulary yang terlalu advanced atau jarang digunakan
• Format output harus rapi dan siap pakai untuk teaching materials

Buatlah vocabulary list yang LENGKAP, BERKUALITAS, dan SIAP PAKAI untuk mengajar! 🎓
`;
  };

  const generateVocab = async () => {
    if (!formData.chapter) {
      setError("Pilih chapter terlebih dahulu!");
      return;
    }

    const jumlah = parseInt(formData.jumlahKata);
    if (jumlah < 5 || jumlah > 100) {
      setError("Jumlah kata harus antara 5-100!");
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
                  "You are an expert English teacher specializing in vocabulary instruction for Indonesian junior high school students (Grade 7). You create clear, practical, and engaging vocabulary lists that align with the English for Nusantara curriculum.",
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
      const vocabContent = data.choices[0].message.content;

      setResult(vocabContent);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Gagal generate vocabulary. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateVocab();
  };

  const exportToText = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const chapterLabel = chapters
      .find((c) => c.id === formData.chapter)
      ?.label.replace(/[^a-z0-9]/gi, "_");
    const fileName = `Vocabulary_${chapterLabel}_${new Date().getTime()}.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert("✅ Vocabulary list berhasil dicopy ke clipboard!");
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
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Languages className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Easy Vocab</h1>
              <p className="text-gray-600">
                Generate vocabulary lists dengan AI
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Chapter Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Pilih Chapter
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chapter *
                </label>
                <select
                  name="chapter"
                  value={formData.chapter}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  required>
                  <option value="">Pilih Chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.label}
                    </option>
                  ))}
                </select>

                {formData.chapter && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-sm font-semibold text-purple-800 mb-2">
                      📚 Topik Chapter:
                    </p>
                    <ul className="text-sm text-purple-700 space-y-1">
                      {chapters
                        .find((c) => c.id === formData.chapter)
                        ?.topics.map((topic, idx) => (
                          <li key={idx}>• {topic}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Vocabulary Type */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-purple-600" />
                Tipe Vocabulary
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {vocabTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                      formData.vocabType === type.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}>
                    <input
                      type="radio"
                      name="vocabType"
                      value={type.id}
                      checked={formData.vocabType === type.id}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <span className="text-sm font-semibold">
                        {type.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Konfigurasi
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jumlah Kata
                  </label>
                  <input
                    type="number"
                    name="jumlahKata"
                    value={formData.jumlahKata}
                    onChange={handleInputChange}
                    min="5"
                    max="100"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Min: 5, Max: 100</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tingkat Kesulitan
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none">
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Format Output
                  </label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none">
                    {formatOptions.map((fmt) => (
                      <option key={fmt.id} value={fmt.id}>
                        {fmt.icon} {fmt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includePronunciation"
                      checked={formData.includePronunciation}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Include Pronunciation
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeExamples"
                      checked={formData.includeExamples}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Include Example Sentences
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeImages"
                      checked={formData.includeImages}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Suggest Images/Illustrations
                    </span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Request (Opsional)
                  </label>
                  <textarea
                    name="customRequest"
                    value={formData.customRequest}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="Contoh: Fokus pada vocabulary tentang feelings and emotions, include phrasal verbs"
                  />
                </div>
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
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Generating Vocabulary... (20-40 detik)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate Vocabulary dengan AI</span>
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
                <Languages className="w-6 h-6 text-purple-600" />✅ Vocabulary
                List Berhasil Dibuat!
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm font-semibold shadow-md">
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
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                {result}
              </pre>
            </div>

            {/* Tips */}
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>💡 Tips:</strong> Vocabulary list sudah siap pakai! Anda
                bisa copy ke Word/Google Docs, print untuk flashcards, atau
                gunakan langsung untuk teaching materials.
              </p>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Languages className="w-5 h-5 text-purple-600" />
            📚 Tentang Easy Vocab
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            AI-powered vocabulary generator untuk English for Nusantara Kelas
            VII. Generate vocabulary lists yang sesuai dengan materi dan mudah
            dipahami siswa.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-purple-500 text-lg">✓</span>
              <span className="text-gray-700">Vocabulary sesuai chapter</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 text-lg">✓</span>
              <span className="text-gray-700">
                Include pronunciation & examples
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 text-lg">✓</span>
              <span className="text-gray-700">Multiple format options</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 text-lg">✓</span>
              <span className="text-gray-700">Thematic grouping</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 text-lg">✓</span>
              <span className="text-gray-700">Flashcard-ready format</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 text-lg">✓</span>
              <span className="text-gray-700">
                Teaching activity suggestions
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700">
              <strong>💡 Pro Tip:</strong> Gunakan format "Flashcard" untuk
              membuat kartu belajar fisik, atau format "Table" untuk worksheet
              yang bisa dicetak. Combine dengan "Include Examples" untuk hasil
              yang lebih praktis!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
