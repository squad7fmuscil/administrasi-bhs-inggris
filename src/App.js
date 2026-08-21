// App.js
import { useState, useEffect } from "react";

// Core Components
import Login from "./components/Login";
import { getStudentSession, clearStudentSession } from "./utils/studentSession";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";

// Main Pages
import Students from "./page/Students";
import AttendanceMain from "./page/attendance/AttendanceMain";
import TeacherAttendance from "./attendance-teacher/TeacherAttendance";
import GradeMain from "./page/grade/GradeMain";
import StudentNotes from "./page/StudentNotes";
import TeacherSchedule from "./page/TeacherSchedule";
import TeachingJournal from "./page/TeachingJournal";
import SeatingChart from "./page/SeatingChart";
import DutySchedule from "./page/DutySchedule";
import Organigram from "./page/Organigram";
import ModulAjar from "./page/ModulAjar";
import ProgramSemester from "./page/PromesPage";
import ProgramTahunan from "./page/ProtaPage";
import KaldikPage from "./page/KaldikPage";
import Setting from "./settings/setting";

// Reports & System
import Report from "./reports/Report";
import MonitorSistem from "./system/MonitorSistem";

// E-Learning Components
import ELearningDashboard from "./e-learning/e-LearningDashboard";
import EasyMateri from "./e-learning/EasyMateri";
import EasyText from "./e-learning/EasyText";
import EasyVocab from "./e-learning/EasyVocab";
import EasySoal from "./e-learning/EasySoal";

// ============ EASY GRAMMAR ============
import EasyGrammar from "./e-learning/EasyGrammar";
import MateriDetail from "./e-learning/EasyGrammar/MateriDetail";
import LatihanSoal from "./e-learning/EasyGrammar/LatihanSoal";
import EasyGrammarChecker from "./e-learning/EasyGrammar/EasyGrammarChecker";
// ======================================

