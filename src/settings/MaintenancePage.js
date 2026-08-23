// settings/MaintenancePage.js
import React from "react";
import { Wrench } from "lucide-react";
import MaintenanceModeTab from "./MaintenanceModeTab";

function MaintenancePage({ showToast }) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
          <Wrench className="w-5.5 h-5.5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">Maintenance</h3>
          <p className="text-gray-500 text-sm mt-0.5 max-w-md">
            Kelola akses aplikasi dan tampilkan pesan maintenance ke pengguna.
          </p>
        </div>
      </div>

      <MaintenanceModeTab showToast={showToast} />
    </div>
  );
}

export default MaintenancePage;
