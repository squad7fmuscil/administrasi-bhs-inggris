// create_student_auth_accounts.js
//
// CARA PAKE:
// 1. npm install @supabase/supabase-js (kalau belum ada)
// 2. Set environment variable SUPABASE_SERVICE_ROLE_KEY dulu, JANGAN hardcode
//    di file ini. Ambil dari Supabase Dashboard > Project Settings > API >
//    service_role key (BUKAN anon key).
//      Windows (cmd):   set SUPABASE_SERVICE_ROLE_KEY=isi_key_disini
//      Mac/Linux:       export SUPABASE_SERVICE_ROLE_KEY=isi_key_disini
// 3. Jalanin: node create_student_auth_accounts.js
// 4. Setelah selesai, HAPUS key dari environment / jangan simpen di history.
//
// Script ini AMAN dijalanin berkali-kali — siswa yang udah punya auth_id
// bakal di-skip otomatis (gak dibikin ulang / gak dobel).

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://xxxxxxxx.supabase.co"; // <-- GANTI sesuai project lo
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_DOMAIN = "murid.local"; // <-- domain sintetis buat email siswa

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY belum di-set di environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  const { data: students, error } = await supabase
    .from("users")
    .select("id, username, password, full_name")
    .eq("role", "student")
    .is("auth_id", null); // cuma yang belum punya akun Auth

  if (error) {
    console.error("Gagal ambil data siswa:", error.message);
    return;
  }

  console.log(`Ketemu ${students.length} siswa yang belum punya akun Auth.\n`);

  let sukses = 0;
  let gagal = 0;

  for (const s of students) {
    const email = `${s.username}@${EMAIL_DOMAIN}`;

    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email,
        password: s.password, // pake password existing di tabel users
        email_confirm: true, // gak perlu verifikasi email
      });

    if (createErr) {
      console.error(
        `❌ Gagal bikin akun ${s.full_name} (${s.username}):`,
        createErr.message,
      );
      gagal++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update({ auth_id: created.user.id })
      .eq("id", s.id);

    if (updateErr) {
      console.error(
        `❌ Gagal update auth_id ${s.full_name}:`,
        updateErr.message,
      );
      gagal++;
      continue;
    }

    console.log(`✅ ${s.full_name} → ${email}`);
    sukses++;
  }

  console.log(`\nSelesai. Berhasil: ${sukses}, Gagal: ${gagal}`);
}

run();
