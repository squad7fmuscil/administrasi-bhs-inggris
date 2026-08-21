// students/StudentAkun.js
// (dulu bernama StudentLainnya.js — di-rename biar sesuai isinya sekarang)
// Halaman "Akun" — daftar menu accordion: Profile, Ganti Password,
// Perangkat Terhubung, Jadwal Piket, Pengumuman, Saran/Masukan, Keluar.
// Cuma 1 menu yang boleh kebuka dalam satu waktu. Isi tiap menu baru
// di-mount (jadi baru fetch data-nya kalau ada) pas menunya diklik —
// bukan langsung semua kebuka & fetch pas halaman ini pertama kali dibuka.
import React, { useState } from "react";
import useStudentProfile from "./useStudentProfile";
import StudentAccordionItem from "./StudentAccordionItem";
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
  } = useStudentProfile();
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (key) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  };

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
        return <ProfileInfo student={student} />;
      case "password":
        return <ChangePasswordForm student={student} />;
      case "devices":
        return <StudentPerangkatTerhubung />;
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

  return (
    <div className="space-y-3">
      {MENUS.map(
        ({ key, title, icon: Icon, iconBgClass, iconColorClass, danger }) => (
          <StudentAccordionItem
            key={key}
            title={title}
            icon={<Icon size={18} className={iconColorClass} />}
            iconBgClass={iconBgClass}
            titleClass={danger ? "text-red-600" : "text-gray-700"}
            open={openMenu === key}
            onToggle={() => toggleMenu(key)}>
            {renderContent(key)}
          </StudentAccordionItem>
        ),
      )}
    </div>
  );
}
