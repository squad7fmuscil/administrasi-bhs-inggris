// students/StudentLayout.js
// ========================================================================
// Layout khusus portal siswa. Dipakai buat SEMUA halaman siswa (Dashboard,
// Jadwal, Presensi, Lainnya) biar header + bottom nav konsisten di semua
// halaman — bukan cuma nempel di StudentDashboard.js kayak sebelumnya.
// ========================================================================
import { useState, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import StudentBottomNav from "./StudentBottomNav";
import StudentSidebar from "./StudentSidebar";

const PAGE_TITLES = {
  "student-dashboard": "Beranda",
  "student-jadwal": "Jadwal Pelajaran",
  "student-presensi": "Presensi Saya",
  "student-belajar": "Belajar",
  "student-lainnya": "Akun Saya",
};

// Jam + tanggal live di header. Update tiap detik biar jamnya jalan,
// tapi cuma re-render komponen kecil ini (bukan seluruh layout).
// Tampil di semua ukuran layar (HP & desktop).
function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateLine = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-end leading-tight shrink-0">
      <span className="text-base sm:text-lg font-bold text-blue-900 tabular-nums">
        {time}
      </span>
      <span className="text-[10px] sm:text-xs font-medium text-blue-500 whitespace-nowrap">
        {dateLine}
      </span>
    </div>
  );
}

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
        <header className="bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-100 text-blue-900 sticky top-0 z-30 shadow-sm border-b border-blue-100/80">
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-white/70 rounded-full flex items-center justify-center shrink-0 lg:hidden shadow-sm">
                <User size={18} className="text-blue-500" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold leading-tight truncate text-blue-900">
                  {pageTitle}
                </h1>
              </div>
            </div>
            {currentPage === "student-dashboard" && (
              <div className="flex items-center gap-2 shrink-0">
                <LiveClock />
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-2 rounded-full transition shadow-sm text-xs font-semibold lg:hidden">
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            )}
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
