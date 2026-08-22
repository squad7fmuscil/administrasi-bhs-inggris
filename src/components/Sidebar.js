import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  Monitor,
  X,
  User,
  BookOpenCheck,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  FileStack,
  ClipboardList,
  NotebookPen,
  LayoutGrid,
  Users2,
  Network,
  UserCheck,
  CalendarRange,
  CalendarClock,
  CalendarDays,
  LogOut, // 🔥 TOMBOL LOGOUT DIIMPORT
} from "lucide-react";

export default function Sidebar({
  currentPage,
  onPageChange,
  currentUser,
  isSidebarOpen,
  isMobileMenuOpen,
  toggleMobileMenu,
  onLogout,
}) {
  const [openGroups, setOpenGroups] = useState({
    akademik: true,
    administrasi: true,
  });

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Dashboard - tidak masuk grup manapun, selalu tampil di atas
  const dashboardItem = {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "teacher"],
  };

  // ============ E-LEARNING (single entry, bukan grup lagi) ============
  const elearningItem = {
    id: "elearning",
    label: "E-Learning",
    icon: GraduationCap,
    roles: ["admin", "teacher"],
  };
  // ======================================================================

  // Grup menu - setiap grup punya key, label, icon, dan items
  const menuGroups = [
    {
      key: "akademik",
      label: "Akademik",
      icon: Users2,
      items: [
        {
          id: "students",
          label: "Data Siswa",
          icon: Users,
          roles: ["admin", "teacher"],
        },
        {
          id: "attendance",
          label: "Presensi Siswa",
          icon: ClipboardCheck,
          roles: ["admin", "teacher"],
        },
        {
          id: "teacherattendance",
          label: "Presensi Guru",
          icon: UserCheck,
          roles: ["admin", "teacher"],
        },
        {
          id: "grades",
          label: "Nilai Siswa",
          icon: FileText,
          roles: ["admin", "teacher"],
        },
        {
          id: "notes",
          label: "Catatan Siswa",
          icon: BookOpen,
          roles: ["admin", "teacher"],
        },
        {
          id: "report",
          label: "Laporan",
          icon: BarChart3,
          roles: ["admin", "teacher"],
        },
        {
          id: "student-profile-completion",
          label: "Kelengkapan Data",
          icon: FileStack,
          roles: ["admin", "teacher"],
        },
      ],
    },
    {
      key: "administrasi",
      label: "Administrasi",
      icon: ClipboardList,
      items: [
        {
          id: "schedule",
          label: "Jadwal Saya",
          icon: Calendar,
          roles: ["admin", "teacher"],
        },
        {
          id: "teachingjournal",
          label: "Jurnal Mengajar",
          icon: NotebookPen,
          roles: ["admin", "teacher"],
        },
        {
          id: "seatingchart",
          label: "Denah Duduk",
          icon: LayoutGrid,
          roles: ["admin", "teacher"],
        },
        {
          id: "dutyschedule",
          label: "Jadwal Piket",
          icon: ClipboardCheck,
          roles: ["admin", "teacher"],
        },
        {
          id: "organigram",
          label: "Organigram",
          icon: Network,
          roles: ["admin", "teacher"],
        },
        {
          id: "modulajar",
          label: "Modul Ajar",
          icon: BookOpenCheck,
          roles: ["admin", "teacher"],
        },
        {
          id: "programsemester",
          label: "Program Semester",
          icon: CalendarRange,
          roles: ["admin", "teacher"],
        },
        {
          id: "programtahunan",
          label: "Program Tahunan",
          icon: CalendarClock,
          roles: ["admin", "teacher"],
        },
        {
          id: "kaldik",
          label: "Kalender Pendidikan",
          icon: CalendarDays,
          roles: ["admin", "teacher"],
        },
      ],
    },
  ];

  // System menu - HANYA untuk admin
  const systemMenuItems = [
    { id: "setting", label: "Pengaturan", icon: Settings, roles: ["admin"] },
    { id: "sistem", label: "Monitor", icon: Monitor, roles: ["admin"] },
  ];

  const canAccess = (item) => item.roles.includes(currentUser?.role);

  const filteredSystemMenuItems = systemMenuItems.filter(canAccess);

  const renderNavButton = (item, { indent } = {}) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          onPageChange(item.id);
          if (window.innerWidth < 1024) {
            toggleMobileMenu();
          }
        }}
        className={`
          group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
          ${!isSidebarOpen && "lg:justify-center lg:px-2"}
          ${
            isActive
              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
              : "text-blue-100/80 hover:bg-white/10 hover:text-white"
          }
        `}
        title={!isSidebarOpen ? item.label : ""}>
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
        )}

        <Icon
          size={indent ? 18 : 20}
          strokeWidth={2}
          className={`flex-shrink-0 transition-transform duration-200 ${
            isActive ? "scale-110" : "group-hover:scale-110"
          }`}
        />

        {isSidebarOpen && (
          <>
            <span className="font-medium text-sm flex-1 text-left">
              {item.label}
            </span>
            {isActive && <ChevronRight size={16} className="opacity-70" />}
          </>
        )}

        {!isActive && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Overlay untuk mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out
          bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900
          ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
          ${isSidebarOpen ? "lg:w-64" : "lg:w-20"}
          w-64 shadow-2xl shadow-blue-900/20
        `}>
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 animate-pulse"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Border gradient */}
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between backdrop-blur-sm">
            <div
              className={`flex items-center gap-3 ${
                !isSidebarOpen && "lg:justify-center lg:w-full"
              }`}>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <span className="text-white font-bold text-sm">SM</span>
                </div>
                <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-xl -z-10"></div>
              </div>
              {isSidebarOpen && (
                <div>
                  <h1 className="text-white font-bold text-sm tracking-wide">
                    SMP MUSLIMIN
                  </h1>
                  <p className="text-blue-200 font-semibold text-xs">CILILIN</p>
                </div>
              )}
            </div>
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200">
              <X size={18} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
            {/* Dashboard & E-Learning - top level, di luar grup */}
            <div className="space-y-1 mb-3">
              {canAccess(dashboardItem) && renderNavButton(dashboardItem)}
              {canAccess(elearningItem) && renderNavButton(elearningItem)}
            </div>

            {/* Grouped Menu Sections */}
            {menuGroups.map((group) => {
              const filteredItems = group.items.filter(canAccess);
              if (filteredItems.length === 0) return null;

              const GroupIcon = group.icon;
              const isGroupActive = filteredItems.some(
                (item) => item.id === currentPage,
              );
              const isOpen = openGroups[group.key];

              return (
                <div className="mb-3" key={group.key}>
                  {/* Group Header/Toggle */}
                  <button
                    onClick={() => {
                      if (isSidebarOpen) {
                        toggleGroup(group.key);
                      } else {
                        toggleGroup(group.key);
                      }
                    }}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${!isSidebarOpen && "lg:justify-center lg:px-2"}
                      ${
                        isGroupActive
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                          : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                      }
                    `}
                    title={!isSidebarOpen ? group.label : ""}>
                    {isGroupActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                    )}

                    <GroupIcon
                      size={20}
                      strokeWidth={2}
                      className={`flex-shrink-0 transition-transform duration-200 ${
                        isGroupActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />

                    {isSidebarOpen && (
                      <>
                        <span className="font-medium text-sm flex-1 text-left">
                          {group.label}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}

                    {!isGroupActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/10 transition-all duration-300"></div>
                    )}
                  </button>

                  {/* Group Submenus */}
                  {isSidebarOpen && (
                    <div
                      className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${
                          isOpen
                            ? "max-h-[400px] opacity-100 mt-1"
                            : "max-h-0 opacity-0"
                        }
                      `}>
                      <div className="space-y-0.5 pl-3 border-l-2 border-blue-500/30 ml-5">
                        {filteredItems.map((item) =>
                          renderNavButton(item, { indent: true }),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* System Menu Section - HANYA tampilkan untuk admin */}
            {filteredSystemMenuItems.length > 0 && (
              <div className="border-t border-white/10 pt-3">
                {isSidebarOpen && (
                  <p className="text-[10px] font-bold text-blue-300/60 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                    <span className="w-3 h-px bg-blue-400/30"></span>
                    System
                  </p>
                )}
                <div className="space-y-1">
                  {filteredSystemMenuItems.map((item) => renderNavButton(item))}
                </div>
              </div>
            )}
          </nav>

          {/* ============================================================
              USER INFO + LOGOUT (SUDAH DIREVISI)
              ============================================================ */}
          <div className="border-t border-white/10 p-3 backdrop-blur-sm">
            <div
              className={`
              bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10
              hover:bg-white/10 transition-all duration-200 group
              ${!isSidebarOpen && "lg:p-2"}
            `}>
              <div className="flex items-center gap-3">
                {/* Avatar User */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                </div>

                {/* Nama User (hanya muncul kalo sidebar terbuka) */}
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {currentUser?.full_name || currentUser?.nama || "User"}
                    </p>
                    <p className="text-xs text-blue-200/80 truncate">
                      {currentUser?.role === "admin"
                        ? "Administrator"
                        : currentUser?.role === "teacher"
                          ? "Guru"
                          : "User"}
                    </p>
                  </div>
                )}

                {/* ==========================================================
                    TOMBOL LOGOUT - MUNCUL SELALU (BAIK SIDEBAR KECIL ATAU BESAR)
                    ========================================================== */}
                <button
                  onClick={onLogout}
                  className={`
                    p-2 hover:bg-white/10 rounded-lg transition-all duration-200 
                    text-white/70 hover:text-white flex-shrink-0
                    ${!isSidebarOpen && "ml-auto"}
                  `}
                  title="Logout">
                  <LogOut size={isSidebarOpen ? 18 : 20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Scrollbar Styles - disembunyikan, scroll tetap jalan */}
        <style jsx>{`
          .custom-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge lama */
          }
          .custom-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Edge baru */
          }
        `}</style>
      </aside>
    </>
  );
}
