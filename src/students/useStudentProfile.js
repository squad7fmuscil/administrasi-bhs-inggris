// students/useStudentProfile.js
// ========================================================================
// Hook bareng: ambil profil siswa terbaru dari database berdasarkan sesi
// login (localStorage/cookie). Dipakai di StudentDashboard, StudentJadwal,
// StudentPresensi, StudentLainnya — biar logic sesi cuma ada di 1 tempat.
// ========================================================================
import { useState, useEffect } from "react";
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

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      const session = getStudentSession();
      if (!session) {
        console.error(
          "[useStudentProfile] Sesi gak ketemu di localStorage maupun cookie.",
        );
        if (active) {
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
          if (active) {
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

        if (active) {
          setStudent({
            ...userData,
            studentRecordId: studentRow?.id || null,
            nis: studentRow?.nis || null,
            classId: studentRow?.class_id || null,
            kelas: studentRow?.class_id || null,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("[useStudentProfile] Gagal ambil profil siswa:", err);
        if (active) {
          setError("FETCH_ERROR");
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return { student, loading, error };
}
