// Panggil lewat Supabase Edge Function (modul-proxy), BUKAN Groq SDK
// langsung dari browser. API key Groq disimpen aman di server, gak pernah
// nempel di kode/bundle frontend (sebelumnya pakai groq-sdk dengan
// dangerouslyAllowBrowser: true, yang berarti key ke-expose ke browser).

const FUNCTION_URL =
  "https://dgrncsnsgtrsotnynsrl.supabase.co/functions/v1/modul-proxy";

const MODEL = "openai/gpt-oss-120b";

/**
 * Fungsi dasar buat manggil Groq API lewat proxy server.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {boolean} jsonMode - true kalau mau response dalam format JSON object
 */
async function callGroq(systemPrompt, userPrompt, jsonMode = false) {
  const APP_SECRET = import.meta.env.VITE_APP_SECRET;

  if (!APP_SECRET) {
    throw new Error("VITE_APP_SECRET belum di-set. Cek file .env kamu.");
  }

  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "x-app-secret": APP_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: jsonMode ? 0.7 : 0.3,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `API Error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Respons Groq API kosong atau formatnya tidak sesuai.");
  }

  return jsonMode ? JSON.parse(content) : content;
}

/**
 * Cek grammar dari sebuah kalimat/paragraf bahasa Inggris.
 * @param {string} text
 * @returns {Promise<{correction: string, suggestion: string, alternative: string}>}
 */
export async function checkGrammar(text) {
  const systemPrompt =
    "Kamu guru bahasa Inggris yang ramah. Koreksi grammar dari kalimat berikut, " +
    "kasih saran perbaikan, dan berikan alternatif kalimat yang lebih natural. " +
    "Jawab HANYA dalam format JSON seperti ini: " +
    '{"correction": "kalimat yang sudah diperbaiki", "suggestion": "penjelasan kesalahan & saran", "alternative": "alternatif kalimat natural"}';

  return callGroq(systemPrompt, text, true);
}

/**
 * Jelaskan kenapa jawaban siswa salah pada soal pilihan ganda.
 * @param {{ soal: string, pilihanUser: string, jawabanBenar: string }} params
 * @returns {Promise<string>} penjelasan singkat dalam Bahasa Indonesia
 */
export async function explainAnswer({ soal, pilihanUser, jawabanBenar }) {
  const systemPrompt =
    "Kamu guru bahasa Inggris yang menjelaskan ke siswa SMA dengan singkat, " +
    "jelas, dan ramah dalam Bahasa Indonesia. Maksimal 3 kalimat, jangan bertele-tele.";

  const userPrompt =
    `Soal: "${soal}"\n` +
    `Jawaban siswa: "${pilihanUser}" (SALAH)\n` +
    `Jawaban benar: "${jawabanBenar}"\n\n` +
    "Jelaskan singkat kenapa jawaban siswa salah dan kenapa jawaban yang benar itu benar.";

  return callGroq(systemPrompt, userPrompt, false);
}

/**
 * Generate soal pilihan ganda tentang sebuah topik grammar.
 * @param {string} topic - misal "Simple Present Tense"
 * @param {number} jumlah - jumlah soal yang mau dibuat
 * @returns {Promise<Array<{soal: string, pilihan: string[], jawaban: string}>>}
 */
export async function generateSoal(topic, jumlah = 3) {
  const systemPrompt =
    `Kamu guru bahasa Inggris. Buat ${jumlah} soal pilihan ganda tentang topik ` +
    `grammar "${topic}" untuk siswa SMA/pemula. Setiap soal punya tepat 4 pilihan ` +
    'jawaban dan hanya 1 yang benar. Nilai "jawaban" HARUS sama persis (case-sensitive) ' +
    'dengan salah satu string di array "pilihan". ' +
    "Jawab HANYA dalam format JSON object seperti ini, tanpa teks lain di luar JSON: " +
    '{"soal": [{"soal": "teks soal, pakai ___ untuk bagian kosong", ' +
    '"pilihan": ["A", "B", "C", "D"], "jawaban": "pilihan yang benar"}]}';

  const userPrompt = `Buat ${jumlah} soal pilihan ganda tentang ${topic}.`;

  const data = await callGroq(systemPrompt, userPrompt, true);

  if (!Array.isArray(data?.soal)) {
    throw new Error("Format soal dari AI tidak sesuai, coba generate ulang.");
  }

  return data.soal;
}
