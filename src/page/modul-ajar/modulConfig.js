// API Configuration
// Panggil lewat Supabase Edge Function (modul-proxy), BUKAN Groq langsung.
// API key Groq disimpen aman di server (Supabase Secrets), gak pernah
// nempel di kode/bundle frontend.
export const GROQ_API_URL =
  "https://dgrncsnsgtrsotnynsrl.supabase.co/functions/v1/modul-proxy";
export const APP_SECRET = import.meta.env.VITE_APP_SECRET;

// Groq API Configuration
// Generate dipecah jadi 3 request berurutan (lihat ModulGenerator.generateModul)
// supaya tiap request tetap di bawah limit TPM free tier (8000).
export const GROQ_CONFIG = {
  model: "openai/gpt-oss-20b",
  maxTokensPart1a: 3000, // informasiUmum+identifikasi+desainPembelajaran
  maxTokensPart1b: 4500, // pengalamanBelajar saja (paling banyak konten)
  maxTokensPart2: 4500, // diferensiasi+asesmen(10 soal)+sumberBelajar
  temperature: 0.7,
  topP: 0.9,
};

// Constants
export const semuaDimensi = [
  "Keimanan dan Ketakwaan",
  "Kewargaan",
  "Penalaran Kritis",
  "Kreativitas",
  "Kolaborasi",
  "Kemandirian",
  "Kesehatan",
  "Komunikasi",
];

