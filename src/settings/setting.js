// settings/Setting.js - YANG INI HARUS DIPAKE!
import React, { useState } from "react";
import {
  Settings,
  User,
  Calendar,
  Building2,
  Sliders,
  Wrench,
} from "lucide-react";
import ProfileTab from "./ProfileTab";
import AcademicYearTab from "./AcademicYearTab";
import SchoolManagementTab from "./SchoolManagementTab";
import SchoolSettingsTab from "./SchoolSettingsTab";
import SystemTab from "./SystemTab";

const Setting = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profil Saya", icon: User },
    { id: "academic", label: "Tahun Ajaran", icon: Calendar },
    { id: "school", label: "Data Sekolah", icon: Building2 },
    { id: "settings", label: "Pengaturan Sekolah", icon: Sliders },
    { id: "system", label: "Sistem", icon: Wrench },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />;
      case "academic":
        return <AcademicYearTab />;
      case "school":
        return <SchoolManagementTab />;
      case "settings":
        return <SchoolSettingsTab />;
      case "system":
        return <SystemTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
        </div>
        <p className="text-gray-600">Kelola profil dan konfigurasi aplikasi</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap
                    transition-all duration-200 border-b-2 flex-shrink-0
                    ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    }
                  `}>
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-[400px]">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default Setting;
