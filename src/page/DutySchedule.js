import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  ClipboardCheck,
  Shuffle,
  Save,
  Trash2,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ⚠️ ASUMSI STRUKTUR TABEL - SESUAIKAN KALAU BEDA DI SUPABASE KAMU:
//
// Pakai tabel "students" dan "academic_years" yang sama seperti SeatingChart.js
//
// Tabel "duty_schedules" (BARU, perlu dibuat manual di Supabase):
//   CREATE TABLE duty_schedules (
//     id uuid primary key default gen_random_uuid(),
//     class_id text not null,
//     academic_year text not null,
//     semester text not null,       -- "ganjil" / "genap"
//     layout jsonb not null default '{}'::jsonb, -- { "Senin": [student_id, ...], ... }
//     updated_at timestamptz default now(),
//     unique (class_id, academic_year, semester)
//   );

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const EMPTY_LAYOUT = Object.fromEntries(DAYS.map((d) => [d, []]));

export default function DutySchedule({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [students, setStudents] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState(""); // "ganjil" | "genap"

  const [layout, setLayout] = useState(EMPTY_LAYOUT); // { "Senin": [student_id, ...], ... }
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success" | "error", message: string }

  const [draggedId, setDraggedId] = useState(null);

  // Toast otomatis hilang setelah 3 detik
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const classId = currentUser?.homeroom_class_id;

  // ===== LOAD DATA =====
  useEffect(() => {
    if (!classId) {
      setError(
        "Anda belum memiliki kelas yang di-assign. Hubungi administrator.",
      );
      setLoading(false);
      return;
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const init = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Ambil tahun ajaran aktif
      const { data: activeYear, error: yearError } = await supabase
        .from("academic_years")
        .select("year, semester")
        .eq("is_active", true)
        .single();

      if (yearError) throw yearError;

      const yearStr = activeYear.year;
      const semesterStr =
        Number(activeYear.semester) === 1 ? "ganjil" : "genap";
      setAcademicYear(yearStr);
      setSemester(semesterStr);

      // 2. Ambil daftar siswa di kelas ini (kelas + tahun ajaran + masih aktif)
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, full_name, nis")
        .eq("class_id", classId)
        .eq("academic_year", yearStr)
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      if (studentError) throw studentError;
      setStudents(studentData || []);

      // 3. Ambil jadwal piket yang sudah tersimpan (kalau ada)
      const { data: chart, error: chartError } = await supabase
        .from("duty_schedules")
        .select("*")
        .eq("class_id", classId)
        .eq("academic_year", yearStr)
        .eq("semester", semesterStr)
        .maybeSingle();

      if (chartError) throw chartError;

      if (chart?.layout && Object.keys(chart.layout).length > 0) {
        setLayout({ ...EMPTY_LAYOUT, ...chart.layout });
      } else {
        setLayout(EMPTY_LAYOUT);
      }

      setDirty(false);
    } catch (err) {
      console.error("Error loading duty schedule:", err);
      setError(err.message || "Gagal memuat jadwal piket");
    } finally {
      setLoading(false);
    }
  };

  // ===== DERIVED DATA =====
  const assignedIds = useMemo(
    () => new Set(Object.values(layout).flat()),
    [layout],
  );
  const unassignedStudents = useMemo(
    () => students.filter((s) => !assignedIds.has(s.id)),
    [students, assignedIds],
  );
  const studentMap = useMemo(() => {
    const map = {};
    students.forEach((s) => (map[s.id] = s));
    return map;
  }, [students]);

  // ===== DRAG & DROP HANDLERS =====
  const handleDragStart = useCallback((studentId) => {
    setDraggedId(studentId);
  }, []);

  const removeFromLayout = (prev, studentId) => {
    const next = {};
    for (const day of DAYS) {
      next[day] = (prev[day] || []).filter((id) => id !== studentId);
    }
    return next;
  };

  const handleDropOnDay = useCallback(
    (e, day) => {
      e.preventDefault();
      if (!draggedId) return;
      setLayout((prev) => {
        const next = removeFromLayout(prev, draggedId);
        next[day] = [...next[day], draggedId];
        return next;
      });
      setDirty(true);
      setDraggedId(null);
    },
    [draggedId],
  );

  const handleDropOnUnassigned = useCallback(
    (e) => {
      e.preventDefault();
      if (!draggedId) return;
      setLayout((prev) => removeFromLayout(prev, draggedId));
      setDirty(true);
      setDraggedId(null);
    },
    [draggedId],
  );

  const allowDrop = (e) => e.preventDefault();

  // ===== ACTIONS =====
  const handleDistribute = () => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const next = Object.fromEntries(DAYS.map((d) => [d, []]));
    shuffled.forEach((s, i) => {
      next[DAYS[i % DAYS.length]].push(s.id);
    });
    setLayout(next);
    setDirty(true);
  };

  const handleClear = () => {
    if (!window.confirm("Kosongkan semua jadwal piket?")) return;
    setLayout(EMPTY_LAYOUT);
    setDirty(true);
  };

  const removeStudent = (day, studentId) => {
    setLayout((prev) => ({
      ...prev,
      [day]: prev[day].filter((id) => id !== studentId),
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error: saveError } = await supabase.from("duty_schedules").upsert(
        {
          class_id: classId,
          academic_year: academicYear,
          semester,
          layout,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "class_id,academic_year,semester" },
      );

      if (saveError) throw saveError;
      setDirty(false);
      setToast({ type: "success", message: "Jadwal piket berhasil disimpan" });
    } catch (err) {
      console.error("Error saving duty schedule:", err);
      const msg = err.message || "Gagal menyimpan jadwal piket";
      setError(msg);
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}>
          {toast.type === "success" ? (
            <Save size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ClipboardCheck size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Jadwal Piket
              </h2>
              <p className="text-sm text-gray-500">
                Kelas {classId} • {academicYear} (
                {semester === "ganjil" ? "Ganjil" : "Genap"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDistribute}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition">
              <Shuffle size={15} />
              Bagi Rata
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition">
              <Trash2 size={15} />
              Kosongkan
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {dirty ? "Simpan Perubahan" : "Tersimpan"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-3 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 5 kolom hari */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
          <div className="flex gap-4 min-w-[720px]">
            {DAYS.map((day) => (
              <div
                key={day}
                onDragOver={allowDrop}
                onDrop={(e) => handleDropOnDay(e, day)}
                className="flex-1 flex flex-col gap-2">
                <div className="text-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {day}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({(layout[day] || []).length})
                  </span>
                </div>
                <div className="flex-1 min-h-[300px] bg-amber-50/60 border-2 border-dashed border-amber-200 rounded-lg p-2 space-y-2">
                  {(layout[day] || []).map((studentId) => {
                    const student = studentMap[studentId];
                    if (!student) return null;
                    return (
                      <div
                        key={studentId}
                        draggable
                        onDragStart={() => handleDragStart(studentId)}
                        className="group flex items-center justify-between gap-1 px-2 py-1.5 bg-white border border-amber-200 rounded-md text-xs cursor-grab active:cursor-grabbing shadow-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {student.full_name}
                          </p>
                        </div>
                        <button
                          onClick={() => removeStudent(day, studentId)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition shrink-0"
                          aria-label={`Hapus ${student.full_name} dari ${day}`}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  {(layout[day] || []).length === 0 && (
                    <p className="text-[10px] text-gray-300 text-center pt-4">
                      Seret siswa ke sini
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daftar siswa belum ditugaskan */}
        <div
          className="bg-white rounded-xl border border-gray-200 p-4"
          onDragOver={allowDrop}
          onDrop={handleDropOnUnassigned}>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">
              Belum Ditugaskan ({unassignedStudents.length})
            </h3>
          </div>

          {unassignedStudents.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              Semua siswa sudah dijadwalkan 🎉
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {unassignedStudents.map((s) => (
                <div
                  key={s.id}
                  draggable
                  onDragStart={() => handleDragStart(s.id)}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm cursor-grab active:cursor-grabbing transition">
                  <p className="font-medium text-gray-800 leading-tight">
                    {s.full_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