// Grade Data
export const gradeData = {
  7: {
    "Chapter 1 - About Me": {
      "Unit 1 - Galang from Kalimantan": {
        pages: "14-27",
        skills: "Listening, Speaking",
        grammar: "Simple Present Tense, WH-Questions",
        vocabulary: "Personal information, greetings, introductions",
        textType: "Conversation",
        coreCompetencies: "Memperkenalkan diri dan orang lain",
      },
      "Unit 2 - I Love Fishing": {
        pages: "28-39",
        skills: "Listening, Speaking, Reading",
        grammar: "Simple Present Tense, Frequency adverbs, Pronouns",
        vocabulary: "Hobbies, activities, frequency expressions",
        textType: "Descriptive",
        coreCompetencies: "Mendeskripsikan hobi dan kegiatan favorit",
      },
      "Unit 3 - My Friends and I": {
        pages: "40-53",
        skills: "Writing, Presenting, Reading",
        grammar: "Simple Present Tense, Descriptive adjectives",
        vocabulary: "Physical appearance, personality, daily activities",
        textType: "Descriptive",
        coreCompetencies: "Mendeskripsikan teman dan kegiatan bersama",
      },
    },
    "Chapter 2 - Culinary and Me": {
      "Unit 1 - My Favorite Food": {
        pages: "54-67",
        skills: "Speaking, Listening",
        grammar: "Simple Present Tense, Like/Dislike expressions",
        vocabulary: "Food, drinks, taste, preferences",
        textType: "Conversation",
        coreCompetencies: "Mengungkapkan preferensi makanan dan minuman",
      },
      "Unit 2 - My Favorite Snack": {
        pages: "68-79",
        skills: "Reading, Writing",
        grammar: "Simple Present Tense, Quantifiers (some, any, much, many)",
        vocabulary: "Snacks, ingredients, healthy/unhealthy food",
        textType: "Descriptive",
        coreCompetencies: "Mendeskripsikan makanan ringan favorit",
      },
      "Unit 3 - A Secret Recipe": {
        pages: "80-93",
        skills: "Reading, Writing, Speaking",
        grammar: "Imperative sentences, Sequence markers",
        vocabulary: "Cooking verbs, kitchen utensils, recipe instructions",
        textType: "Procedure",
        coreCompetencies: "Membuat dan mempresentasikan resep masakan",
      },
    },
    "Chapter 3 - Home Sweet Home": {
      "Unit 1 - My House": {
        pages: "94-107",
        skills: "Speaking, Listening",
        grammar: "There is/There are, Prepositions of place",
        vocabulary: "Rooms, furniture, household items",
        textType: "Descriptive",
        coreCompetencies: "Mendeskripsikan rumah dan isinya",
      },
      "Unit 2 - My House Chores": {
        pages: "108-119",
        skills: "Speaking, Writing",
        grammar: "Simple Present Tense, Daily routine expressions",
        vocabulary: "Household chores, cleaning activities, responsibility",
        textType: "Descriptive",
        coreCompetencies: "Mendeskripsikan pekerjaan rumah sehari-hari",
      },
      "Unit 3 - Let's Clean Up!": {
        pages: "120-133",
        skills: "Speaking, Listening",
        grammar: "Imperative sentences, Let's + verb",
        vocabulary: "Cleaning tools, teamwork, environmental care",
        textType: "Procedure",
        coreCompetencies: "Memberikan instruksi membersihkan rumah",
      },
    },
    "Chapter 4 - My School Activities": {
      "Unit 1 - My Class Schedule": {
        pages: "134-147",
        skills: "Reading, Writing",
        grammar: "Time expressions, Days of the week, Simple Present",
        vocabulary: "School subjects, time, daily schedule",
        textType: "Descriptive",
        coreCompetencies: "Mendeskripsikan jadwal pelajaran sekolah",
      },
      "Unit 2 - My Online Class": {
        pages: "148-159",
        skills: "Listening, Speaking",
        grammar: "Present Continuous Tense, Technology expressions",
        vocabulary: "Online learning, technology, digital literacy",
        textType: "Conversation",
        coreCompetencies: "Berinteraksi dalam pembelajaran daring",
      },
      "Unit 3 - My Study Habits": {
        pages: "160-173",
        skills: "Writing, Presenting",
        grammar: "Frequency adverbs, Simple Present Tense",
        vocabulary: "Study methods, learning strategies, academic habits",
        textType: "Descriptive",
        coreCompetencies: "Menjelaskan kebiasaan belajar",
      },
    },
    "Chapter 5 - This is My School": {
      "Unit 1 - School Buildings": {
        pages: "174-187",
        skills: "Speaking, Reading",
        grammar: "There is/There are, Prepositions of place",
        vocabulary: "School facilities, buildings, directions",
        textType: "Descriptive",
        coreCompetencies: "Mendeskripsikan fasilitas sekolah",
      },
      "Unit 2 - Extracurricular Activities": {
        pages: "188-199",
        skills: "Listening, Speaking",
        grammar: "Simple Present Tense, Can/Cannot for abilities",
        vocabulary: "Sports, clubs, talents, interests",
        textType: "Conversation",
        coreCompetencies: "Menjelaskan kegiatan ekstrakurikuler",
      },
      "Unit 3 - School Festival": {
        pages: "200-213",
        skills: "Writing, Presenting",
        grammar: "Future tense (will/going to), Event planning",
        vocabulary: "Events, celebrations, planning, teamwork",
        textType: "Descriptive",
        coreCompetencies: "Merencanakan dan mendeskripsikan acara sekolah",
      },
    },
  },
  8: {
    "Chapter 1 - Celebrating Independence Day": {
      "Unit 1 - The Champion of Panjat Pinang": {
        pages: "14-27",
        skills: "Reading, Writing, Speaking",
        grammar: "Past Tense, Time expressions, Sequence markers",
        vocabulary:
          "Independence Day, traditional games, competition, celebration",
        textType: "Recount Text",
        coreCompetencies: "Menceritakan pengalaman mengikuti lomba 17 Agustus",
      },
      "Unit 2 - Going to a Parade": {
        pages: "28-39",
        skills: "Listening, Speaking, Writing",
        grammar: "Past Continuous, Past Tense, Descriptive adjectives",
        vocabulary: "Parade, ceremony, patriotism, national symbols, crowd",
        textType: "Recount Text",
        coreCompetencies: "Menceritakan pengalaman menonton pawai kemerdekaan",
      },
      "Unit 3 - Independence Day at SMP Merdeka": {
        pages: "40-53",
        skills: "Writing, Presenting, Reading",
        grammar: "Past Tense, Narrative connectors, Time sequences",
        vocabulary: "School celebration, flag ceremony, performances, unity",
        textType: "Recount Text",
        coreCompetencies: "Menceritakan perayaan kemerdekaan di sekolah",
      },
    },
    "Chapter 2 - Kindness Begins with Me": {
      "Unit 1 - Kindness Towards Differences (The Ugly Duckling)": {
        pages: "54-67",
        skills: "Reading, Speaking, Critical Thinking",
        grammar: "Past Tense, Direct/Indirect speech, Character descriptions",
        vocabulary:
          "Differences, acceptance, bullying, transformation, self-worth",
        textType: "Narrative Text",
        coreCompetencies:
          "Memahami dan menceritakan nilai kebaikan terhadap perbedaan",
      },
      "Unit 2 - Kindness and Happiness (Elephant and Friends)": {
        pages: "68-79",
        skills: "Reading, Writing, Moral reasoning",
        grammar: "Past Tense, Dialogue, Emotional expressions",
        vocabulary: "Friendship, kindness, sharing, cooperation, happiness",
        textType: "Narrative Text",
        coreCompetencies:
          "Memahami nilai kebaikan dan kebahagiaan melalui cerita",
      },
      "Unit 3 - Kindness and Friendship": {
        pages: "80-93",
        skills: "Writing, Presenting, Creative storytelling",
        grammar: "Narrative tenses, Character development, Plot structure",
        vocabulary: "Empathy, compassion, helping others, moral values",
        textType: "Narrative Text",
        coreCompetencies: "Membuat cerita tentang kebaikan dan persahabatan",
      },
    },
    "Chapter 3 - Love Our World": {
      "Unit 1 - Look Around You": {
        pages: "94-107",
        skills: "Reading, Speaking, Environmental awareness",
        grammar: "Present Tense, Imperative, Modal verbs (should, must)",
        vocabulary:
          "Water conservation, health habits, environmental protection",
        textType: "Procedure & Descriptive",
        coreCompetencies: "Menjelaskan cara menjaga lingkungan sekitar",
      },
      "Unit 2 - This is the Way": {
        pages: "108-119",
        skills: "Writing, Creating, Digital literacy",
        grammar:
          "Imperative sentences, Step-by-step instructions, Present Tense",
        vocabulary:
          "Poster making, social media, campaigns, visual communication",
        textType: "Procedure Text",
        coreCompetencies: "Membuat kampanye peduli lingkungan",
      },
      "Unit 3 - Act Now": {
        pages: "120-133",
        skills: "Presenting, Campaigning, Social action",
        grammar:
          "Imperative, Persuasive language, Future tense (will/going to)",
        vocabulary:
          "Environmental campaigns, action words, urgency, responsibility",
        textType: "Descriptive & Hortatory",
        coreCompetencies: "Mengajak bertindak untuk lingkungan",
      },
    },
    "Chapter 4 - No Littering": {
      "Unit 1 - Did It Rain Last Night?": {
        pages: "134-147",
        skills: "Reading, Listening, Cause-effect analysis",
        grammar: "Past Tense, Question formation, Weather expressions",
        vocabulary:
          "Weather, flooding, natural disasters, environmental impact",
        textType: "Recount Text",
        coreCompetencies: "Menceritakan kejadian bencana alam",
      },
      "Unit 2 - What Happened to the Sea Animals?": {
        pages: "148-159",
        skills: "Reading, Writing, Environmental storytelling",
        grammar: "Past Tense, Passive voice, Descriptive language",
        vocabulary:
          "Marine animals, pollution, rescue, conservation, ecosystem",
        textType: "Recount Text",
        coreCompetencies: "Menceritakan dampak polusi terhadap hewan laut",
      },
      "Unit 3 - You Can Help (Bye Bye Plastic Bags)": {
        pages: "160-173",
        skills: "Writing, Presenting, Activism",
        grammar: "Modal verbs, Present Tense, Persuasive structures",
        vocabulary:
          "Plastic pollution, environmental activism, Bali campaign, solutions",
        textType: "Recount Text",
        coreCompetencies: "Menceritakan gerakan anti plastik",
      },
    },
    "Chapter 5 - Embrace Yourself": {
      "Unit 1 - Be Yourself": {
        pages: "174-187",
        skills: "Reading, Critical thinking, Opinion expression",
        grammar: "Opinion expressions, Present Tense, Comparative adjectives",
        vocabulary:
          "Self-confidence, appearance, advertising, personal identity",
        textType: "Narrative & Opinion",
        coreCompetencies: "Mengekspresikan pendapat tentang diri sendiri",
      },
      "Unit 2 - I Know I Can Do It": {
        pages: "188-199",
        skills: "Writing, Speaking, Motivational storytelling",
        grammar: "Past Tense, Present Perfect, Achievement expressions",
        vocabulary: "Motivation, perseverance, personal struggle, achievement",
        textType: "Narrative Text",
        coreCompetencies: "Menceritakan kisah motivasi dan pencapaian",
      },
      "Unit 3 - Practice Makes Perfect": {
        pages: "200-213",
        skills: "Presenting, Inspiring, Success storytelling",
        grammar: "Present Perfect, Past Tense, Result expressions",
        vocabulary: "Practice, persistence, skill development, success stories",
        textType: "Narrative Text",
        coreCompetencies: "Mempresentasikan kisah sukses melalui latihan",
      },
    },
  },
  9: {
    "Chapter 1 - Exploring Fauna of Indonesia": {
      "Unit 1 - Bekantan": {
        pages: "14-27",
        skills: "Reading, Writing",
        grammar: "Simple Present Tense, Passive Voice, Classification language",
        vocabulary:
          "Indonesian fauna, habitat, physical characteristics, conservation",
        textType: "Report Text",
        coreCompetencies: "Membuat laporan tentang fauna Indonesia",
      },
      "Unit 2 - Orangutan and Gorilla": {
        pages: "28-39",
        skills: "Reading, Speaking, Comparing",
        grammar:
          "Comparative and Superlative, Present Tense, Scientific descriptions",
        vocabulary:
          "Primates, comparison, endangered species, similarities and differences",
        textType: "Report Text (Comparative)",
        coreCompetencies: "Membandingkan dua jenis hewan primata",
      },
      "Unit 3 - Indonesian Birds": {
        pages: "40-53",
        skills: "Listening, Writing, Research",
        grammar: "Present Tense, Classification, Descriptive language",
        vocabulary: "Bird species, migration, behavior, conservation status",
        textType: "Report Text",
        coreCompetencies: "Membuat laporan tentang burung Indonesia",
      },
    },
    "Chapter 2 - Taking Trips": {
      "Unit 1 - Going to a National Park": {
        pages: "54-67",
        skills: "Reading, Speaking, Storytelling",
        grammar: "Past Tense, Time expressions, Sequence connectors",
        vocabulary: "Tourism, national parks, outdoor activities, experiences",
        textType: "Recount Text",
        coreCompetencies:
          "Menceritakan pengalaman berkunjung ke taman nasional",
      },
      "Unit 2 - What Did You Do There?": {
        pages: "68-79",
        skills: "Listening, Speaking, Interviewing",
        grammar: "Past Tense, WH-Questions, Past Continuous",
        vocabulary: "Holiday activities, experiences, emotions, interactions",
        textType: "Recount Text (Personal Experience)",
        coreCompetencies: "Menceritakan kegiatan saat liburan",
      },
      "Unit 3 - My Underwater Adventure": {
        pages: "80-93",
        skills: "Writing, Reading, Creative Writing",
        grammar: "Past Tense, Descriptive adjectives, Sensory details",
        vocabulary: "Marine life, underwater activities, adventure, feelings",
        textType: "Recount Text (Adventure)",
        coreCompetencies: "Menulis pengalaman petualangan bawah laut",
      },
    },
    "Chapter 3 - Journey to Fantasy Worlds": {
      "Unit 1 - Andre and Princess Suripit": {
        pages: "94-107",
        skills: "Reading, Speaking, Story Analysis",
        grammar: "Past Tense, Direct/Indirect Speech, Narrative connectors",
        vocabulary: "Fantasy elements, characters, plot, conflict resolution",
        textType: "Narrative Text (Fairy Tale)",
        coreCompetencies: "Memahami dan menganalisis cerita fantasi",
      },
      "Unit 2 - Back to the 90s": {
        pages: "108-119",
        skills: "Writing, Creative Thinking",
        grammar: "Past Tense, Time expressions, Descriptive language",
        vocabulary:
          "90s culture, time travel, nostalgia, historical references",
        textType: "Narrative Text (Time Travel)",
        coreCompetencies: "Menulis cerita perjalanan waktu",
      },
      "Unit 3 - The Multiverse Story of Timun Mas": {
        pages: "120-133",
        skills: "Presenting, Creative Performance",
        grammar: "Complex sentences, Narrative tenses, Character dialogue",
        vocabulary:
          "Indonesian folklore, multiverse concept, modern adaptation",
        textType: "Narrative Text (Modern Adaptation)",
        coreCompetencies: "Mempresentasikan adaptasi modern cerita rakyat",
      },
    },
    "Chapter 4 - Upcycling Used Materials": {
      "Unit 1 - Look At My New Creation": {
        pages: "134-147",
        skills: "Speaking, Presenting, Demonstrating",
        grammar: "Present Perfect, Descriptive adjectives, Process language",
        vocabulary:
          "Upcycling, creativity, materials, transformation, sustainability",
        textType: "Descriptive + Procedure",
        coreCompetencies: "Mendemonstrasikan hasil upcycling",
      },
      "Unit 2 - They're On Sale": {
        pages: "148-159",
        skills: "Speaking, Role-playing, Negotiating",
        grammar: "Modal verbs, Price expressions, Persuasive language",
        vocabulary: "Sales, marketing, pricing, customer service, business",
        textType: "Conversation (Transactional)",
        coreCompetencies: "Melakukan transaksi jual beli dalam bahasa Inggris",
      },
      "Unit 3 - Let's Donate": {
        pages: "160-173",
        skills: "Writing, Social Action, Campaigning",
        grammar: "Imperative, Modal verbs, Persuasive structures",
        vocabulary:
          "Charity, social responsibility, community service, helping others",
        textType: "Hortatory Exposition",
        coreCompetencies: "Membuat kampanye donasi sosial",
      },
    },
    "Chapter 5 - Digital Life": {
      "Unit 1 - Let's Check the Facts!": {
        pages: "174-187",
        skills: "Reading, Critical Thinking, Research",
        grammar: "Present Tense, Question formation, Evidence language",
        vocabulary:
          "Fact-checking, reliable sources, misinformation, digital literacy",
        textType: "Analytical Exposition",
        coreCompetencies: "Menganalisis fakta dan hoaks di era digital",
      },
      "Unit 2 - Stay Safe in the Digital World": {
        pages: "188-199",
        skills: "Speaking, Discussion, Problem-solving",
        grammar: "Modal verbs, Conditional sentences, Advice language",
        vocabulary: "Digital safety, cyberbullying, privacy, online security",
        textType: "Hortatory Exposition",
        coreCompetencies: "Memberikan saran keamanan digital",
      },
      "Unit 3 - Turn Back Hoax!": {
        pages: "200-213",
        skills: "Writing, Campaigning, Media Creation",
        grammar: "Imperative, Present Tense, Persuasive language",
        vocabulary: "Hoaxes, misinformation, social media, responsible sharing",
        textType: "Hortatory Exposition",
        coreCompetencies: "Membuat kampanye anti hoaks",
      },
    },
  },
};

