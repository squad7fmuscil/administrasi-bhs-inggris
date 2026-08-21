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

        if (active) {
          setStudent(userData);
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
