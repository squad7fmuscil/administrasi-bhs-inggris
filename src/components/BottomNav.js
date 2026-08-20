import {
  Home,
  ClipboardCheck,
  UserCheck,
  BookOpenText,
  LogOut,
} from "lucide-react";

// ✅ NEW: Bottom navbar khusus mobile (lg:hidden), isinya 5 menu paling
// sering dipake: Home, Presensi Siswa, Presensi Guru, Jurnal, Logout.
// "Laporan" sengaja gak dimasukin karena jarang dibuka, tetep bisa lewat
// sidebar. Logout tetep aman karena udah pake modal konfirmasi (handleLogout
// di Layout.js yang munculin modal, bukan langsung logout).
//
// ✅ Tiap tombol punya warna pastel sendiri (senada sama card "Aksi Cepat"
// yang lama) biar gampang dibedain sekilas, dan label teksnya dibikin gelap
// & tebal (bukan abu-abu pudar) biar tetep jelas dibaca — termasuk buat
// pengguna yang lebih senior.
export default function BottomNav({ currentPage, onPageChange, onLogout }) {
  const navItems = [
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
      label: "P. Siswa",
      icon: ClipboardCheck,
      bg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      activeBg: "bg-emerald-500",
      labelColor: "text-emerald-700",
    },
    {
      id: "teacherattendance",
      label: "P. Guru",
      icon: UserCheck,
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
      activeBg: "bg-blue-500",
      labelColor: "text-blue-700",
    },
    {
      id: "teachingjournal",
      label: "Jurnal",
      icon: BookOpenText,
      bg: "bg-rose-100",
      iconColor: "text-rose-600",
      activeBg: "bg-rose-500",
      labelColor: "text-rose-700",
    },
  ];

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

        {/* Logout - warna pastel merah biar tetap keliatan beda kategori */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 gap-1">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-100 text-red-600 shadow-sm">
            <LogOut size={20} strokeWidth={2.2} />
          </div>
          <span className="text-[11px] font-bold text-slate-700 truncate max-w-full">
            Keluar
          </span>
        </button>
      </div>
    </nav>
  );
}
