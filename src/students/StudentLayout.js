// students/StudentLayout.js
// ========================================================================
// Layout khusus portal siswa. Dipakai buat SEMUA halaman siswa (Dashboard,
// Jadwal, Presensi, Lainnya) biar header + bottom nav konsisten di semua
// halaman — bukan cuma nempel di StudentDashboard.js kayak sebelumnya.
// ========================================================================
import { useState } from "react";
import { User, LogOut } from "lucide-react";
import StudentBottomNav from "./StudentBottomNav";
import StudentSidebar from "./StudentSidebar";

const PAGE_TITLES = {
  "student-dashboard": "Beranda",
  "student-jadwal": "Jadwal Pelajaran",
  "student-presensi": "Presensi Saya",
  "student-lainnya": "Lainnya",
};

export default function StudentLayout({
  children,
  currentPage,
  onPageChange,
  currentUser,
  onLogout,
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pageTitle = PAGE_TITLES[currentPage] || "Portal Siswa";

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
      {/* ====== SIDEBAR (desktop only, hidden di HP) ====== */}
      <StudentSidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        currentUser={currentUser}
        onLogout={() => setShowLogoutConfirm(true)}
      />

      {/* ====== KONTEN UTAMA — digeser ke kanan di desktop biar gak
          ketiban sidebar (lg:w-64 -> lg:pl-64) ====== */}
      <div className="lg:pl-64">
        {/* ====== HEADER ====== */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-30 shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0 lg:hidden">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold leading-tight truncate">
                  {pageTitle}
                </h1>
                <p className="text-blue-100 text-xs truncate">
                  {currentUser?.full_name || "Siswa"} · Kelas{" "}
                  {currentUser?.homeroom_class_id || "-"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition text-xs font-medium shrink-0 lg:hidden">
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </header>

        {/* ====== CONTENT ====== */}
        <main className="max-w-lg lg:max-w-3xl mx-auto px-4 py-5 space-y-5">
          {children}
        </main>
      </div>

      {/* ====== LOGOUT CONFIRMATION MODAL ====== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keluar Dari Portal Siswa?
              </h3>
              <p className="text-sm text-gray-600">
                Kamu Harus Login Kembali Buat Masuk Lagi.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== BOTTOM NAV (mobile only, sudah lg:hidden bawaan) ====== */}
      <StudentBottomNav currentPage={currentPage} onPageChange={onPageChange} />
    </div>
  );
}
