// students/StudentProfile.js
// ========================================================================
// Isi konten buat 3 menu di halaman "Akun": info profil, form ganti
// password, dan tombol keluar. Dipecah jadi named export (BUKAN 1
// komponen gede kayak sebelumnya) supaya masing-masing bisa dipasang
// sebagai isi accordion item terpisah di StudentLainnya.js.
//
// PENTING soal Ganti Password:
// Sistem login siswa ini custom (bukan supabase.auth), sesi disimpen lewat
// getStudentSession()/clearStudentSession() di utils/studentSession.js.
// Di bawah ini gue ASUMSIKAN password disimpen di tabel `users` kolom
// `password`. INI HARUS DICEK ULANG:
//   - Kalau kolomnya beda nama, sesuaikan query update-nya.
//   - Kalau passwordnya masih plaintext, JANGAN update plaintext langsung
//     dari client kayak di bawah ini buat production — idealnya validasi +
//     hashing dilakuin di server (Supabase Edge Function / RPC), bukan di
//     browser, biar gak gampang diakalin lewat devtools.
//   - Untuk sekarang kode di bawah masih update langsung ke tabel `users`
//     supaya UI-nya jalan, tapi tandain ini sebagai TODO keamanan.
// ========================================================================
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { clearStudentSession } from "../utils/studentSession";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// --- Helper validasi & normalisasi nomor HP Indonesia -------------------
// Nerima input dalam berbagai format umum (08xxxxxxxxxx, +62xxxxxxxxxxx,
// 62xxxxxxxxxxx, atau ada spasi/strip di tengah kayak 0812-3456-7890),
// terus dirapiin jadi format baku internasional "+62xxxxxxxxxxx" sebelum
// disimpen ke DB biar konsisten & resmi (gak ada yang kesimpen 08...
// sementara yang lain +62...).
function normalizePhone(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, ""); // buang semua selain angka
  let national; // nomor nasional tanpa kode negara, diawali "8"
  if (digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.startsWith("62")) {
    national = digits.slice(2);
  } else {
    // kadang orang nulis tanpa 0 di depan, misal "812xxxx"
    national = digits;
  }
  return "+62" + national;
}

// Nomor HP Indonesia yang valid: nomor nasional diawali 8 (mobile),
// panjang total 9-12 digit setelah kode negara (contoh: +6281234567890).
// Longgar dikit di batas atas/bawah biar gak nolak nomor yang beneran
// valid tapi agak pendek/panjang.
function isValidPhone(raw) {
  const normalized = normalizePhone(raw);
  return /^\+628\d{8,11}$/.test(normalized);
}