// Helper Functions
export const getOfficialCP = (selectedGrade = "7") => {
  const officialCP = {
    listening_speaking:
      "Memahami alur informasi secara keseluruhan, gagasan utama, dan informasi rinci dari teks lisan tentang topik sehari-hari atau yang sesuai dengan minat. Menggunakan bahasa Inggris untuk mengungkapkan gagasan dan pengalaman dalam berbagai jenis teks secara lisan tentang topik yang dibahas dengan menggunakan kalimat sederhana dan majemuk, baik formal maupun informal sesuai konteks.",
    reading_viewing:
      "Memahami alur informasi, informasi tersurat dan tersirat dari berbagai jenis teks tertulis atau teks multimodal tentang topik sehari-hari atau yang sesuai dengan minat, serta meresponsnya sesuai konteks.",
    writing_presenting:
      "Mengomunikasikan gagasan dan pengalaman mereka dalam berbagai jenis teks secara tertulis atau teks multimodal tentang topik sehari-hari atau yang sesuai dengan minat dengan mulai menggunakan kalimat sederhana dan majemuk dengan struktur teks dan unsur kebahasaan yang tepat; mengungkapkan pendapat dan mempertahankan argumen tentang suatu isu terkait topik sehari-hari atau yang sesuai dengan minat.",
  };
  return officialCP;
};

export const getAllChaptersForGrade = (selectedGrade) =>
  Object.keys(gradeData[selectedGrade] || {});

export const getUnitsForChapter = (selectedChapter, selectedGrade = "7") =>
  Object.keys(gradeData[selectedGrade]?.[selectedChapter] || {});

export const getUnitDetails = (
  selectedChapter,
  selectedUnit,
  selectedGrade = "7",
) => gradeData[selectedGrade]?.[selectedChapter]?.[selectedUnit] || {};

// Default Values
export const defaultValues = {
  namaSekolah: "SMP Muslimin Cililin",
  namaGuru: "",
  mapel: "Bahasa Inggris",
  kelas: "7",
  chapter: "Chapter 1 - About Me",
  topik: "Unit 1 - Galang from Kalimantan",
  alokasiWaktu: "2",
  dimensi: ["Komunikasi", "Kolaborasi"],
};

// Export semua config
export const modulConfig = {
  GROQ_API_URL,
  APP_SECRET,
  GROQ_CONFIG,
  semuaDimensi,
  gradeData,
  getOfficialCP,
  getAllChaptersForGrade,
  getUnitsForChapter,
  getUnitDetails,
  defaultValues,
};

export default modulConfig;
