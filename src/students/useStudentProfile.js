// students/useStudentProfile.js
// ========================================================================
// Hook bareng: ambil profil siswa terbaru dari database berdasarkan sesi
// login (localStorage/cookie). Dipakai di StudentDashboard, StudentJadwal,
// StudentPresensi, StudentLainnya — biar logic sesi cuma ada di 1 tempat.
//
// TAMBAHAN: sekarang juga ambil data profil tambahan (alamat, no HP,
// data ortu/wali, agama) dari tabel terpisah `student_profile_details`
// (lihat student_profile_details.sql). Dipisah dari `users` biar gak
// ngubah skema yang udah ada. Hook ini juga expose `refetch`, dipake
// abis form profil tambahan berhasil disimpen biar UI langsung update
// tanpa perlu reload halaman.
// ========================================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  getStudentSession,
  clearStudentSession,
} from "../utils/studentSession";

export default function useStudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  // error: null | "NO_SESSION" | "FETCH_ERROR"
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const session = getStudentSession();
    if (!session) {
      console.error(
        "[useStudentProfile] Sesi gak ketemu di localStorage maupun cookie.",
      );
      if (mountedRef.current) {
        setError("NO_SESSION");
        setLoading(false);
      }
      return;
    }

    try {
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("id, username, full_name, homeroom_class_id, role, is_active")
        .eq("id", session.id)
        .eq("role", "student")
        .maybeSingle();

      if (userErr) throw userErr;

      if (!userData || !userData.is_active) {
        console.error(
          "[useStudentProfile] Session ada tapi data siswa gak ketemu / non-aktif di database. session.id:",
          session.id,
        );
        clearStudentSession();
        if (mountedRef.current) {
          setError("NO_SESSION");
          setLoading(false);
        }
        return;
      }

      // Catatan penting: `userData.id` di atas adalah users.id (dipake
      // buat login & buat FK di piket_schedule.siswa_id). TAPI tabel
      // "attendance" FK-nya ke students.id, yang beda dari users.id.
      // Query tambahan ini ambil data dari tabel "students" lewat
      // students.user_id — sekalian ambil `nis` dan nama kelas
      // (classes.grade, di-join lewat students.class_id) di query yang
      // sama, biar gak nambah round-trip lagi. Field `id` yang lama
      // TETAP users.id, gak diubah, biar gak ganggu tempat lain yang
      // masih pake itu (misal piket_schedule).
      const { data: studentRow, error: studentRowErr } = await supabase
        .from("students")
        .select("id, nis, class_id, classes:class_id (grade)")
        .eq("user_id", userData.id)
        .maybeSingle();

      if (studentRowErr) {
        console.error(
          "[useStudentProfile] Gagal ambil data dari tabel students:",
          studentRowErr,
        );
      }

      // ===== TAMBAHAN: data profil tambahan (alamat, no HP, dst) =====
      // Wajar null / row belum ada kalau siswa belum pernah isi form-nya
      // (maybeSingle return null, bukan error).
      const { data: detailRow, error: detailErr } = await supabase
        .from("student_profile_details")
        .select("alamat, no_hp, nama_ortu, no_hp_ortu")
        .eq("student_id", userData.id)
        .maybeSingle();

      if (detailErr) {
        console.error(
          "[useStudentProfile] Gagal ambil detail profil tambahan:",
          detailErr,
        );
      }

      if (mountedRef.current) {
        setStudent({
          ...userData,
          studentRecordId: studentRow?.id || null,
          nis: studentRow?.nis || null,
          classId: studentRow?.class_id || null,
          kelas: studentRow?.class_id || null,
          alamat: detailRow?.alamat || "",
          no_hp: detailRow?.no_hp || "",
          nama_ortu: detailRow?.nama_ortu || "",
          no_hp_ortu: detailRow?.no_hp_ortu || "",
        });
        setLoading(false);
      }
    } catch (err) {
      console.error("[useStudentProfile] Gagal ambil profil siswa:", err);
      if (mountedRef.current) {
        setError("FETCH_ERROR");
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { student, loading, error, refetch: load };
}