// ============ STUDENT PORTAL ============
import StudentLayout from "./students/StudentLayout";
import StudentDashboard from "./students/StudentDashboard";
import StudentJadwal from "./students/StudentJadwal";
import StudentPresensi from "./students/StudentPresensi";
import StudentLainnya from "./students/StudentLainnya";
// ===========================================

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Check localStorage saat pertama load
  useEffect(() => {
    // CEK SESSION SISWA DULUAN (localStorage + cookie fallback)
    const studentData = getStudentSession();
    if (studentData) {
      setCurrentUser({
        ...studentData,
        role: "student",
        isStudent: true,
      });
      setIsLoggedIn(true);
      setCurrentPage("student-dashboard");
      return;
    }

    // KALAU BUKAN SISWA, CEK USER BIASA
    const savedUser = localStorage.getItem("currentUser");
    const rememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedUser && rememberMe) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("rememberMe");
      }
    } else {
      const sessionUser = sessionStorage.getItem("currentUser");
      if (sessionUser) {
        try {
          const user = JSON.parse(sessionUser);
          setCurrentUser(user);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Error parsing session user:", error);
          sessionStorage.removeItem("currentUser");
        }
      }
    }
  }, []);

  const handleLogin = (userData, rememberMe) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);

    if (rememberMe) {
      localStorage.setItem("currentUser", JSON.stringify(userData));
      localStorage.setItem("rememberMe", "true");
    } else {
      sessionStorage.setItem("currentUser", JSON.stringify(userData));
      localStorage.setItem("rememberMe", "false");
    }

    setCurrentPage("dashboard");
    showToast(
      `Selamat datang, ${userData.full_name || userData.username}!`,
      "success",
    );
  };

  const handleLogout = () => {
    const userName = currentUser?.full_name || currentUser?.username || "User";

    // Hapus semua session
    localStorage.removeItem("currentUser");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("currentUser");
    clearStudentSession();

    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage("dashboard");

    showToast(`Sampai jumpa, ${userName}!`, "success");
  };

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const renderPage = () => {
    if (!currentUser) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading user data...</p>
          </div>
        </div>
      );
    }

    // ===== CEK JIKA INI SISWA =====
    // Portal siswa punya routing + layout sendiri (StudentLayout, bottom
    // nav sendiri) — terpisah total dari Layout.js punya guru/admin.
    if (currentUser.isStudent || currentUser.role === "student") {
      const studentPages = [
        "student-dashboard",
        "student-jadwal",
        "student-presensi",
        "student-lainnya",
      ];
      const activeStudentPage = studentPages.includes(currentPage)
        ? currentPage
        : "student-dashboard";

      const renderStudentPage = () => {
        switch (activeStudentPage) {
          case "student-jadwal":
            return <StudentJadwal />;
          case "student-presensi":
            return <StudentPresensi />;
          case "student-lainnya":
            return <StudentLainnya />;
          case "student-dashboard":
          default:
            return <StudentDashboard onPageChange={setCurrentPage} />;
        }
      };

      return (
        <StudentLayout
          currentPage={activeStudentPage}
          onPageChange={setCurrentPage}
          currentUser={currentUser}
          onLogout={handleLogout}>
          {renderStudentPage()}
        </StudentLayout>
      );
    }

    // ===== GURU / ADMIN =====
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard onPageChange={setCurrentPage} currentUser={currentUser} />
        );

      case "students":
        return <Students currentUser={currentUser} />;

      case "attendance":
        return <AttendanceMain user={currentUser} onShowToast={showToast} />;

      case "teacherattendance":
        return <TeacherAttendance user={currentUser} onShowToast={showToast} />;

      case "grades":
        return <GradeMain user={currentUser} onShowToast={showToast} />;

      case "notes":
        return <StudentNotes user={currentUser} onShowToast={showToast} />;

      case "schedule":
        return <TeacherSchedule user={currentUser} />;

      case "report":
        return <Report currentUser={currentUser} />;

      case "teachingjournal":
        return <TeachingJournal currentUser={currentUser} />;

      case "seatingchart":
        return <SeatingChart currentUser={currentUser} />;

      case "dutyschedule":
        return <DutySchedule currentUser={currentUser} />;

      case "organigram":
        return <Organigram currentUser={currentUser} />;

      case "modulajar":
        return (
          <ModulAjar
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "programsemester":
        return (
          <ProgramSemester
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "programtahunan":
        return (
          <ProgramTahunan
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "kaldik":
        return <KaldikPage currentUser={currentUser} onShowToast={showToast} />;

      // ============ E-LEARNING ============
      case "elearning":
        return (
          <ELearningDashboard
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "easymateri":
        return (
          <EasyMateri
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "easytext":
        return (
          <EasyText currentUser={currentUser} setCurrentPage={setCurrentPage} />
        );

      case "easyvocab":
        return (
          <EasyVocab
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "easysoal":
        return (
          <EasySoal currentUser={currentUser} setCurrentPage={setCurrentPage} />
        );

      // ============ EASY GRAMMAR ============
      case "easygrammar":
        return (
          <EasyGrammar
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "easygrammar_materi":
        return (
          <MateriDetail
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "easygrammar_latihan":
        return (
          <LatihanSoal
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );

      case "easygrammar_checker":
        return (
          <EasyGrammarChecker
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        );
      // ======================================

      case "setting":
        return <Setting currentUser={currentUser} />;

      case "sistem":
        return <MonitorSistem currentUser={currentUser} />;

      default:
        return (
          <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <svg
                  className="w-24 h-24 mx-auto text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Halaman Tidak Ditemukan
              </h2>
              <p className="text-slate-600 mb-6">
                Halaman "{currentPage}" tidak tersedia.
              </p>
              <button
                onClick={() => setCurrentPage("dashboard")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  // Jika belum login
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} onShowToast={showToast} />;
  }

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[70] animate-slide-in">
          <div
            className={`
            px-6 py-4 rounded-lg shadow-xl border-l-4 min-w-[300px]
            ${
              toast.type === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : toast.type === "error"
                  ? "bg-red-50 border-red-500 text-red-800"
                  : toast.type === "warning"
                    ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                    : "bg-blue-50 border-blue-500 text-blue-800"
            }
          `}>
            <div className="flex items-center gap-3">
              {toast.type === "success" && (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
              {toast.type === "error" && (
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
              {toast.type === "warning" && (
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              )}
              {toast.type === "info" && (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              )}
              <p className="font-semibold">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      {/* ===== LAYOUT DENGAN SIDEBAR (HANYA UNTUK GURU/ADMIN) ===== */}
      {/* SISWA PAKE StudentLayout (udah dibungkus di dalem renderPage()
          di atas), BUKAN Layout.js punya guru/admin. */}
      {currentUser.isStudent || currentUser.role === "student" ? (
        renderPage()
      ) : (
        <Layout
          currentPage={currentPage}
          onPageChange={handlePageChange}
          currentUser={currentUser}
          onLogout={handleLogout}>
          {renderPage()}
        </Layout>
      )}
    </>
  );
}
