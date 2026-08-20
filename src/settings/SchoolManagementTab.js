import React, { useState, useEffect } from "react";
import {
  Building2,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MapPin,
  Hash,
  User as UserIcon,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const SchoolManagementTab = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [schoolData, setSchoolData] = useState({
    school_name: "",
    npsn: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
    email: "",
    principal_name: "",
    principal_nip: "",
  });

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    setLoading(true);
    try {
      // Load semua setting dengan prefix 'school_'
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .like("setting_key", "school_%");

      if (error) throw error;

      if (data) {
        const settings = {};
        data.forEach((item) => {
          const key = item.setting_key.replace("school_", "");
          settings[key] = item.setting_value;
        });
        setSchoolData((prev) => ({ ...prev, ...settings }));
      }
    } catch (error) {
      console.error("Error loading school data:", error);
      showMessage("error", "Gagal memuat data sekolah");
    } finally {
      setLoading(false);
    }
  };

  const saveSchoolData = async () => {
    if (!schoolData.school_name) {
      showMessage("error", "Nama sekolah harus diisi!");
      return;
    }

    setSaving(true);
    try {
      // Simpan setiap field sebagai setting terpisah
      const updates = Object.entries(schoolData).map(([key, value]) => ({
        setting_key: `school_${key}`,
        setting_value: value || "",
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        await supabase
          .from("school_settings")
          .upsert(update, { onConflict: "setting_key" });
      }

      showMessage("success", "Data sekolah berhasil disimpan!");
    } catch (error) {
      console.error("Error saving school data:", error);
      showMessage("error", "Gagal menyimpan data sekolah");
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
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
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
        <Building2 className="w-6 h-6 text-indigo-600" />
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Data Sekolah</h3>
          <p className="text-sm text-slate-600">
            Kelola informasi identitas sekolah
          </p>
        </div>
      </div>

      {/* School Identity */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Identitas Sekolah
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Nama Sekolah *
            </label>
            <input
              type="text"
              value={schoolData.school_name}
              onChange={(e) =>
                setSchoolData({ ...schoolData, school_name: e.target.value })
              }
              placeholder="SMP Negeri 1 Bandung"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              <Hash className="w-4 h-4 inline mr-1" />
              NPSN
            </label>
            <input
              type="text"
              value={schoolData.npsn}
              onChange={(e) =>
                setSchoolData({ ...schoolData, npsn: e.target.value })
              }
              placeholder="20219345"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Nomor Telepon
            </label>
            <input
              type="tel"
              value={schoolData.phone}
              onChange={(e) =>
                setSchoolData({ ...schoolData, phone: e.target.value })
              }
              placeholder="022-1234567"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Email Sekolah
            </label>
            <input
              type="email"
              value={schoolData.email}
              onChange={(e) =>
                setSchoolData({ ...schoolData, email: e.target.value })
              }
              placeholder="smpn1bandung@gmail.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 pt-6 border-t">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Alamat Sekolah
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Alamat Lengkap
            </label>
            <textarea
              value={schoolData.address}
              onChange={(e) =>
                setSchoolData({ ...schoolData, address: e.target.value })
              }
              placeholder="Jl. Pendidikan No. 123"
              rows="3"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Kota/Kabupaten
            </label>
            <input
              type="text"
              value={schoolData.city}
              onChange={(e) =>
                setSchoolData({ ...schoolData, city: e.target.value })
              }
              placeholder="Bandung"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Provinsi
            </label>
            <input
              type="text"
              value={schoolData.province}
              onChange={(e) =>
                setSchoolData({ ...schoolData, province: e.target.value })
              }
              placeholder="Jawa Barat"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Kode Pos
            </label>
            <input
              type="text"
              value={schoolData.postal_code}
              onChange={(e) =>
                setSchoolData({ ...schoolData, postal_code: e.target.value })
              }
              placeholder="40123"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Principal Info */}
      <div className="space-y-4 pt-6 border-t">
        <h4 className="font-semibold text-slate-700 flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          Kepala Sekolah
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Nama Kepala Sekolah
            </label>
            <input
              type="text"
              value={schoolData.principal_name}
              onChange={(e) =>
                setSchoolData({ ...schoolData, principal_name: e.target.value })
              }
              placeholder="Drs. Ahmad Subarjo, M.Pd"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              NIP Kepala Sekolah
            </label>
            <input
              type="text"
              value={schoolData.principal_nip}
              onChange={(e) =>
                setSchoolData({ ...schoolData, principal_nip: e.target.value })
              }
              placeholder="196501011990031001"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={saveSchoolData}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Simpan Data Sekolah
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SchoolManagementTab;
