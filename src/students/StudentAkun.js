// students/StudentAkun.js
// Halaman "Akun" — 2 tampilan:
//   1. List menu (Profile, Ganti Password, dst) — tampilan awal.
//   2. Detail 1 menu doang, fullscreen fokus ke situ, menu lain ilang,
//      ada tombol "Kembali" buat balik ke list.
// Isi tiap menu baru di-mount (jadi baru fetch data-nya kalau ada) pas
// menunya diklik — bukan langsung semua ke-fetch pas halaman ini dibuka.
import React, { useState } from "react";
import useStudentProfile from "./useStudentProfile";
import {
  ProfileInfo,
  ChangePasswordForm,
  LogoutSection,
} from "./StudentProfile";
import StudentPiket from "./StudentPiket";
import StudentPengumuman from "./StudentPengumuman";
import StudentSaran from "./StudentSaran";
import StudentPerangkatTerhubung from "./StudentPerangkatTerhubung";
import {
  User,
  KeyRound,
  Smartphone,
  Users as UsersIcon,
  Bell,
  MessageSquare,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const MENUS = [
  {
    key: "profile",
    title: "Profile",
    icon: User,
    iconBgClass: "bg-blue-50",
    iconColorClass: "text-blue-600",
  },
  {
    key: "password",
    title: "Ganti Password",
    icon: KeyRound,
    iconBgClass: "bg-purple-50",
    iconColorClass: "text-purple-600",
  },
  {
    key: "devices",
    title: "Perangkat Terhubung",
    icon: Smartphone,
    iconBgClass: "bg-cyan-50",
    iconColorClass: "text-cyan-600",
  },
  {
    key: "piket",
    title: "Jadwal Piket",
    icon: UsersIcon,
    iconBgClass: "bg-orange-50",
    iconColorClass: "text-orange-600",
  },
  {
    key: "pengumuman",
    title: "Pengumuman",
    icon: Bell,
    iconBgClass: "bg-yellow-50",
    iconColorClass: "text-yellow-600",
  },
  {
    key: "saran",
    title: "Saran/Masukan",
    icon: MessageSquare,
    iconBgClass: "bg-green-50",
    iconColorClass: "text-green-600",
  },
  {
    key: "logout",
    title: "Keluar",
    icon: LogOut,
    iconBgClass: "bg-red-50",
    iconColorClass: "text-red-600",
    danger: true,
  },
];

export default function StudentAkun() {
  const {
    student,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useStudentProfile();
  const [activeMenu, setActiveMenu] = useState(null);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (profileError === "NO_SESSION") {
    return (
      <div className="text-center py-20 text-sm text-gray-500">
        Sesi Tidak Ketemu. Silakan Login Ulang.
      </div>
    );
  }

  const renderContent = (key) => {
    switch (key) {
      case "profile":
        return <ProfileInfo student={student} onUpdated={refetchProfile} />;
      case "password":
        return <ChangePasswordForm student={student} />;
      case "devices":
        return <StudentPerangkatTerhubung student={student} />;
      case "piket":
        return <StudentPiket student={student} />;
      case "pengumuman":
        return <StudentPengumuman student={student} />;
      case "saran":
        return <StudentSaran student={student} />;
      case "logout":
        return <LogoutSection />;
      default:
        return null;
    }
  };

  // ---- Tampilan detail: fokus ke 1 menu doang, menu lain gak muncul ----
  if (activeMenu) {
    const menu = MENUS.find((m) => m.key === activeMenu);
    const Icon = menu.icon;

    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setActiveMenu(null)}
          className="flex items-center gap-1 text-sm font-semibold text-gray-500">
          <ChevronLeft size={18} />
          Kembali
        </button>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-50">
            <div
              className={`w-9 h-9 ${menu.iconBgClass} rounded-full flex items-center justify-center shrink-0`}>
              <Icon size={18} className={menu.iconColorClass} />
            </div>
            <span
              className={`text-sm font-semibold ${
                menu.danger ? "text-red-600" : "text-gray-700"
              }`}>
              {menu.title}
            </span>
          </div>
          <div className="p-4">{renderContent(activeMenu)}</div>
        </section>
      </div>
    );
  }

  // ---- Tampilan list: semua menu, belum ada yang dipilih ----
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
      {MENUS.map(
        ({ key, title, icon: Icon, iconBgClass, iconColorClass, danger }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveMenu(key)}
            className="w-full flex items-center gap-3 p-4 text-left">
            <div
              className={`w-9 h-9 ${iconBgClass} rounded-full flex items-center justify-center shrink-0`}>
              <Icon size={18} className={iconColorClass} />
            </div>
            <span
              className={`text-sm font-semibold flex-1 ${
                danger ? "text-red-600" : "text-gray-700"
              }`}>
              {title}
            </span>
            <ChevronRight size={18} className="text-gray-400 shrink-0" />
          </button>
        ),
      )}
    </div>
  );
}
