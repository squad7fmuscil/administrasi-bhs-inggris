import { GROQ_API_URL, APP_SECRET, GROQ_CONFIG } from "./modulConfig";

// TpEnricher — perkaya/perbaiki teks Tujuan Pembelajaran (TP) yang sudah
// otomatis terisi dari modulConfig, dipakai bareng di ProtaPage & PromesPage.
// Reuse Edge Function "modul-proxy" yang sama dengan ModulGenerator (BUKAN
// bikin endpoint baru), jadi Groq API key tetap aman di server.
export const TpEnricher = {
  /**
   * @param {Object} params
   * @param {string} params.mapel - nama mata pelajaran, misal "Bahasa Inggris"
   * @param {string} params.kelas - "7" | "8" | "9"
   * @param {Array<{id:string, chapter:string, units?:string[], tp:string}>} params.items
   * @returns {Promise<Record<string,string>>} map id -> teks tp baru (dipisah \n per unit)
   */
  async enrichTp({ mapel, kelas, items }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("❌ Tidak ada bab/unit untuk diperkaya.");
    }

    const systemPrompt = `Anda adalah pakar kurikulum Merdeka yang membantu guru merumuskan kalimat Tujuan Pembelajaran (TP) yang jelas, terukur, dan sesuai Capaian Pembelajaran Fase D untuk mapel ${mapel} kelas ${kelas}.

ATURAN:
1. Setiap TP WAJIB diawali "Peserta didik mampu ..." dan pakai kata kerja operasional (menganalisis, menyusun, mempresentasikan, dll — hindari kata kabur seperti "memahami" saja tanpa konteks jelas).
2. Pertahankan jumlah baris TP kira-kira sama dengan jumlah unit pada bab tersebut (1 unit = idealnya 1 baris TP), kecuali TP lama kosong maka buatkan minimal 1 baris relevan.
3. Perbaiki/perkaya kalimat TP yang sudah ada (bukan mengganti topik/materinya), jangan mengarang topik baru di luar nama bab & unit yang diberikan.
4. Jawab HANYA dalam format JSON valid, tanpa penjelasan tambahan, tanpa markdown code fence.`;

    const inputList = items.map((it) => ({
      id: it.id,
      chapter: it.chapter,
      units: it.units || [],
      tpLama: it.tp || "",
    }));

    const userPrompt = `Perkaya/perbaiki Tujuan Pembelajaran untuk bab-bab berikut ini:
${JSON.stringify(inputList, null, 2)}

Balas HANYA JSON dengan struktur persis:
{
  "items": [
    { "id": "<id sama persis seperti input>", "tp": "Peserta didik mampu ...\\nPeserta didik mampu ..." }
  ]
}
Jumlah objek di "items" harus sama persis dengan jumlah bab pada input, urutan bebas asal id-nya cocok.`;

    let response;
    try {
      response = await fetch(GROQ_API_URL, {
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
          max_tokens: GROQ_CONFIG.maxTokens,
          temperature: GROQ_CONFIG.temperature,
          top_p: GROQ_CONFIG.topP,
        }),
      });
    } catch (err) {
      throw new Error(
        "❌ Gagal terhubung ke server AI. Periksa koneksi internet Anda.",
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        response.statusText ||
        "Unknown error";
      throw new Error(`❌ Error dari AI: ${errorMessage}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("❌ Respons AI tidak valid. Silakan coba lagi.");
    }

    const parsed = this.parseResult(content);

    const map = {};
    for (const row of parsed.items) {
      if (row?.id) map[row.id] = row.tp || "";
    }
    return map;
  },

  parseResult(rawContent) {
    let cleaned = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    if (start === -1) {
      throw new Error("❌ AI tidak menghasilkan format JSON. Coba lagi.");
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
        "❌ Respons AI terpotong sebelum selesai. Coba lagi (bab lebih sedikit per generate bisa membantu).",
      );
    }

    const jsonStr = cleaned.slice(start, end + 1);
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error("❌ AI menghasilkan format tidak valid. Coba lagi.");
    }

    if (!Array.isArray(parsed.items)) {
      throw new Error("❌ Struktur respons AI tidak lengkap. Coba lagi.");
    }
    return parsed;
  },
};
