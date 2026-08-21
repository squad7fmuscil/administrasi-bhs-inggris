// students/StudentProfile.js
// ========================================================================
// Komponen tampilan "Akun" siswa — dipanggil dari StudentLainnya.js.
// Isinya: kartu profil, form ganti password, dan tombol keluar.
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
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { clearStudentSession } from "../utils/studentSession";
import { User, KeyRound, LogOut, Eye, EyeOff, Loader2 } from "lucide-react";

export default function StudentProfile({ student }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwError(null);
    setPwSuccess(false);
  };

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
      console.error("[StudentProfile] Gagal ganti password:", err);
      setPwError("Gagal menyimpan password baru. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearStudentSession();
    // Reload penuh biar semua state ke-reset & balik ke halaman login
    window.location.href = "/";
  };

  return (
    <div className="space-y-4">
      {/* Kartu Profil */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
            <User size={22} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 truncate">
              {student?.full_name}
            </p>
            <p className="text-xs text-gray-400">@{student?.username}</p>
            <p className="text-xs text-gray-400">
              NIS {student?.nis || "-"} · Kelas{" "}
              {student?.classes?.grade || student?.homeroom_class_id || "-"}
            </p>
          </div>
        </div>
      </section>

      {/* Ganti Password */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setShowPasswordForm((v) => !v);
            resetPasswordForm();
          }}
          className="w-full flex items-center gap-3 p-4 text-left">
          <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center shrink-0">
            <KeyRound size={18} className="text-purple-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700 flex-1">
            Ganti Password
          </span>
          <span className="text-gray-400 text-xs">
            {showPasswordForm ? "Tutup" : "Buka"}
          </span>
        </button>

        {showPasswordForm && (
          <form
            onSubmit={handleChangePassword}
            className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-50">
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
        )}
      </section>

      {/* Keluar */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!confirmLogout ? (
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center gap-3 p-4 text-left">
            <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0">
              <LogOut size={18} className="text-red-600" />
            </div>
            <span className="text-sm font-semibold text-red-600 flex-1">
              Keluar
            </span>
          </button>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-600">Yakin mau keluar?</p>
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
        )}
      </section>
    </div>
  );
}
