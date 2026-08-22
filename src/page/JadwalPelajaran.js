// page/JadwalPelajaran.js
// CRUD jadwal pelajaran per kelas (tabel class_schedules) buat admin/TU.
// Ditampilin di portal siswa lewat StudentJadwal.js — pastiin JAM_SCHEDULE
// di sini SELALU sinkron sama JAM_SCHEDULE di StudentJadwal.js.
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Trash2, X, AlertCircle, CheckCircle } from "lucide-react";

// Jam pelajaran per hari. HARUS SAMA PERSIS kaya JAM_SCHEDULE di
// students/StudentJadwal.js. Kalau jam sekolah berubah, update di DUA
// tempat ini (atau pindahin ke satu file util bareng biar gak dobel).
const JAM_SCHEDULE = {
  Senin: {
    1: { start: "06:30", end: "07:50" },
    2: { start: "07:50", end: "08:30" },
    3: { start: "08:30", end: "09:10" },
    4: { start: "09:10", end: "09:50" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Selasa: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Rabu: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Kamis: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Jumat: {
    1: { start: "06:30", end: "07:05" },
    2: { start: "07:05", end: "07:40" },
    3: { start: "07:40", end: "08:10" },
    4: { start: "08:10", end: "08:40" },
    5: { start: "08:40", end: "09:10" },
    6: { start: "09:40", end: "10:10" },
    7: { start: "10:10", end: "10:40" },
    8: { start: "", end: "" },
    9: { start: "", end: "" },
  },
};

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const ALL_PERIODS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

function getAvailablePeriods(day) {
  const daySchedule = JAM_SCHEDULE[day] || {};
  return ALL_PERIODS.filter((p) => daySchedule[p]?.start);
}

// Cari periode ke berapa dari start_time/end_time yang tersimpan di DB
// (format "HH:MM:SS"), dicocokin ke JAM_SCHEDULE (format "HH:MM").
function findPeriod(day, startTime, endTime) {
  const daySchedule = JAM_SCHEDULE[day];
  if (!daySchedule || !startTime || !endTime) return null;
  const s = startTime.slice(0, 5);
  const e = endTime.slice(0, 5);
  const found = Object.entries(daySchedule).find(
    ([, range]) => range.start === s && range.end === e,
  );
  return found ? found[0] : null;
}

const emptyForm = {
  day: "Senin",
  periods: [],
  subject: "",
  teacher_name: "",
};

export default function JadwalPelajaran() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [newClassInput, setNewClassInput] = useState("");
  const [showAddClass, setShowAddClass] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null); // null = mode tambah
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchSchedules(selectedClass);
    else setSchedules([]);
  }, [selectedClass]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const fetchClasses = async () => {
    try {
      const { data, error: err } = await supabase
        .from("class_schedules")
        .select("class_id");
      if (err) throw err;

      const unique = [...new Set((data || []).map((d) => d.class_id))]
        .filter(Boolean)
        .sort();

      setClasses(unique);
      setSelectedClass((prev) => prev || unique[0] || "");
    } catch (err) {
      setError("Gagal memuat daftar kelas: " + err.message);
    }
  };

  const fetchSchedules = async (classId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("class_schedules")
        .select(
          "id, class_id, day, subject, start_time, end_time, teacher_name",
        )
        .eq("class_id", classId)
        .order("day")
        .order("start_time");

      if (err) throw err;
      setSchedules(data || []);
    } catch (err) {
      setError("Gagal memuat jadwal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = () => {
    const name = newClassInput.trim();
    if (!name) return;
    if (!classes.includes(name)) setClasses([...classes, name].sort());
    setSelectedClass(name);
    setNewClassInput("");
    setShowAddClass(false);
  };

  // Grid: { [day]: { [period]: schedule | undefined } }
  const grid = useMemo(() => {
    const g = {};
    DAYS.forEach((day) => (g[day] = {}));
    schedules.forEach((s) => {
      const period = findPeriod(s.day, s.start_time, s.end_time);
      if (period) g[s.day][period] = s;
    });
    return g;
  }, [schedules]);

  const openAddModal = (day, period) => {
    setEditingSchedule(null);
    setFormData({
      day,
      periods: period ? [period] : [],
      subject: "",
      teacher_name: "",
    });
    setShowModal(true);
  };

  const openEditModal = (schedule) => {
    const period = findPeriod(
      schedule.day,
      schedule.start_time,
      schedule.end_time,
    );
    setEditingSchedule(schedule);
    setFormData({
      day: schedule.day,
      periods: period ? [period] : [],
      subject: schedule.subject || "",
      teacher_name: schedule.teacher_name || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData(emptyForm);
  };

  const togglePeriod = (period) => {
    setFormData((prev) => {
      const has = prev.periods.includes(period);
      return {
        ...prev,
        periods: has
          ? prev.periods.filter((p) => p !== period)
          : [...prev.periods, period].sort((a, b) => a - b),
      };
    });
  };

  const handleCellClick = (day, period) => {
    const existing = grid[day][period];
    if (existing) openEditModal(existing);
    else openAddModal(day, period);
  };

  const handleDelete = async (schedule) => {
    if (
      !window.confirm(`Hapus jadwal "${schedule.subject}" (${schedule.day})?`)
    )
      return;
    try {
      const { error: err } = await supabase
        .from("class_schedules")
        .delete()
        .eq("id", schedule.id);
      if (err) throw err;
      setSuccess("Jadwal berhasil dihapus");
      fetchSchedules(selectedClass);
    } catch (err) {
      setError("Gagal menghapus: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      setError("Mapel wajib diisi");
      return;
    }
    if (formData.periods.length === 0) {
      setError("Pilih minimal satu jam pelajaran");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingSchedule) {
        // Mode edit: cuma 1 periode, update row yang ada.
        const period = formData.periods[0];
        const range = JAM_SCHEDULE[formData.day][period];
        const { error: err } = await supabase
          .from("class_schedules")
          .update({
            day: formData.day,
            subject: formData.subject.trim(),
            teacher_name: formData.teacher_name.trim() || null,
            start_time: `${range.start}:00`,
            end_time: `${range.end}:00`,
          })
          .eq("id", editingSchedule.id);
        if (err) throw err;
        setSuccess("Jadwal berhasil diperbarui");
      } else {
        // Mode tambah: bisa banyak periode sekaligus, tiap periode -> 1 row
        // (biar konsisten sama struktur data existing & numbering "Jam Ke"
        // di portal siswa).
        const rows = formData.periods.map((period) => {
          const range = JAM_SCHEDULE[formData.day][period];
          return {
            class_id: selectedClass,
            day: formData.day,
            subject: formData.subject.trim(),
            teacher_name: formData.teacher_name.trim() || null,
            start_time: `${range.start}:00`,
            end_time: `${range.end}:00`,
          };
        });
        const { error: err } = await supabase
          .from("class_schedules")
          .insert(rows);
        if (err) throw err;
        setSuccess(`${rows.length} jadwal berhasil ditambahkan`);
      }

      closeModal();
      fetchSchedules(selectedClass);
    } catch (err) {
      setError("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const availablePeriodsForForm = getAvailablePeriods(formData.day);
  // Pas mode tambah, jangan tawarin periode yang udah keisi (kecuali yang
  // baru diklik). Pas mode edit, cuma tampilin periode yang lagi dipake.
  const periodOptions = editingSchedule
    ? availablePeriodsForForm
    : availablePeriodsForForm.filter(
        (p) => !grid[formData.day][p] || formData.periods.includes(p),
      );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-gray-800">
          Kelola Jadwal Pelajaran
        </h1>
        <button
          onClick={() => openAddModal(formData.day || "Senin", null)}
          disabled={!selectedClass}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" />
          Tambah Jadwal
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Pilih kelas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3 flex-wrap">
        <label className="text-sm font-semibold text-gray-600">Kelas:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700">
          {classes.length === 0 && <option value="">Belum ada kelas</option>}
          {classes.map((c) => (
            <option key={c} value={c}>
              Kelas {c}
            </option>
          ))}
        </select>

        {!showAddClass ? (
          <button
            onClick={() => setShowAddClass(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            + Kelas baru
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newClassInput}
              onChange={(e) => setNewClassInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddClass()}
              placeholder="mis. 7C"
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm w-24"
            />
            <button
              onClick={handleAddClass}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg">
              Simpan
            </button>
            <button
              onClick={() => {
                setShowAddClass(false);
                setNewClassInput("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600">
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Grid jadwal */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !selectedClass ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm shadow-sm">
          Pilih atau tambah kelas dulu.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="py-2.5 px-3 font-semibold text-left w-14">
                    Jam
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="py-2.5 px-3 font-semibold text-left min-w-[140px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERIODS.map((period) => {
                  const anyDayHasPeriod = DAYS.some(
                    (d) => JAM_SCHEDULE[d][period]?.start,
                  );
                  if (!anyDayHasPeriod) return null;

                  return (
                    <tr key={period} className="border-t border-gray-50">
                      <td className="py-2 px-3 font-bold text-gray-400 align-top">
                        {period}
                      </td>
                      {DAYS.map((day) => {
                        const range = JAM_SCHEDULE[day][period];
                        const disabled = !range?.start;
                        const item = grid[day][period];

                        if (disabled) {
                          return (
                            <td
                              key={day}
                              className="py-2 px-3 text-gray-200 align-top">
                              —
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="py-1.5 px-1.5 align-top">
                            <button
                              onClick={() => handleCellClick(day, period)}
                              className={`w-full text-left rounded-lg px-2.5 py-2 border transition group relative ${
                                item
                                  ? "bg-blue-50 border-blue-100 hover:border-blue-300"
                                  : "bg-gray-50 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                              }`}>
                              {item ? (
                                <>
                                  <p className="font-semibold text-gray-800 leading-tight">
                                    {item.subject}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {item.teacher_name || "-"}
                                  </p>
                                  <p className="text-[10px] text-blue-500 font-medium mt-0.5">
                                    {range.start}–{range.end}
                                  </p>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(item);
                                    }}
                                    className="hidden group-hover:flex absolute top-1 right-1 items-center justify-center w-5 h-5 rounded-md bg-white border border-red-100 text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-3 h-3" />
                                  </span>
                                </>
                              ) : (
                                <p className="text-[11px] text-gray-300 flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> Kosong
                                </p>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal tambah/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">
                {editingSchedule ? "Edit Jadwal" : "Tambah Jadwal"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Hari
                </label>
                <select
                  value={formData.day}
                  disabled={!!editingSchedule}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      day: e.target.value,
                      periods: [],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-400">
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Jam Ke {!editingSchedule && "(bisa pilih lebih dari satu)"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {periodOptions.map((p) => {
                    const active = formData.periods.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        disabled={!!editingSchedule && !active}
                        onClick={() => togglePeriod(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold border transition ${
                          active
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-gray-200 text-gray-500 hover:border-blue-300"
                        }`}>
                        {p}
                      </button>
                    );
                  })}
                  {periodOptions.length === 0 && (
                    <p className="text-xs text-gray-400">
                      Semua jam di hari ini udah keisi.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Mapel
                </label>
                <input
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="mis. IPA"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Guru (opsional)
                </label>
                <input
                  value={formData.teacher_name}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher_name: e.target.value })
                  }
                  placeholder="mis. Syalfa Hauratunisa"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {editingSchedule && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(editingSchedule);
                      closeModal();
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50">
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
