import { useEffect, useRef, useState } from "react";
import {
  Home,
  Settings,
  Monitor,
  LogOut,
  ClipboardList,
  UserCheck,
  BookOpen,
  UserCircle,
  User,
} from "lucide-react";

// ✅ Bottom navbar khusus mobile (lg:hidden).
// Sekarang beda isi menu tergantung role:
// - role="admin"  -> Home, Pengaturan, Monitor System, Keluar (yang lama)
// - role="guru" / "walikelas" -> Home, Presensi Siswa, Presensi Guru, Jurnal, Keluar
//
// Tiap tombol tetep punya warna pastel sendiri biar gampang dibedain sekilas,
// label teksnya gelap & tebal biar tetep jelas dibaca.
export default function BottomNav({
  currentPage,
  onPageChange,
  onLogout,
  onProfileClick, // opsional: kalau gak dikasih, fallback ke onPageChange("profile")
  role = "admin", // "admin" | "guru" | "walikelas"
}) {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  // Tutup menu akun kalau klik di luar area menu/tombol
  useEffect(() => {
    if (!showAccountMenu) return;

    function handleClickOutside(event) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setShowAccountMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAccountMenu]);

  const handleProfileClick = () => {
    setShowAccountMenu(false);
    if (onProfileClick) {
      onProfileClick();
    } else if (onPageChange) {
      onPageChange("profile");
    }
  };

  const handleLogoutClick = () => {
    setShowAccountMenu(false);
    onLogout?.();
  };

  const adminNavItems = [
    {
      id: "dashboard",
      label: "Home",
      icon: Home,
      bg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      activeBg: "bg-indigo-500",
      labelColor: "text-indigo-700",
    },
    {
      id: "setting",
      label: "Pengaturan",
      icon: Settings,
      bg: "bg-amber-100",
      iconColor: "text-amber-600",
      activeBg: "bg-amber-500",
      labelColor: "text-amber-700",
    },
    {
      id: "sistem",
      label: "Monitor",
      icon: Monitor,
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
      activeBg: "bg-blue-500",
      labelColor: "text-blue-700",
    },
  ];

  // role guru / walikelas
  const guruNavItems = [
    {
      id: "dashboard",
      label: "Home",
      icon: Home,
      bg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      activeBg: "bg-indigo-500",
      labelColor: "text-indigo-700",
    },
    {
      id: "attendance",
      label: "Presensi Siswa",
      icon: ClipboardList,
      bg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      activeBg: "bg-emerald-500",
      labelColor: "text-emerald-700",
    },
    {
      id: "teacherattendance",
      label: "Presensi Guru",
      icon: UserCheck,
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
      activeBg: "bg-blue-500",
      labelColor: "text-blue-700",
    },
    {
      id: "teachingjournal",
      label: "Jurnal",
      icon: BookOpen,
      bg: "bg-violet-100",
      iconColor: "text-violet-600",
      activeBg: "bg-violet-500",
      labelColor: "text-violet-700",
    },
  ];

  const navItems =
    role === "guru" || role === "walikelas" ? guruNavItems : adminNavItems;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around px-1.5 pt-2 pb-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className="flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 gap-1">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm transition-all ${
                  isActive
                    ? `${item.activeBg} text-white shadow-md scale-105`
                    : `${item.bg} ${item.iconColor}`
                }`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <span
                className={`text-[11px] font-bold truncate max-w-full ${
                  isActive ? item.labelColor : "text-slate-700"
                }`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Akun - buka popup kecil berisi Profile & Keluar */}
        <div ref={accountMenuRef} className="relative flex-1 min-w-0">
          {showAccountMenu && (
            <div className="absolute bottom-[calc(100%+10px)] right-1 w-44 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-slate-50 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <User size={16} strokeWidth={2.2} />
                </span>
                <span className="text-[13px] font-bold text-slate-700">
                  Profile
                </span>
              </button>
              <div className="h-px bg-gray-100 mx-1" />
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-rose-50 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <LogOut size={16} strokeWidth={2.2} />
                </span>
                <span className="text-[13px] font-bold text-rose-600">
                  Keluar
                </span>
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAccountMenu((prev) => !prev)}
            className="flex flex-col items-center justify-center w-full min-w-0 py-0.5 gap-1">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm transition-all ${
                showAccountMenu
                  ? "bg-rose-500 text-white shadow-md scale-105"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}>
              <UserCircle size={20} strokeWidth={2.2} />
            </div>
            <span
              className={`text-[11px] font-bold truncate max-w-full ${
                showAccountMenu ? "text-rose-700" : "text-slate-700"
              }`}>
              Akun
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
