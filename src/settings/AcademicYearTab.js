import React, { useState, useEffect } from "react";
import {
  Calendar,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const AcademicYearTab = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [currentYear, setCurrentYear] = useState("");
  const [currentSemester, setCurrentSemester] = useState("Ganjil");
  const [yearHistory, setYearHistory] = useState([]);

  // Load settings dari database
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Ambil tahun ajaran aktif
      const { data: yearData } = await supabase
        .from("school_settings")
        .select("setting_value")
        .eq("setting_key", "active_academic_year")
        .maybeSingle();

      // Ambil semester aktif
      const { data: semesterData } = await supabase
        .from("school_settings")
        .select("setting_value")
        .eq("setting_key", "active_semester")
        .maybeSingle();

      if (yearData) setCurrentYear(yearData.setting_value);
      if (semesterData) setCurrentSemester(semesterData.setting_value);

      // Load history tahun ajaran (dari table students/attendance)
      await loadYearHistory();
    } catch (error) {
      console.error("Error loading settings:", error);
      showMessage("error", "Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const loadYearHistory = async () => {
    try {
      // Ambil unique academic_year dari table students
      const { data } = await supabase
        .from("students")
        .select("academic_year")
        .order("academic_year", { ascending: false });

      if (data) {
        const uniqueYears = [
          ...new Set(data.map((s) => s.academic_year)),
        ].filter(Boolean);
        setYearHistory(uniqueYears);
      }
    } catch (error) {
      console.error("Error loading year history:", error);
    }
  };

  const saveSettings = async () => {
    if (!currentYear) {
      showMessage("error", "Tahun ajaran harus diisi!");
      return;
    }

    setSaving(true);
    try {
      // Upsert tahun ajaran
      await supabase.from("school_settings").upsert(
        {
          setting_key: "active_academic_year",
          setting_value: currentYear,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      );

      // Upsert semester
      await supabase.from("school_settings").upsert(
        {
          setting_key: "active_semester",
          setting_value: currentSemester,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      );

      showMessage("success", "Pengaturan berhasil disimpan!");
      await loadYearHistory();
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("error", "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const switchToYear = async (year) => {
    setCurrentYear(year);
    // Auto save setelah switch
    try {
      await supabase.from("school_settings").upsert(
        {
          setting_key: "active_academic_year",
          setting_value: year,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      );

      showMessage("success", `Beralih ke tahun ajaran ${year}`);
    } catch (error) {
      showMessage("error", "Gagal beralih tahun ajaran");
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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

      {/* Current Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tahun Ajaran */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Tahun Ajaran Aktif
          </label>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Pilih Tahun Ajaran</option>
            {generateYearOptions().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Semester */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Semester Aktif
          </label>
          <select
            value={currentSemester}
            onChange={(e) => setCurrentSemester(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Simpan Pengaturan
            </>
          )}
        </button>
      </div>

      {/* Year History */}
      {yearHistory.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-600" />
            <h4 className="font-semibold text-slate-800">
              Riwayat Tahun Ajaran
            </h4>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {yearHistory.map((year) => (
              <button
                key={year}
                onClick={() => switchToYear(year)}
                className={`
                  px-4 py-3 rounded-lg border-2 font-medium transition-all
                  ${
                    year === currentYear
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-slate-50"
                  }
                `}>
                {year}
                {year === currentYear && (
                  <span className="ml-2 text-xs">(Aktif)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Informasi Penting:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>
                Perubahan tahun ajaran akan mempengaruhi semua data siswa dan
                absensi
              </li>
              <li>
                Pastikan melakukan backup data sebelum mengganti tahun ajaran
              </li>
              <li>Riwayat tahun ajaran diambil dari data siswa yang ada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicYearTab;
