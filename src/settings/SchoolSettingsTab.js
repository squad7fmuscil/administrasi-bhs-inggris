import React, { useState, useEffect } from "react";
import {
  Sliders,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  Clock,
  Bell,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const SchoolSettingsTab = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [settings, setSettings] = useState({
    max_students_per_class: "36",
    attendance_auto_reset_time: "06:00",
    late_threshold_minutes: "15",
    enable_notifications: "true",
    enable_auto_backup: "false",
    backup_time: "23:00",
    default_absent_status: "Alpha",
    enable_parent_notifications: "false",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .like("setting_key", "setting_%");

      if (error) throw error;

      if (data) {
        const loadedSettings = {};
        data.forEach((item) => {
          const key = item.setting_key.replace("setting_", "");
          loadedSettings[key] = item.setting_value;
        });
        setSettings((prev) => ({ ...prev, ...loadedSettings }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showMessage("error", "Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: `setting_${key}`,
        setting_value: value,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        await supabase
          .from("school_settings")
          .upsert(update, { onConflict: "setting_key" });
      }

      showMessage("success", "Pengaturan berhasil disimpan!");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("error", "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Sliders className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Pengaturan Sekolah
          </h3>
          <p className="text-sm text-slate-600">
            Konfigurasi operasional dan preferensi sistem
          </p>
        </div>
      </div>

      {/* Class Settings */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Pengaturan Kelas
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Maksimal Siswa per Kelas
            </label>
            <input
              type="number"
              value={settings.max_students_per_class}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_students_per_class: e.target.value,
                })
              }
              min="20"
              max="50"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500">Rekomendasi: 32-36 siswa</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Status Absen Default
            </label>
            <select
              value={settings.default_absent_status}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_absent_status: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="Alpha">Alpha (Tanpa Keterangan)</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Settings */}
      <div className="space-y-4 pt-6 border-t">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pengaturan Absensi
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Waktu Reset Absensi Otomatis
            </label>
            <input
              type="time"
              value={settings.attendance_auto_reset_time}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  attendance_auto_reset_time: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500">
              Waktu sistem mereset status absensi harian
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Batas Waktu Terlambat (Menit)
            </label>
            <input
              type="number"
              value={settings.late_threshold_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  late_threshold_minutes: e.target.value,
                })
              }
              min="5"
              max="60"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500">
              Waktu toleransi sebelum dianggap terlambat
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4 pt-6 border-t">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Pengaturan Notifikasi
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-800">
                Aktifkan Notifikasi Sistem
              </p>
              <p className="text-sm text-slate-600">
                Tampilkan notifikasi untuk aktivitas penting
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_notifications === "true"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enable_notifications: e.target.checked ? "true" : "false",
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-800">
                Notifikasi ke Orang Tua
              </p>
              <p className="text-sm text-slate-600">
                Kirim notifikasi absensi ke orang tua siswa
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_parent_notifications === "true"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enable_parent_notifications: e.target.checked
                      ? "true"
                      : "false",
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="space-y-4 pt-6 border-t">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Pengaturan Backup
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-800">Auto Backup Harian</p>
              <p className="text-sm text-slate-600">
                Backup database otomatis setiap hari
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_auto_backup === "true"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enable_auto_backup: e.target.checked ? "true" : "false",
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.enable_auto_backup === "true" && (
            <div className="space-y-2 ml-4">
              <label className="block text-sm font-medium text-slate-700">
                Waktu Backup
              </label>
              <input
                type="time"
                value={settings.backup_time}
                onChange={(e) =>
                  setSettings({ ...settings, backup_time: e.target.value })
                }
                className="w-full md:w-64 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={saveSettings}
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
              Simpan Pengaturan
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SchoolSettingsTab;
