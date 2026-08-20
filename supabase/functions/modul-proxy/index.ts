// supabase/functions/modul-proxy/index.ts
//
// Proxy aman buat Groq API khusus fitur generate Modul Ajar. API key Groq
// disimpen di server (Supabase Secrets), TIDAK PERNAH dikirim ke browser.
// Dilindungi APP_SECRET biar gak sembarang orang bisa manggil endpoint ini.

import { corsHeaders } from "../_shared/cors.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const APP_SECRET = Deno.env.get("APP_SECRET");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Cek secret dari header request. Kalau gak cocok, tolak.
  const incomingSecret = req.headers.get("x-app-secret");
  if (!APP_SECRET || incomingSecret !== APP_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY belum diset di server." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await groqRes.json();

    return new Response(JSON.stringify(data), {
      status: groqRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
