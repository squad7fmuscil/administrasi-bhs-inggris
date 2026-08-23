import { useState, useEffect } from "react";
import {
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from "lucide-react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function Layout({
  children,
  currentPage,
  onPageChange,
  currentUser,
  onLogout,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ✅ NEW: Jam live di header - selalu tampil di semua halaman karena
  // header ini sticky (ngga ikut ke-scroll seperti banner di Dashboard).
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClockTime = () => {
    return currentTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatClockDate = (short = false) => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const monthsShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    const day = days[currentTime.getDay()];
    const date = currentTime.getDate();
    const month = short
      ? monthsShort[currentTime.getMonth()]
      : months[currentTime.getMonth()];
    const year = currentTime.getFullYear();

    return short
      ? `${day}, ${date} ${month}`
      : `${day}, ${date} ${month} ${year}`;
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "students", label: "Data Siswa" },
    { id: "attendance", label: "Presensi Siswa" },
    { id: "teacherattendance", label: "Presensi Guru" },
    { id: "grades", label: "Nilai Siswa" },
    { id: "notes", label: "Catatan Siswa" },
    { id: "report", label: "Laporan" },
    { id: "schedule", label: "Jadwal Saya" },
    { id: "teachingjournal", label: "Jurnal Mengajar" },
    { id: "seatingchart", label: "Denah Duduk" },
    { id: "dutyschedule", label: "Jadwal Piket" },
    { id: "organigram", label: "Organigram" },
    { id: "modulajar", label: "Modul Ajar" },
    { id: "programsemester", label: "Program Semester" },
    { id: "programtahunan", label: "Program Tahunan" },
    { id: "kaldik", label: "Kalender Pendidikan" },
  ];

  // E-Learning Menu Items
  // "elearning" = halaman dashboard card baru (yang muncul di sidebar).
  // Item lain tetap disimpan supaya judul header tetap benar saat user
  // membuka salah satu sub-fitur lewat card di e-LearningDashboard.js.
  const elearningMenuItems = [
    { id: "elearning", label: "E-Learning" },
    { id: "easymateri", label: "Easy Materi" },
    { id: "easytext", label: "Easy Text" },
    { id: "easyvocab", label: "Easy Vocab" },
    { id: "easysoal", label: "Easy Soal" },
    { id: "easygrammar", label: "Easy Grammar" },
  ];

  const systemMenuItems = [
    { id: "setting", label: "Pengaturan" },
    { id: "sistem", label: "Monitor" },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getPageTitle = () => {
    // Gabungkan semua menu items
    const allItems = [...menuItems, ...elearningMenuItems, ...systemMenuItems];
    const currentItem = allItems.find((item) => item.id === currentPage);
    return currentItem ? currentItem.label : "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-blue-50 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keluar dari Sistem?
              </h3>
              <p className="text-sm text-gray-600">
                Anda harus login kembali untuk mengakses sistem
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2.5 border border-blue-200 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium">
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>

      {/* Sidebar Component */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        currentUser={currentUser}
        isSidebarOpen={isSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-16 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu size={20} className="text-gray-600" />
              </button>

              {/* Desktop Toggle Button */}
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}>
                {isSidebarOpen ? (
                  <PanelLeftClose size={20} className="text-gray-600" />
                ) : (
                  <PanelLeftOpen size={20} className="text-gray-600" />
                )}
              </button>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getPageTitle()}
                </h2>
              </div>
            </div>

            {/* Right Section - Jam, User Info & Logout */}
            <div className="flex items-center gap-2">
              {/* Jam - Desktop, di sebelah Profile */}
              <div className="hidden md:flex flex-col items-end px-3 py-1.5 bg-blue-100 rounded-xl border border-blue-200 leading-none shadow-sm">
                <span className="text-lg font-bold font-mono tracking-tight text-blue-700">
                  {formatClockTime()}
                </span>
                <span className="text-xs text-blue-600 font-semibold mt-0.5 whitespace-nowrap">
                  {formatClockDate()}
                </span>
              </div>

              {/* Jam - Mobile, di sebelah tombol Logout */}
              <div className="flex md:hidden flex-col items-end px-2.5 py-1.5 bg-blue-100 rounded-lg border border-blue-200 leading-none shadow-sm">
                <span className="text-sm font-bold font-mono tracking-tight text-blue-700">
                  {formatClockTime()}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold mt-0.5 whitespace-nowrap">
                  {formatClockDate()}
                </span>
              </div>

              {/* User Info Desktop */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                    <User size={16} className="text-white" />
                  </div>
                  {/* Status Online - Titik Hijau */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">
                    {currentUser?.full_name || currentUser?.nama || "User"}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    {currentUser?.role === "admin"
                      ? "Admin"
                      : currentUser?.role === "teacher"
                        ? "Guru"
                        : "User"}
                  </span>
                </div>
              </div>

              {/* ✅ Tombol Logout di banner atas dihapus — sekarang cuma
                  ada di BottomNav (mobile) & Sidebar (desktop), biar ga
                  dobel. Modal konfirmasi tetap sama (handleLogout). */}
            </div>
          </div>
        </header>

        {/* Content Area */}
        {/* ✅ pb-24 khusus mobile: kasih ruang biar konten paling bawah
            gak ketutup BottomNav yang fixed (lg:pb-8 balik normal di desktop
            karena BottomNav cuma muncul di mobile). */}
        <main className="p-4 sm:p-6 pb-24 lg:pb-8 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Bottom Navbar - mobile only */}
      {/* ✅ role dikirim dari currentUser.role: "admin" tetep Home-Pengaturan-Monitor,
          selain itu (teacher/walikelas) dianggap "guru" -> Home-Presensi Siswa-
          Presensi Guru-Jurnal. Kalo nanti ada field khusus buat bedain walikelas
          vs guru biasa (misal currentUser.is_homeroom), tinggal sesuaikan di sini. */}
      <BottomNav
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={handleLogout}
        role={currentUser?.role === "admin" ? "admin" : "guru"}
      />
    </div>
  );
}
