// settings/MaintenanceModeTab.js
import React, { useState, useEffect } from "react";
import { Power, Check, Trash2, Users, UserPlus } from "lucide-react";
import { supabase } from "../supabaseClient";

const MaintenanceModeTab = ({ showToast }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [customMessage, setCustomMessage] = useState(
    "Aplikasi sedang dalam maintenance. Kami akan kembali segera!",
  );
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Whitelist state
  const [allUsers, setAllUsers] = useState([]);
  const [whitelistUsers, setWhitelistUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showWhitelistDetails, setShowWhitelistDetails] = useState(false);

  useEffect(() => {
    loadMaintenanceSettings();
    loadAllUsers();
  }, []);

  const loadMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "maintenance_mode",
          "maintenance_message",
          "maintenance_whitelist",
        ]);

      if (error) throw error;

      const settings = {};
      data?.forEach((item) => {
        settings[item.setting_key] = item.setting_value;
      });

      setMaintenanceMode(
        settings.maintenance_mode === "true" ||
          settings.maintenance_mode === true,
      );
      setCustomMessage(
        settings.maintenance_message ||
          "Aplikasi sedang dalam maintenance. Kami akan kembali segera!",
      );

      if (settings.maintenance_whitelist) {
        try {
          const parsed = JSON.parse(settings.maintenance_whitelist);
          setWhitelistUsers(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setWhitelistUsers([]);
        }
      }
    } catch (error) {
      console.error("Error loading maintenance settings:", error);
      showToast?.("Gagal memuat pengaturan maintenance", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load semua user aktif, kecuali admin (admin selalu bisa akses tanpa whitelist)
  const loadAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, role, is_active")
        .eq("is_active", true)
        .neq("role", "admin")
        .order("full_name", { ascending: true });

      if (error) throw error;

      setAllUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      showToast?.("Gagal memuat daftar user", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggle = async () => {
    setIsSaving(true);
    try {
      const newState = !maintenanceMode;

      const { error } = await supabase.from("school_settings").upsert(
        {
          setting_key: "maintenance_mode",
          setting_value: newState ? "true" : "false",
        },
        { onConflict: "setting_key" },
      );

      if (error) throw error;

      setMaintenanceMode(newState);
      showToast?.(
        newState ? "🔴 Maintenance Mode AKTIF" : "🟢 Aplikasi AKTIF",
        "success",
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      showToast?.("Gagal mengubah mode maintenance", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMessageChange = async (e) => {
    const msg = e.target.value;
    setCustomMessage(msg);

    try {
      const { error } = await supabase.from("school_settings").upsert(
        {
          setting_key: "maintenance_message",
          setting_value: msg,
        },
        { onConflict: "setting_key" },
      );

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error updating message:", error);
      showToast?.("Gagal menyimpan pesan", "error");
    }
  };

  const handleAddUserFromDropdown = async () => {
    if (!selectedUserId) {
      showToast?.("Pilih user terlebih dahulu", "warning");
      return;
    }

    const user = allUsers.find((u) => u.id === selectedUserId);
    if (!user) return;

    if (whitelistUsers.some((u) => u.id === user.id)) {
      showToast?.(`${user.full_name} sudah ada di whitelist`, "info");
      setSelectedUserId("");
      return;
    }

    const newWhitelist = [
      ...whitelistUsers,
      {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
      },
    ];

    await saveWhitelist(newWhitelist);
    setSelectedUserId("");
  };

  const handleRemoveUser = async (userId) => {
    const newWhitelist = whitelistUsers.filter((u) => u.id !== userId);
    await saveWhitelist(newWhitelist);
  };

  const saveWhitelist = async (whitelist) => {
    try {
      const { error } = await supabase.from("school_settings").upsert(
        {
          setting_key: "maintenance_whitelist",
          setting_value: JSON.stringify(whitelist),
        },
        { onConflict: "setting_key" },
      );

      if (error) throw error;

      setWhitelistUsers(whitelist);
      showToast?.("✅ Whitelist berhasil diperbarui", "success");

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving whitelist:", error);
      showToast?.("Gagal menyimpan whitelist", "error");
    }
  };

  const availableUsers = allUsers.filter(
    (user) => !whitelistUsers.some((u) => u.id === user.id),
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Badge */}
      <div className="p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-100">
        <p className="text-xs sm:text-sm text-blue-700 mb-2">
          Status Aplikasi:
        </p>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${
              maintenanceMode ? "bg-rose-600 animate-pulse" : "bg-green-500"
            }`}></div>
          <span
            className={`font-bold text-base sm:text-lg ${
              maintenanceMode ? "text-rose-700" : "text-green-600"
            }`}>
            {maintenanceMode ? "🔴 MAINTENANCE" : "🟢 AKTIF"}
          </span>
          <span className="text-xs text-blue-600 ml-2">
            {maintenanceMode
              ? `${whitelistUsers.length} user bisa akses`
              : "Semua user bisa akses"}
          </span>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <p className="font-semibold text-blue-800 text-sm sm:text-base">
              Aktifkan Mode Maintenance
            </p>
            <p className="text-xs sm:text-sm text-blue-600 mt-1">
              Ketika diaktifkan, hanya user di whitelist + admin yang bisa akses
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isSaving}
            className={`relative w-14 h-8 sm:w-16 sm:h-9 rounded-full transition-all flex-shrink-0 ${
              maintenanceMode ? "bg-rose-600" : "bg-gray-300"
            } ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg"}`}
            aria-label={maintenanceMode ? "Nonaktifkan" : "Aktifkan"}>
            <div
              className={`absolute top-1 left-1 sm:top-1.5 sm:left-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full transition-all flex items-center justify-center shadow-md ${
                maintenanceMode ? "translate-x-5 sm:translate-x-7" : ""
              }`}>
              <Power className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600" />
            </div>
          </button>
        </div>
      </div>

      {/* Custom Message */}
      {maintenanceMode && (
        <div className="p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
          <label className="block text-sm font-semibold text-amber-800 mb-2">
            📝 Pesan Maintenance
          </label>
          <textarea
            value={customMessage}
            onChange={handleMessageChange}
            rows="4"
            maxLength={500}
            className="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm min-h-[120px]"
            placeholder="Tulis pesan untuk user yang melihat halaman maintenance..."
          />
          <p className="text-xs text-amber-600 mt-2">
            {customMessage.length}/500 karakter
          </p>
        </div>
      )}

      {/* Whitelist */}
      {maintenanceMode && (
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
              <h3 className="font-semibold text-purple-800 text-sm sm:text-base">
                Whitelist User
              </h3>
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {whitelistUsers.length} user
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingUsers}
                className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-h-[44px] disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="">
                  {loadingUsers ? "Loading..." : "-- Pilih User --"}
                </option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddUserFromDropdown}
                disabled={!selectedUserId || loadingUsers}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium min-h-[44px]">
                <UserPlus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>

            {availableUsers.length === 0 && !loadingUsers && (
              <p className="text-xs text-purple-600 mt-2 text-center">
                Semua user sudah ada di whitelist
              </p>
            )}
          </div>

          {whitelistUsers.length > 0 && (
            <div className="p-3 sm:p-4 bg-green-50/70 rounded-lg border border-green-200">
              <button
                onClick={() => setShowWhitelistDetails(!showWhitelistDetails)}
                className="w-full flex items-center justify-between hover:bg-green-100 p-2 rounded-lg transition min-h-[44px]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-green-800 text-sm sm:text-base">
                    ✅ User yang Diwhitelist
                  </h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {whitelistUsers.length} user
                  </span>
                </div>
                <span className="text-green-600 text-xs">
                  {showWhitelistDetails ? "▲ Sembunyikan" : "▼ Tampilkan"}
                </span>
              </button>

              {showWhitelistDetails && (
                <div className="space-y-2 mt-3">
                  {whitelistUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate text-sm sm:text-base">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{user.username}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition text-red-600 ml-2 flex-shrink-0"
                        aria-label={`Hapus ${user.full_name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {maintenanceMode && (
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            🖼️ Preview Halaman Maintenance:
          </p>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm text-center border border-gray-200">
            <div className="text-4xl sm:text-6xl mb-2 sm:mb-3">🔧</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
              Sedang Maintenance
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed px-2">
              {customMessage}
            </p>
            <p className="text-gray-400 text-xs mt-3 sm:mt-4">
              Mohon maaf atas ketidaknyamanannya 🙏
            </p>
          </div>
        </div>
      )}

      {/* Save Indicator */}
      {saved && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 sm:p-4 bg-green-50 border border-green-300 rounded-lg shadow-lg flex items-center gap-2 animate-pulse z-50">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          <span className="text-green-700 font-semibold text-xs sm:text-sm">
            ✅ Pengaturan disimpan
          </span>
        </div>
      )}
    </div>
  );
};

export default MaintenanceModeTab;
