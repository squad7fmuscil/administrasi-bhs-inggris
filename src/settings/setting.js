// settings/Setting.js - YANG INI HARUS DIPAKE!
import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Calendar,
  Users,
  UserCog,
  ServerCog,
  Wrench,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import ProfileTab from "./ProfileTab";
import AcademicYearTab from "./AcademicYearTab";
import ActiveUsersTab from "./ActiveUsersTab";
import UserManagementTab from "./UserManagementTab";
import SystemTab from "./SystemTab";
import MaintenancePage from "./MaintenancePage";

const Setting = ({ showToast, currentUser, initialTab = null }) => {
  // null = tampilan grid card menu, selain itu = tab yang lagi dibuka
  // initialTab dipakai kalau Setting dibuka langsung nuju tab tertentu,
  // misal dari tombol "Akun > Profile" di BottomNav (lihat App.js)
  const [activeTab, setActiveTab] = useState(initialTab);
  // Loading global buat tab yang butuh (ex: UserManagementTab pas assign wali kelas)
  const [tabLoading, setTabLoading] = useState(false);

  // Kalau initialTab berubah (misal user klik "Akun > Profile" lagi padahal
  // Setting-nya udah kebuka), ikutin ke tab itu.
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const menus = [
    {
      id: "profile",
      label: "Profil Saya",
      description: "Kelola informasi akun dan keamanan Anda",
      icon: User,
      color: "blue",
    },
    {
      id: "activeusers",
      label: "Active Users",
      description: "Pantau pengguna yang sedang aktif",
      icon: Users,
      color: "rose",
    },
    {
      id: "academic",
      label: "Tahun Ajaran",
      description: "Atur tahun ajaran yang sedang aktif",
      icon: Calendar,
      color: "purple",
    },
    {
      id: "usermanagement",
      label: "Management User",
      description: "Kelola akun, role, dan akses pengguna",
      icon: UserCog,
      color: "indigo",
    },
    {
      id: "system",
      label: "Management System",
      description: "Konfigurasi tingkat sistem aplikasi",
      icon: ServerCog,
      color: "cyan",
    },
    {
      id: "maintenance",
      label: "Maintenance",
      description: "Mode maintenance dan perawatan aplikasi",
      icon: Wrench,
      color: "orange",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 group-hover:bg-blue-200",
    purple: "bg-purple-100 text-purple-600 group-hover:bg-purple-200",
    rose: "bg-rose-100 text-rose-600 group-hover:bg-rose-200",
    indigo: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200",
    cyan: "bg-cyan-100 text-cyan-600 group-hover:bg-cyan-200",
    orange: "bg-orange-100 text-orange-600 group-hover:bg-orange-200",
  };

  const cardColorClasses = {
    blue: "bg-blue-50 border-blue-100 hover:border-blue-200",
    purple: "bg-purple-50 border-purple-100 hover:border-purple-200",
    rose: "bg-rose-50 border-rose-100 hover:border-rose-200",
    indigo: "bg-indigo-50 border-indigo-100 hover:border-indigo-200",
    cyan: "bg-cyan-50 border-cyan-100 hover:border-cyan-200",
    orange: "bg-orange-50 border-orange-100 hover:border-orange-200",
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab user={currentUser} showToast={showToast} />;
      case "academic":
        return <AcademicYearTab />;
      case "activeusers":
        return <ActiveUsersTab showToast={showToast} />;
      case "usermanagement":
        return (
          <UserManagementTab
            user={currentUser}
            showToast={showToast}
            loading={tabLoading}
            setLoading={setTabLoading}
          />
        );
      case "system":
        return (
          <SystemTab
            showToast={showToast}
            loading={tabLoading}
            setLoading={setTabLoading}
          />
        );
      case "maintenance":
        return <MaintenancePage showToast={showToast} />;
      default:
        return null;
    }
  };

  const activeMenu = menus.find((m) => m.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
        </div>
        <p className="text-gray-600">Kelola profil dan konfigurasi aplikasi</p>
      </div>

      {activeTab === null ? (
        // ============ GRID CARD MENU ============
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {menus.map((menu) => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.id}
                onClick={() => setActiveTab(menu.id)}
                className={`group text-center sm:text-left rounded-xl border p-4 sm:p-5 hover:shadow-md transition-all duration-200 ${cardColorClasses[menu.color]}`}>
                <div className="flex flex-col items-center sm:flex-row sm:items-start sm:justify-between">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${colorClasses[menu.color]}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <ChevronRight className="hidden sm:block w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
                <h3 className="mt-2 sm:mt-4 font-semibold text-gray-800 text-sm sm:text-base">
                  {menu.label}
                </h3>
                <p className="hidden sm:block mt-1 text-sm text-gray-500">
                  {menu.description}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        // ============ DETAIL TAB + TOMBOL KEMBALI ============
        <div>
          <button
            onClick={() => setActiveTab(null)}
            className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Menu
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              {activeMenu && (
                <>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClasses[activeMenu.color]}`}>
                    <activeMenu.icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-semibold text-gray-800">
                    {activeMenu.label}
                  </h2>
                </>
              )}
            </div>
            <div className="min-h-[400px] p-6">{renderTabContent()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setting;
