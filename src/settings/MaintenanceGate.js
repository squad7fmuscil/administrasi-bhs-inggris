// MaintenanceGate.js
// Bungkus route/App content pake komponen ini. Taro DI ATAS routing utama,
// SETELAH currentUser udah kebaca dari session (supaya tau role & id-nya).
//
// Cara pake di App.js (contoh):
//
//   import MaintenanceGate from "./MaintenanceGate";
//   ...
//   <MaintenanceGate currentUser={currentUser}>
//     <Routes>...</Routes>
//   </MaintenanceGate>
//
// currentUser minimal punya: { id, role }

import React, { useState, useEffect } from "react";
import { Wrench } from "lucide-react";
import { supabase } from "../supabaseClient";
import { clearStudentSession } from "../utils/studentSession";

const CHECK_INTERVAL_MS = 30000; // re-check tiap 30 detik biar responsif kalau admin toggle pas ada yang lagi buka app

function MaintenanceGate({ currentUser, children }) {
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState(
    "Aplikasi sedang dalam maintenance. Kami akan kembali segera!",
  );

  useEffect(() => {
    let cancelled = false;

    const checkMaintenance = async () => {
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
        if (cancelled) return;

        const settings = {};
        data?.forEach((item) => {
          settings[item.setting_key] = item.setting_value;
        });

        const isActive =
          settings.maintenance_mode === "true" ||
          settings.maintenance_mode === true;

        if (!isActive) {
          setBlocked(false);
          setChecking(false);
          return;
        }

        setMessage(
          settings.maintenance_message ||
            "Aplikasi sedang dalam maintenance. Kami akan kembali segera!",
        );

        // Admin selalu boleh masuk
        if (currentUser?.role === "admin") {
          setBlocked(false);
          setChecking(false);
          return;
        }

        // Cek whitelist
        let whitelist = [];
        if (settings.maintenance_whitelist) {
          try {
            whitelist = JSON.parse(settings.maintenance_whitelist);
          } catch (e) {
            whitelist = [];
          }
        }

        const isWhitelisted = whitelist.some((u) => u.id === currentUser?.id);
        setBlocked(!isWhitelisted);
        setChecking(false);
      } catch (error) {
        console.error("Error checking maintenance status:", error);
        // Kalau gagal cek, jangan block user (fail-open) biar app tetep bisa dipake
        if (!cancelled) {
          setBlocked(false);
          setChecking(false);
        }
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.id, currentUser?.role]);

  // Selagi ngecek pertama kali, jangan flash konten dulu
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (blocked) {
    const handleReload = () => {
      try {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("rememberMe");
        sessionStorage.removeItem("currentUser");
        clearStudentSession();
      } catch (e) {
        console.error("Error clearing session:", e);
      }
      window.location.reload();
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Sedang Maintenance
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          <p className="text-gray-400 text-xs mt-6 mb-6">
            Mohon maaf atas ketidaknyamanannya 🙏
          </p>
          <button
            onClick={handleReload}
            className="px-6 py-3 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            Reload
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default MaintenanceGate;
