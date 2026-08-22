// students/StudentSidebar.js
// ========================================================================
// Sidebar khusus portal siswa, HANYA tampil di desktop (lg:flex, hidden di
// HP karena mobile udah pake StudentBottomNav.js). Selalu fixed & expanded
// (gak ada collapse toggle kayak Sidebar.js admin) karena menu siswa cuma
// 4 item flat, gak butuh grouping.
//
// Pattern sama kayak StudentBottomNav.js: item nav pake <button onClick
// onPageChange(...)> (state-based routing), BUKAN <a href="...">.
// ========================================================================
import {
  Home,
  Calendar,
  ClipboardCheck,
  Grid3x3,
  LogOut,
  User,
} from "lucide-react";

export default function StudentSidebar({
  currentPage,
  onPageChange,
  currentUser,
  onLogout,
}) {
  const items = [
    { id: "student-dashboard", label: "Beranda", icon: Home },
    { id: "student-jadwal", label: "Jadwal", icon: Calendar },
    { id: "student-presensi", label: "Presensi", icon: ClipboardCheck },
    { id: "student-lainnya", label: "Akun", icon: Grid3x3 },
  ];

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 z-40
        bg-gradient-to-b from-blue-600 to-blue-800 shadow-2xl shadow-blue-900/20">
      {/* Header / brand */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-bold text-sm tracking-wide">
            Portal Siswa
          </h1>
          <p className="text-blue-200 text-xs truncate">
            Kelas {currentUser?.homeroom_class_id || "-"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPageChange(item.id)}
              className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-white text-blue-700 shadow-lg shadow-blue-900/20"
                  : "text-blue-100/80 hover:bg-white/10 hover:text-white"
              }`}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={`flex-shrink-0 transition-transform duration-200 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              />
              <span className="font-medium text-sm flex-1 text-left">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all duration-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {currentUser?.full_name || "Siswa"}
            </p>
            <p className="text-xs text-blue-200/80 truncate">
              @{currentUser?.username || "-"}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 text-white/70 hover:text-white shrink-0"
            title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