// --- Isi menu "Profile" -------------------------------------------------
// `onUpdated` (opsional): dipanggil abis form data tambahan berhasil
// disimpen, biasanya diisi `refetch` dari useStudentProfile() supaya
// data yang tampil langsung ke-update tanpa reload halaman.
export function ProfileInfo({ student, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [form, setForm] = useState({
    alamat: "",
    no_hp: "",
    nama_ortu: "",
    no_hp_ortu: "",
    sekolah_asal: "",
  });

  // Sinkronin form pas data student berubah (pertama kali load, atau
  // abis refetch sukses) — biar form gak nampilin data basi.
  useEffect(() => {
    setForm({
      alamat: student?.alamat || "",
      no_hp: student?.no_hp || "",
      nama_ortu: student?.nama_ortu || "",
      no_hp_ortu: student?.no_hp_ortu || "",
      sekolah_asal: student?.sekolah_asal || "",
    });
  }, [student]);

  const rows = [
    { label: "Nama Lengkap", value: student?.full_name || "-" },
    { label: "Username", value: `@${student?.username || "-"}` },
    { label: "NIS", value: student?.nis || "-" },
    {
      label: "Kelas",
      value: student?.classes?.grade || student?.homeroom_class_id || "-",
    },
    { label: "Sekolah Asal", value: student?.sekolah_asal || "-" },
    { label: "Alamat Lengkap", value: student?.alamat || "-" },
    { label: "No. HP Siswa (Kalau Ada)", value: student?.no_hp || "-" },
    { label: "Nama Orang Tua/Wali", value: student?.nama_ortu || "-" },
    { label: "No. HP Orang Tua/Wali", value: student?.no_hp_ortu || "-" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!student?.id) {
      setFormError("Sesi tidak ketemu, silakan login ulang.");
      return;
    }

    // Validasi nomor HP (kalau diisi) sebelum kirim ke database — biar
    // gak ada nomor asal-asalan/kepotong kesimpen. Kosongin field-nya
    // tetep boleh (opsional), jadi cuma divalidasi kalau ada isinya.
    if (form.no_hp && !isValidPhone(form.no_hp)) {
      setFormError(
        "No. HP Siswa tidak valid. Contoh format yang benar: 08123456789.",
      );
      return;
    }
    if (form.no_hp_ortu && !isValidPhone(form.no_hp_ortu)) {
      setFormError(
        "No. HP Orang Tua/Wali tidak valid. Contoh format yang benar: 08123456789.",
      );
      return;
    }

    setSubmitting(true);
    try {
      // Upsert: 1 baris per siswa di student_profile_details
      // (student_id = primary key), jadi otomatis update kalau udah
      // pernah isi, atau insert kalau baru pertama kali.
      const { error: upsertErr } = await supabase
        .from("student_profile_details")
        .upsert(
          {
            student_id: student.id,
            alamat: form.alamat || null,
            no_hp: form.no_hp ? normalizePhone(form.no_hp) : null,
            nama_ortu: form.nama_ortu || null,
            no_hp_ortu: form.no_hp_ortu
              ? normalizePhone(form.no_hp_ortu)
              : null,
            sekolah_asal: form.sekolah_asal || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id" },
        );

      if (upsertErr) throw upsertErr;

      setIsEditing(false);
      if (onUpdated) await onUpdated();
    } catch (err) {
      console.error("[ProfileInfo] Gagal simpan data profil tambahan:", err);
      setFormError("Gagal menyimpan data. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Sekolah Asal
          </label>
          <input
            type="text"
            value={form.sekolah_asal}
            onChange={(e) =>
              setForm((f) => ({ ...f, sekolah_asal: e.target.value }))
            }
            placeholder="Contoh: SDN 1 Cililin"
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Alamat Lengkap
          </label>
          <textarea
            rows={2}
            value={form.alamat}
            onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
            placeholder="Contoh: Kp. Cikadu RT 08 RW 07 Desa Bongas Kec. Cililin Kab. Bandung Barat"
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            No. HP Siswa (Kalau Ada)
          </label>
          <input
            type="tel"
            value={form.no_hp}
            onChange={(e) => setForm((f) => ({ ...f, no_hp: e.target.value }))}
            placeholder="08xxxxxxxxxx"
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Nama Orang Tua/Wali
          </label>
          <input
            type="text"
            value={form.nama_ortu}
            onChange={(e) =>
              setForm((f) => ({ ...f, nama_ortu: e.target.value }))
            }
            placeholder="Nama ayah/ibu/wali"
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            No. HP Orang Tua/Wali
          </label>
          <input
            type="tel"
            value={form.no_hp_ortu}
            onChange={(e) =>
              setForm((f) => ({ ...f, no_hp_ortu: e.target.value }))
            }
            placeholder="08xxxxxxxxxx"
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={submitting}
            className="flex-1 text-sm font-semibold text-gray-600 bg-gray-100 py-2.5 rounded-lg disabled:opacity-60">
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-60">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start justify-between py-3 gap-3">
            <span className="text-sm font-medium text-gray-500 shrink-0">
              {r.label}
            </span>
            <span className="text-sm font-bold text-gray-900 text-right break-words">
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full mt-3 text-sm font-semibold text-blue-600 bg-blue-50 py-2.5 rounded-lg">
        Lengkapi / Edit Data
      </button>
    </div>
  );
}

// --- Isi menu "Ganti Password" ------------------------------------------
export function ChangePasswordForm({ student }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("Semua kolom wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Cek password lama dulu (asumsi kolom `password` di tabel users)
      const { data: userRow, error: fetchErr } = await supabase
        .from("users")
        .select("id, password")
        .eq("id", student.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!userRow || userRow.password !== currentPassword) {
        setPwError("Password lama salah.");
        setSubmitting(false);
        return;
      }

      // 2. Update ke password baru
      // TODO KEAMANAN: idealnya hash password sebelum simpen, dan proses
      // ini dijalanin lewat server-side function, bukan langsung dari
      // client kayak sekarang.
      const { error: updateErr } = await supabase
        .from("users")
        .update({ password: newPassword })
        .eq("id", student.id);

      if (updateErr) throw updateErr;

      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("[ChangePasswordForm] Gagal ganti password:", err);
      setPwError("Gagal menyimpan password baru. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-3">
      {pwError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
          {pwError}
        </div>
      )}
      {pwSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs">
          Password berhasil diubah.
        </div>
      )}

      <div className="relative">
        <input
          type={showPw ? "text" : "password"}
          placeholder="Password lama"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>
      <div className="relative">
        <input
          type={showPw ? "text" : "password"}
          placeholder="Password baru (min. 6 karakter)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>
      <div className="relative">
        <input
          type={showPw ? "text" : "password"}
          placeholder="Konfirmasi password baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-60">
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting ? "Menyimpan..." : "Simpan Password Baru"}
      </button>
    </form>
  );
}

// --- Isi menu "Keluar" ---------------------------------------------------
export function LogoutSection() {
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    clearStudentSession();
    // Reload penuh biar semua state ke-reset & balik ke halaman login
    window.location.href = "/";
  };

  if (!confirmLogout) {
    return (
      <button
        type="button"
        onClick={() => setConfirmLogout(true)}
        className="text-sm font-semibold text-red-600">
        Klik untuk konfirmasi keluar dari akun.
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Yakin Mau Keluar?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmLogout(false)}
          className="flex-1 text-sm font-semibold text-gray-600 bg-gray-100 py-2 rounded-lg">
          Batal
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex-1 text-sm font-semibold text-white bg-red-600 py-2 rounded-lg">
          Ya, Keluar
        </button>
      </div>
    </div>
  );
}
