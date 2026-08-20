import React, { useState } from "react";
import {
  FileText,
  ArrowLeft,
  Sparkles,
  Loader2,
  Download,
  Copy,
  BookOpen,
  Type,
} from "lucide-react";

// Import data chapters
import chapter0Data from "./EasySoal/grade7/chapter0Data";
import chapter1Data from "./EasySoal/grade7/chapter1Data";
import chapter2Data from "./EasySoal/grade7/chapter2Data";
import chapter3Data from "./EasySoal/grade7/chapter3Data";
import chapter4Data from "./EasySoal/grade7/chapter4Data";
import chapter5Data from "./EasySoal/grade7/chapter5Data";

export default function EasyText({ setCurrentPage }) {
  const [formData, setFormData] = useState({
    chapter: "",
    textType: "procedure",
    topic: "",
    length: "sedang",
    difficulty: "sedang",
    includeAnalysis: true,
    includeQuestions: true,
    includeVocabulary: true,
    numberOfTexts: "1",
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

  const textTypes = [
    {
      id: "procedure",
      label: "Procedure Text",
      icon: "📋",
      description: "How to make/do something (resep, tutorial, instruksi)",
      examples: "Cara membuat nasi goreng, How to wash hands",
    },
    {
      id: "narrative",
      label: "Narrative Text",
      icon: "📖",
      description:
        "Cerita fiksi dengan moral value (fable, legend, fairy tale)",
      examples: "The Ant and the Grasshopper, Malin Kundang",
    },
    {
      id: "recount",
      label: "Recount Text",
      icon: "📝",
      description: "Menceritakan pengalaman/kejadian masa lalu",
      examples: "My Holiday, School Trip, Last Weekend",
    },
    {
      id: "descriptive",
      label: "Descriptive Text",
      icon: "🖼️",
      description: "Mendeskripsikan orang, tempat, atau benda",
      examples: "My Pet, My School, My Best Friend",
    },
    {
      id: "report",
      label: "Report Text",
      icon: "📊",
      description: "Informasi faktual tentang sesuatu secara umum",
      examples: "Cats, Borobudur Temple, Smartphones",
    },
  ];

  const lengthOptions = [
    { id: "pendek", label: "Pendek (100-150 kata)", words: "100-150" },
    { id: "sedang", label: "Sedang (150-250 kata)", words: "150-250" },
    { id: "panjang", label: "Panjang (250-400 kata)", words: "250-400" },
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
    const selectedTextType = textTypes.find((t) => t.id === formData.textType);
    const selectedLength = lengthOptions.find((l) => l.id === formData.length);

    if (!selectedChapter || !selectedTextType) return "";

    let textTypeInstruction = "";
    let structureGuide = "";

    switch (formData.textType) {
      case "procedure":
        textTypeInstruction = `
📋 PROCEDURE TEXT - How to Make/Do Something

🎯 PURPOSE:
Memberikan instruksi/petunjuk langkah demi langkah untuk membuat atau melakukan sesuatu.

📝 GENERIC STRUCTURE:
1. **Goal/Aim**: Judul yang menunjukkan tujuan (How to..., The Way to...)
2. **Materials/Ingredients**: Bahan dan alat yang dibutuhkan
3. **Steps/Methods**: Langkah-langkah (gunakan sequence words: First, Then, Next, After that, Finally)

🔤 LANGUAGE FEATURES:
- Imperative sentences (command): Mix, Add, Pour, Cut, etc.
- Action verbs: stir, boil, peel, slice
- Sequence connectors: First, Second, Then, Next, After that, Finally
- Simple Present Tense
- Time conjunctions: when, while, after, before

💡 TIPS:
- Langkah-langkah harus clear, simple, dan easy to follow
- Gunakan HANYA vocabulary yang sudah diajarkan di chapter
- Instruksi harus logis dan berurutan
- Cocok untuk: resep makanan, tutorial sederhana, cara membuat kerajinan
`;
        structureGuide = `
CONTOH STRUKTUR:

**How to Make Fried Rice** (Goal)

**Ingredients:** (Materials)
- 2 plates of cooked rice
- 2 eggs
- 3 cloves of garlic
- Salt and pepper
- Cooking oil

**Steps:** (Methods)
1. First, heat the oil in a pan.
2. Then, fry the garlic until it smells good.
3. Next, add the eggs and scramble them.
4. After that, add the rice and mix well.
5. Finally, add salt and pepper. Serve hot.
`;
        break;

      case "narrative":
        textTypeInstruction = `
📖 NARRATIVE TEXT - Story with Moral Value

🎯 PURPOSE:
Menghibur pembaca dan memberikan moral value/pelajaran hidup.

📝 GENERIC STRUCTURE:
1. **Orientation**: Pengenalan tokoh, tempat, waktu (Who, When, Where)
2. **Complication**: Masalah/konflik yang dihadapi tokoh
3. **Resolution**: Penyelesaian masalah
4. **Re-orientation (Optional)**: Kesimpulan/moral value

🔤 LANGUAGE FEATURES:
- Past Tense (was, were, went, said, etc.)
- Action verbs: walked, jumped, cried, ran
- Time conjunctions: once upon a time, one day, long time ago
- Direct/Indirect speech: He said, "...", He told her that...
- Adjectives untuk menggambarkan karakter: brave, kind, wise, greedy

💡 TIPS:
- Buat karakter yang relatable untuk siswa SMP
- Konflik harus clear dan solutionnya logical
- Moral value harus meaningful dan relevan
- Gunakan dialog untuk membuat cerita lebih hidup
- Cocok untuk: fable, legend, fairy tale, short story
`;
        structureGuide = `
CONTOH STRUKTUR:

**The Honest Woodcutter** (Title)

**Orientation:**
Once upon a time, there was a poor woodcutter who lived near a river. He was very honest and hardworking.

**Complication:**
One day, while cutting wood, his axe fell into the deep river. He was very sad because it was his only tool to work.

**Resolution:**
A water spirit appeared and helped him. The spirit showed him three axes: gold, silver, and iron. The honest woodcutter chose only his iron axe. The spirit was happy with his honesty and gave him all three axes.

**Re-orientation:**
The woodcutter became rich. He learned that honesty is always rewarded.

**Moral Value:** Always be honest in every situation.
`;
        break;

      case "recount":
        textTypeInstruction = `
📝 RECOUNT TEXT - Retelling Past Events/Experiences

🎯 PURPOSE:
Menceritakan kembali pengalaman atau kejadian yang sudah terjadi di masa lalu.

📝 GENERIC STRUCTURE:
1. **Orientation**: Pengenalan (Who, When, Where)
2. **Events**: Urutan kejadian (event 1, event 2, event 3...)
3. **Re-orientation**: Penutup (perasaan/kesimpulan)

🔤 LANGUAGE FEATURES:
- Past Tense (went, visited, saw, enjoyed, etc.)
- Time connectors: first, then, after that, finally, at last
- Personal pronouns: I, we, my, our
- Time markers: yesterday, last week, last holiday, two days ago
- Action verbs: went, visited, played, ate, saw

💡 TIPS:
- Ceritakan secara kronologis (urut waktu)
- Gunakan detail yang menarik (apa yang dilihat, dirasakan)
- Akhiri dengan kesan/perasaan
- Cocok untuk: holiday experience, school trip, weekend activities, personal experience
`;
        structureGuide = `
CONTOH STRUKTUR:

**My Unforgettable Holiday** (Title)

**Orientation:**
Last month, my family and I went to Bali for a holiday. We stayed there for five days.

**Events:**
On the first day, we visited Tanah Lot Temple. The sunset was beautiful. We took many photos there.

On the second day, we went to Kuta Beach. The water was clear and the sand was soft. We played volleyball and swam in the sea.

On the third day, we tried Balinese food at a local restaurant. The food was delicious.

**Re-orientation:**
I had a wonderful time in Bali. It was my best holiday ever. I hope I can go there again someday.
`;
        break;

      case "descriptive":
        textTypeInstruction = `
🖼️ DESCRIPTIVE TEXT - Describing People/Places/Things

🎯 PURPOSE:
Menggambarkan ciri-ciri khusus dari seseorang, tempat, atau benda secara detail.

📝 GENERIC STRUCTURE:
1. **Identification**: Perkenalan umum (what/who is being described)
2. **Description**: Deskripsi detail (parts, qualities, characteristics)

🔤 LANGUAGE FEATURES:
- Simple Present Tense (is, are, has, have)
- Adjectives: beautiful, big, small, kind, tall, short, colorful
- Linking verbs: is, are, looks, seems, appears
- Attributive verbs: has, have, belongs to
- Prepositional phrases: in front of, next to, on the right

💡 TIPS:
- Gunakan banyak adjectives yang tepat dan varied
- Deskripsikan dari general ke specific
- Gunakan five senses (sight, smell, sound, touch, taste) jika relevan
- Be specific, not just "nice" or "good"
- Cocok untuk: describing people (physical & personality), places, animals, things
`;
        structureGuide = `
CONTOH STRUKTUR:

**My Lovely Cat** (Title)

**Identification:**
I have a pet cat named Milo. He is a Persian cat and I love him very much.

**Description:**
Milo has soft white fur and big round eyes. His eyes are blue like the ocean. He has a small pink nose and long whiskers.

Milo is very playful and friendly. He likes to play with a ball of yarn. He is also very smart. When I call his name, he comes to me immediately.

Every morning, Milo sleeps on my bed. He purrs softly when I pet him. He eats fish and cat food. His favorite food is tuna.

Milo is not just a pet. He is my best friend at home.
`;
        break;

      case "report":
        textTypeInstruction = `
📊 REPORT TEXT - Factual Information about General Things

🎯 PURPOSE:
Memberikan informasi faktual tentang sesuatu secara umum (bukan spesifik).

📝 GENERIC STRUCTURE:
1. **General Classification**: Klasifikasi umum (what is being reported)
2. **Description**: Deskripsi fakta (parts, qualities, habits, behaviors)

🔤 LANGUAGE FEATURES:
- Simple Present Tense (Cats are..., Smartphones have...)
- General nouns: cats (not my cat), schools (not my school)
- Technical/scientific vocabulary
- Factual language (no opinions)
- Linking verbs: is, are, has, have
- Passive voice (optional): is found, is made

💡 TIPS:
- Berdasarkan fakta, bukan opini pribadi
- Gunakan general subjects (bukan specific)
- Informasi harus accurate dan objective
- Bisa include classification, habitat, characteristics, behavior, uses
- Cocok untuk: animals, plants, objects, technology, places (general)
`;
        structureGuide = `
CONTOH STRUKTUR:

**Cats** (Title)

**General Classification:**
Cats are small furry animals that are often kept as pets. They belong to the feline family.

**Description:**

**Physical Features:**
Cats have soft fur, sharp claws, and a long tail. They have excellent night vision and sharp hearing. Their whiskers help them sense their surroundings.

**Behavior:**
Cats are independent animals. They spend a lot of time grooming themselves. They sleep for 12-16 hours a day. Cats are hunters by nature.

**Habitat:**
Cats can live in various environments. Pet cats usually live in houses with their owners. Wild cats live in forests or streets.

**Diet:**
Cats are carnivores. They eat meat, fish, and commercial cat food. They need protein to stay healthy.

**Benefits:**
Cats are good companions for humans. They can reduce stress and provide emotional support. They also help control pests like mice.
`;
        break;
    }

    return `
Kamu adalah seorang *Expert English Teacher* yang sangat berpengalaman dalam mengajarkan berbagai jenis teks (text types) untuk siswa SMP kelas 7.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 TEXT GENERATION REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mata Pelajaran: Bahasa Inggris
Kelas: VII SMP/MTs
Buku Referensi: English for Nusantara (Kemendikbudristek)
Chapter: ${selectedChapter.label}
Text Type: ${selectedTextType.label}
Topic: ${formData.topic || "Relevan dengan chapter"}
Length: ${selectedLength.words} words
Difficulty: ${formData.difficulty.toUpperCase()}
Number of Texts: ${formData.numberOfTexts}
${
  formData.customRequest ? `\n🎯 Custom Request: ${formData.customRequest}` : ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 CHAPTER CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Description:** ${selectedChapter.description || "N/A"}

**Topics:**
${
  selectedChapter.topics
    ? selectedChapter.topics.map((t) => `• ${t}`).join("\n")
    : "N/A"
}

**Relevant Vocabulary:**
${
  selectedChapter.vocabulary
    ? selectedChapter.vocabulary
        .slice(0, 15)
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TEXT TYPE GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${textTypeInstruction}

${structureGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ WRITING INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CRITICAL REQUIREMENTS:
1. **Strictly follow the generic structure** of ${selectedTextType.label}
2. **Use ONLY vocabulary and grammar** from the chapter/level appropriate
3. **Target length:** ${selectedLength.words} words (±10% acceptable)
4. **Difficulty level:** ${formData.difficulty.toUpperCase()}
5. **Context:** Content must be relevant and interesting for Indonesian Grade 7 students
6. **Language:** Clear, simple, and appropriate for the level

📊 DIFFICULTY GUIDELINES:

${
  formData.difficulty === "mudah"
    ? `
**MUDAH (Easy):**
- Simple vocabulary (high-frequency words only)
- Short sentences (7-10 words average)
- Simple sentence structures
- Clear, straightforward content
- Minimal complex descriptions
`
    : ""
}

${
  formData.difficulty === "sedang"
    ? `
**SEDANG (Medium):**
- Mix of simple and intermediate vocabulary
- Varied sentence lengths (8-15 words)
- Include some compound sentences
- Moderate descriptions and details
- Natural flow and coherence
`
    : ""
}

${
  formData.difficulty === "sulit"
    ? `
**SULIT (Hard):**
- More advanced vocabulary (but still appropriate for Grade 7)
- Complex sentence structures
- Rich descriptions and details
- Include literary devices (simile, metaphor if narrative)
- Challenge students while remaining achievable
`
    : ""
}

🎨 CONTENT GUIDELINES:
- Make it **interesting and engaging** for 12-13 year old students
- Use **Indonesian context** when relevant (places, names, situations)
- Content should be **culturally appropriate**
- Avoid controversial topics
- Include sensory details and specific information
- Make it **authentic** - should sound like natural English

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ${selectedTextType.label.toUpperCase()}
## ${selectedChapter.label}

---

${
  parseInt(formData.numberOfTexts) > 1
    ? `
[Generate ${formData.numberOfTexts} different texts, each clearly labeled as TEXT 1, TEXT 2, etc.]

### TEXT 1: [Title]

[The complete text following all guidelines]

**Word Count:** [actual word count]

---

### TEXT 2: [Title]

[The complete text following all guidelines]

**Word Count:** [actual word count]

---

`
    : `
### [Title of the Text]

[The complete text following all guidelines]

**Word Count:** [actual word count]

---
`
}

${
  formData.includeAnalysis
    ? `
## 📊 TEXT ANALYSIS

### Generic Structure Breakdown:
[Identify each part of the text and label it according to the generic structure]

Example for Procedure:
- **Goal/Aim:** [point to title]
- **Materials:** [point to materials section]
- **Steps:** [point to steps section]

### Language Features Used:
[List the key language features present in the text]
- Tense used: [e.g., Simple Present, Past Tense]
- Key grammatical patterns: [examples]
- Vocabulary level: [assessment]
- Sentence structures: [analysis]

---
`
    : ""
}

${
  formData.includeVocabulary
    ? `
## 📚 VOCABULARY LIST

[Extract 10-15 important/challenging words from the text]

| Word | Part of Speech | Meaning (Indonesian) | Example from Text |
|------|---------------|---------------------|-------------------|
| [word] | [pos] | [meaning] | [sentence] |

**Pronunciation Guide:**
[For 5-7 challenging words, provide simplified pronunciation]
Example: recipe /ˈres.ə.pi/ or (RE-si-pi)

---
`
    : ""
}

${
  formData.includeQuestions
    ? `
## ❓ COMPREHENSION QUESTIONS

### A. Multiple Choice (5 questions)
[Create 5 multiple choice questions testing comprehension]

1. [Question based on main idea or specific detail]
   A. [option]
   B. [option]
   C. [option]
   D. [option]

### B. True/False (5 statements)
[Create 5 T/F statements]

1. [Statement based on the text] (_____)
2. [Statement] (_____)

### C. Short Answer (3 questions)
[Create 3 open-ended questions]

1. [Question requiring written response]
2. [Question]
3. [Question]

---

## 🔑 ANSWER KEY

**Multiple Choice:**
1. [B]  2. [A]  3. [D]  4. [C]  5. [B]

**True/False:**
1. T  2. F  3. T  4. F  5. T

**Short Answer (Sample Answers):**
1. [Expected answer]
2. [Expected answer]
3. [Expected answer]

---
`
    : ""
}

## 📖 TEACHING NOTES

**Target Skills:** [Reading comprehension, vocabulary, grammar focus]

**Suggested Activities:**
1. [Pre-reading activity suggestion]
2. [While-reading activity]
3. [Post-reading activity]

**Common Mistakes to Watch:**
- [Potential error 1]
- [Potential error 2]

**Extension Ideas:**
- [Suggestion for further practice]
- [Writing task based on this text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL REMINDERS:
✓ Follow the generic structure EXACTLY
✓ Use ONLY appropriate vocabulary for Grade 7
✓ Meet the target word count (${selectedLength.words} words)
✓ Make content engaging and relevant for Indonesian students
✓ Ensure grammatical accuracy
✓ Use natural, authentic English
✓ Include specific details, not vague descriptions
✓ Proofread for spelling and punctuation

Generate a high-quality, ready-to-use ${
      selectedTextType.label
    } that teachers can immediately use in class! 📚✨
`;
  };

  const generateText = async () => {
    if (!formData.chapter) {
      setError("Pilih chapter terlebih dahulu!");
      return;
    }

    if (!formData.topic && formData.textType !== "report") {
      setError("Masukkan topik untuk text yang akan di-generate!");
      return;
    }

    const numTexts = parseInt(formData.numberOfTexts);
    if (numTexts < 1 || numTexts > 5) {
      setError("Jumlah text harus antara 1-5!");
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
                  "You are an expert English teacher specializing in teaching various text types to Indonesian junior high school students (Grade 7). You create authentic, engaging, and pedagogically sound reading materials that strictly follow text type conventions and are appropriate for the students' level.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 4000,
            top_p: 0.95,
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
      const textContent = data.choices[0].message.content;

      setResult(textContent);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Gagal generate text. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateText();
  };

  const exportToText = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const textType = textTypes
      .find((t) => t.id === formData.textType)
      ?.label.replace(/[^a-z0-9]/gi, "_");
    const chapterLabel = chapters
      .find((c) => c.id === formData.chapter)
      ?.label.replace(/[^a-z0-9]/gi, "_");
    const fileName = `${textType}_${chapterLabel}_${new Date().getTime()}.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert("✅ Text berhasil dicopy ke clipboard!");
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
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Easy Text</h1>
              <p className="text-gray-600">
                Generate berbagai jenis teks dengan AI
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
                <BookOpen className="w-5 h-5 text-orange-600" />
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  required>
                  <option value="">Pilih Chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.label}
                    </option>
                  ))}
                </select>

                {formData.chapter && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-sm font-semibold text-orange-800 mb-2">
                      📚 Context Chapter:
                    </p>
                    <p className="text-sm text-orange-700">
                      {
                        chapters.find((c) => c.id === formData.chapter)
                          ?.description
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Text Type Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-orange-600" />
                Pilih Jenis Teks
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {textTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                      formData.textType === type.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}>
                    <input
                      type="radio"
                      name="textType"
                      value={type.id}
                      checked={formData.textType === type.id}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <span className="text-3xl block mb-2">{type.icon}</span>
                      <h3 className="font-bold text-sm mb-1">{type.label}</h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {type.description}
                      </p>
                      <p className="text-xs text-gray-500 italic">
                        Ex: {type.examples}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Konfigurasi Text
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Topik *
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    placeholder="Contoh: How to Make Fried Rice, My Holiday in Bali"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    required={formData.textType !== "report"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.textType === "procedure" &&
                      "Contoh: How to make..., The way to..."}
                    {formData.textType === "narrative" &&
                      "Contoh: The Ant and the Grasshopper, A Wise Crow"}
                    {formData.textType === "recount" &&
                      "Contoh: My Holiday, School Trip, Last Weekend"}
                    {formData.textType === "descriptive" &&
                      "Contoh: My Pet Cat, My School, My Best Friend"}
                    {formData.textType === "report" &&
                      "Contoh: Cats, Smartphones, Borobudur Temple"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Panjang Text
                  </label>
                  <select
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none">
                    {lengthOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tingkat Kesulitan
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none">
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jumlah Text
                  </label>
                  <input
                    type="number"
                    name="numberOfTexts"
                    value={formData.numberOfTexts}
                    onChange={handleInputChange}
                    min="1"
                    max="5"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generate 1-5 text sekaligus
                  </p>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeAnalysis"
                      checked={formData.includeAnalysis}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-orange-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Include Text Analysis (Generic Structure + Language
                      Features)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeQuestions"
                      checked={formData.includeQuestions}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-orange-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Include Comprehension Questions (Multiple Choice, T/F,
                      Short Answer)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeVocabulary"
                      checked={formData.includeVocabulary}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-orange-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Include Vocabulary List (Key words + meanings +
                      pronunciation)
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="Contoh: Include dialogue, focus on past tense verbs, make it funny, add moral value about friendship"
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
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-4 rounded-xl hover:from-orange-700 hover:to-red-700 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Generating Text... (30-60 detik)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate Text dengan AI</span>
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
                <FileText className="w-6 h-6 text-orange-600" />✅ Text Berhasil
                Dibuat!
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
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 text-sm font-semibold shadow-md">
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
                <strong>💡 Tips:</strong> Text sudah siap pakai untuk reading
                comprehension! Copy ke Word/Google Docs untuk formatting lebih
                lanjut, atau print langsung untuk worksheet siswa.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
