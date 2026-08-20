import React from "react";
import TeacherReports from "./TeacherReports";
import AdminReports from "./AdminReports";

const StudentReports = ({ currentUser, onShowToast }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📚</span>
        </div>
        <h2 className="text-xl font-bold text-blue-600 mb-2">
          Laporan Akademik
        </h2>
        <p className="text-slate-600 mb-4">
          Halaman laporan untuk siswa sedang dalam pengembangan.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-700">
            Fitur ini akan segera hadir. Anda dapat melihat nilai dan laporan
            melalui menu rapor.
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          Kembali
        </button>
      </div>
    </div>
  );
};

const ParentReports = ({ currentUser, onShowToast }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
        </div>
        <h2 className="text-xl font-bold text-purple-600 mb-2">Laporan Anak</h2>
        <p className="text-slate-600 mb-4">
          Halaman laporan untuk orang tua/wali sedang dalam pengembangan.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-700">
            Anda akan dapat memantau perkembangan akademik dan perilaku anak
            Anda di sini.
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          Kembali
        </button>
      </div>
    </div>
  );
};

const Reports = ({ currentUser, onShowToast }) => {
  console.log("📊 REPORTS - CurrentUser received:", currentUser);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Akses Ditolak</h2>
          <p className="text-slate-600 mb-4">
            Data user tidak ditemukan. Silakan login kembali.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser.role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-yellow-600 mb-2">
            Role Tidak Ditemukan
          </h2>
          <p className="text-slate-600 mb-4">
            User tidak memiliki role yang valid.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
            <p className="text-sm font-mono break-all">
              {JSON.stringify(currentUser, null, 2)}
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.role === "admin") {
    return <AdminReports user={currentUser} onShowToast={onShowToast} />;
  }

  if (currentUser.role === "teacher") {
    return <TeacherReports user={currentUser} onShowToast={onShowToast} />;
  }

  if (currentUser.role === "student") {
    return (
      <StudentReports currentUser={currentUser} onShowToast={onShowToast} />
    );
  }

  if (currentUser.role === "parent") {
    return (
      <ParentReports currentUser={currentUser} onShowToast={onShowToast} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">❓</span>
        </div>
        <h2 className="text-xl font-bold text-yellow-600 mb-2">
          Role Tidak Dikenali
        </h2>
        <p className="text-slate-600 mb-2">
          Role "<span className="font-semibold">{currentUser.role}</span>" tidak
          valid.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">
            Role yang didukung: admin, teacher, student, parent
          </p>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Hubungi administrator untuk bantuan.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          Kembali
        </button>
      </div>
    </div>
  );
};

export default Reports;
