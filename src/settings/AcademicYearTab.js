import React, { useState, useEffect } from "react";
import {
  Calendar,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const semesterLabel = (semester) =>
  Number(semester) === 1 ? "Ganjil" : "Genap";

const AcademicYearTab = () => {
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(null); // id periode yang lagi diswitch
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [periods, setPeriods] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    year: "",
    semester: 1,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("year", { ascending: false })
        .order("semester", { ascending: false });

      if (error) throw error;
      setPeriods(data || []);
    } catch (error) {
      console.error("Error loading academic years:", error);
      showMessage("error", "Gagal memuat data tahun ajaran");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const activePeriod = periods.find((p) => p.is_active);

  const switchActive = async (period) => {
    if (period.is_active) return;

    setSwitching(period.id);
    try {
      // Matiin yang lagi aktif
      if (activePeriod) {
        const { error: offError } = await supabase
          .from("academic_years")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", activePeriod.id);
        if (offError) throw offError;
      }

      // Aktifin yang dipilih
      const { error: onError } = await supabase
        .from("academic_years")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("id", period.id);
      if (onError) throw onError;

      showMessage(
        "success",
        `Beralih ke ${period.year} - Semester ${semesterLabel(period.semester)}`,
      );
      await loadPeriods();
    } catch (error) {
      console.error("Error switching period:", error);
      showMessage("error", "Gagal beralih tahun ajaran");
    } finally {
      setSwitching(null);
    }
  };

  const addPeriod = async () => {
    if (!newPeriod.year || !newPeriod.start_date || !newPeriod.end_date) {
      showMessage(
        "error",
        "Tahun ajaran, tanggal mulai, dan selesai wajib diisi!",
      );
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("academic_years").insert({
        year: newPeriod.year,
        semester: Number(newPeriod.semester),
        start_date: newPeriod.start_date,
        end_date: newPeriod.end_date,
        is_active: false,
      });

      if (error) throw error;

      showMessage("success", "Periode tahun ajaran berhasil ditambahkan!");
      setNewPeriod({ year: "", semester: 1, start_date: "", end_date: "" });
      setShowAddForm(false);
      await loadPeriods();
    } catch (error) {
      console.error("Error adding period:", error);
      showMessage(
        "error",
        "Gagal menambahkan periode. Cek apakah kombinasi tahun & semester sudah ada.",
      );
    } finally {
      setSaving(false);
    }
  };

  const generateYearOptions = () => {
    const currentDate = new Date();
    const startYear = 2020;
    const endYear = currentDate.getFullYear() + 2;
    const years = [];

    for (let year = startYear; year <= endYear; year++) {
      years.push(`${year}/${year + 1}`);
    }
    return years;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Message */}
      {message.text && (
        <div
          className={`
          flex items-center gap-3 p-4 rounded-lg
          ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : ""
          }
          ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : ""
          }
        `}>
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Calendar className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Tahun Ajaran & Semester
          </h3>
          <p className="text-sm text-slate-600">
            Kelola periode akademik aktif
          </p>
        </div>
      </div>

      {/* Current Active Period */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <p className="text-sm text-blue-700 font-medium mb-1">
          Periode Aktif Saat Ini
        </p>
        {activePeriod ? (
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-blue-800">
              {activePeriod.year}
            </div>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
              Semester {semesterLabel(activePeriod.semester)}
            </span>
          </div>
        ) : (
          <p className="text-blue-800">Belum ada periode yang aktif</p>
        )}
      </div>

      {/* All Periods */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h4 className="font-semibold text-slate-800">
              Semua Periode Tahun Ajaran
            </h4>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            {showAddForm ? (
              <>
                <X className="w-4 h-4" />
                Batal
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Tambah Periode
              </>
            )}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Tahun Ajaran
                </label>
                <select
                  value={newPeriod.year}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, year: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Pilih Tahun Ajaran</option>
                  {generateYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Semester
                </label>
                <select
                  value={newPeriod.semester}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, semester: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value={1}>Ganjil</option>
                  <option value={2}>Genap</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={newPeriod.start_date}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, start_date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={newPeriod.end_date}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, end_date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={addPeriod}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Periode
                </>
              )}
            </button>
          </div>
        )}

        {/* Period List */}
        {periods.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            Belum ada periode tahun ajaran. Tambahkan periode pertama di atas.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => switchActive(period)}
                disabled={switching !== null || period.is_active}
                className={`
                  text-left px-4 py-3 rounded-lg border-2 transition-all disabled:cursor-default
                  ${
                    period.is_active
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                  }
                `}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    {period.year}
                  </span>
                  {switching === period.id && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                </div>
                <div className="text-sm text-slate-600 mt-0.5">
                  Semester {semesterLabel(period.semester)}
                </div>
                {period.is_active && (
                  <span className="inline-block mt-2 text-xs font-semibold text-blue-700">
                    Aktif Sekarang
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Informasi Penting:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>
                Perubahan periode aktif akan mempengaruhi data absensi, nilai,
                dan jadwal yang mengacu ke tahun ajaran berjalan
              </li>
              <li>
                Pastikan melakukan backup data sebelum mengganti periode aktif
              </li>
              <li>Hanya satu periode yang bisa aktif dalam satu waktu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicYearTab;
