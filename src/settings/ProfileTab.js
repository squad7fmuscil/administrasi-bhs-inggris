// settings/ProfileTab.js
// Nampilin profil user yang lagi login (admin / guru / siswa), termasuk
// penugasan mengajar (khusus role teacher) dan form ganti password (reuse
// ChangePasswordSection.js). Data diambil dari tabel `users`, `teacher_assignments`,
// dan tahun ajaran aktif dari services/academicYearService.js.
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import ChangePasswordSection from "./ChangePasswordSection";
import {
  User,
  Shield,
  BookOpen,
  School,
  Calendar,
  History,
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  Users,
  AlertCircle,
  Phone,
  KeyRound,
} from "lucide-react";
import { getActiveAcademicInfo } from "../services/academicYearService";

const roleLabel = (role) => {
  if (role === "admin") return "Administrator";
  if (role === "teacher") return "Guru";
  if (role === "student") return "Siswa";
  return role || "-";
};

const roleDescription = (role) => {
  if (role === "admin") {
    return "Memiliki hak penuh untuk mengelola semua data dan pengguna dalam sistem.";
  }
  if (role === "teacher") {
    return "Bertanggung jawab atas pengajaran mata pelajaran, penilaian, dan presensi siswa di kelas yang ditugaskan.";
  }
  if (role === "student") {
    return "Memiliki akses ke portal siswa untuk melihat nilai, presensi, dan informasi kelas.";
  }
  return "";
};

const roleBadgeClass = (role) => {
  if (role === "admin") {
    return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
  }
  if (role === "teacher") {
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
  }
  return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
};

// ⚠️ Tabel `academic_years.semester` nyimpen ANGKA (1/2), sedangkan
// `teacher_assignments.semester` nyimpen TEKS ("ganjil"/"genap"). Biar bisa
// dibandingin apa adanya, semua nilai dinormalisasi ke "ganjil" / "genap".
const normalizeSemester = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value).trim().toLowerCase();
  if (str === "1" || str === "ganjil") return "ganjil";
  if (str === "2" || str === "genap") return "genap";
  return str;
};

const ProfileTab = ({ user, showToast }) => {
  const userId = user?.id || user?.userId;

  const [profileData, setProfileData] = useState(null);
  const [homeroomClass, setHomeroomClass] = useState(null); // hasil lookup ke tabel `classes`, kalau ada
  const [activeAcademicInfo, setActiveAcademicInfo] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  const notify = useCallback(
    (message, type = "error") => {
      if (showToast) showToast(message, type);
      else console.error(message);
    },
    [showToast],
  );

  // Ambil info tahun ajaran & semester aktif dari service
  const fetchActiveAcademicInfo = useCallback(async () => {
    try {
      const info = await getActiveAcademicInfo();
      setActiveAcademicInfo(info);
      return info;
    } catch (err) {
      console.error("Error fetching active academic info:", err);
      return null;
    }
  }, []);

  // Ambil data profil user yang lagi login
  const loadUserProfile = useCallback(async () => {
    if (!userId) {
      notify("ID pengguna tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const academicInfo = await fetchActiveAcademicInfo();

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          "id, username, full_name, role, teacher_id, homeroom_class_id, is_active, no_hp, created_at, last_login",
        )
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        notify(`Gagal memuat profil: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!userData) {
        notify("Data pengguna tidak ditemukan");
        setLoading(false);
        return;
      }

      setProfileData(userData);

      // homeroom_class_id di skema ini berupa teks polos (mis. "7B"), bukan
      // FK ke classes.id. Coba lookup dulu ke tabel `classes`; kalau gak
      // ketemu, tetap tampilkan teksnya apa adanya (lihat render di bawah).
      if (userData.homeroom_class_id) {
        const { data: classData } = await supabase
          .from("classes")
          .select("id, grade, academic_year, is_active")
          .eq("id", userData.homeroom_class_id)
          .maybeSingle();
        setHomeroomClass(classData || null);
      }

      if (
        userData.role === "teacher" &&
        userData.teacher_id &&
        academicInfo?.year
      ) {
        await loadTeachingAssignments(
          userData.teacher_id,
          academicInfo.year,
          academicInfo.semester,
          false,
        );
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      notify("Terjadi kesalahan saat memuat profil");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchActiveAcademicInfo, notify, userId]);

  // Ambil daftar penugasan mengajar (current atau lengkap dengan riwayat)
  const loadTeachingAssignments = useCallback(
    async (teacherId, activeYear, activeSemester, includeHistory = false) => {
      try {
        if (includeHistory) setLoadingHistory(true);

        // ⚠️ class_id di teacher_assignments itu teks polos (mis. "7B"),
        // BUKAN foreign key beneran ke classes.id (sama kayak
        // homeroom_class_id). Makanya gak bisa pake embed shorthand
        // `classes:class_id(...)` punya PostgREST — itu butuh FK
        // constraint asli di database, dan bakal error PGRST200 kalau
        // gak ada. Jadi query-nya dipisah, terus digabung manual di JS.
        let query = supabase
          .from("teacher_assignments")
          .select("id, subject, class_id, academic_year, semester")
          .eq("teacher_id", teacherId);

        if (!includeHistory) {
          query = query.eq("academic_year", activeYear);
        }

        query = query
          .order("academic_year", { ascending: false })
          .order("semester", { ascending: false });

        const { data, error } = await query;

        if (error) {
          console.error("Error loading teaching assignments:", error);
          return;
        }

        const assignments = data || [];

        // Ambil detail kelas (grade, is_active, dst) buat semua class_id
        // unik yang kepake, lalu tempelin manual ke tiap assignment.
        const uniqueClassIds = [
          ...new Set(assignments.map((a) => a.class_id).filter(Boolean)),
        ];

        let classesById = {};
        if (uniqueClassIds.length > 0) {
          const { data: classesData, error: classesError } = await supabase
            .from("classes")
            .select("id, grade, academic_year, is_active")
            .in("id", uniqueClassIds);

          if (classesError) {
            console.error(
              "Error loading classes for assignments:",
              classesError,
            );
          } else {
            classesById = (classesData || []).reduce((acc, c) => {
              acc[c.id] = c;
              return acc;
            }, {});
          }
        }

        const withClasses = assignments.map((a) => ({
          ...a,
          classes: a.class_id ? classesById[a.class_id] || null : null,
        }));

        setProfileData((prev) => ({
          ...prev,
          teaching_assignments: withClasses,
        }));
      } catch (err) {
        console.error("Error loading teaching assignments:", err);
      } finally {
        setLoadingHistory(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (userId && isInitialLoad.current) {
      isInitialLoad.current = false;
      loadUserProfile();
    }
  }, [userId, loadUserProfile]);

  useEffect(() => {
    if (
      !isInitialLoad.current &&
      profileData?.role === "teacher" &&
      profileData?.teacher_id &&
      activeAcademicInfo?.year &&
      activeAcademicInfo?.semester
    ) {
      loadTeachingAssignments(
        profileData.teacher_id,
        activeAcademicInfo.year,
        activeAcademicInfo.semester,
        showHistory,
      );
    }
  }, [
    showHistory,
    profileData?.role,
    profileData?.teacher_id,
    activeAcademicInfo?.year,
    activeAcademicInfo?.semester,
    loadTeachingAssignments,
  ]);

  const getClassName = (assignment) => {
    if (assignment.classes?.id) return `Kelas ${assignment.classes.id}`;
    if (assignment.classes?.grade) return `Kelas ${assignment.classes.grade}`;
    return `Kelas ${assignment.class_id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 md:p-8 text-center border border-red-200">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
          Data Profil Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          Terjadi kesalahan saat memuat data profil. Silakan logout lalu login
          kembali.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium min-h-[44px] w-full sm:w-auto">
          Refresh Halaman
        </button>
      </div>
    );
  }

  const { teaching_assignments: assignments = [], role } = profileData;
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";

  const currentAssignments = assignments.filter(
    (a) =>
      a.academic_year === activeAcademicInfo?.year &&
      normalizeSemester(a.semester) ===
        normalizeSemester(activeAcademicInfo?.semester),
  );

  const totalSubjects = currentAssignments.length;
  const uniqueSubjects = [...new Set(currentAssignments.map((a) => a.subject))]
    .length;
  const totalClasses = [...new Set(currentAssignments.map((a) => a.class_id))]
    .length;

  const groupedAssignments = assignments.reduce((acc, a) => {
    const year = a.academic_year;
    const semester = a.semester;
    if (!acc[year]) acc[year] = { year, semesters: {} };
    if (!acc[year].semesters[semester]) acc[year].semesters[semester] = [];
    acc[year].semesters[semester].push(a);
    return acc;
  }, {});

  const historyYears = Object.values(groupedAssignments).sort((a, b) =>
    b.year > a.year ? 1 : b.year < a.year ? -1 : 0,
  );

  // Prioritas: pake kode kelas lengkap dulu ("7B"), bukan cuma tingkat
  // ("7") dari kolom `grade`. `homeroom_class_id` di data user selalu
  // udah berupa teks lengkap ("7B") juga, jadi aman dipake fallback.
  const homeroomLabel =
    homeroomClass?.id || profileData.homeroom_class_id || homeroomClass?.grade;

  // Sama kayak bug semester di atas: row `academic_years` gak punya field
  // `displayText` (itu cuma ada di fungsi getSemesterDisplayName yang gak
  // dipanggil di sini). Jadi kita rakit manual dari year + semester.
  const activeSemesterLabel =
    normalizeSemester(activeAcademicInfo?.semester) === "genap"
      ? "Genap"
      : normalizeSemester(activeAcademicInfo?.semester) === "ganjil"
        ? "Ganjil"
        : null;
  const activeAcademicDisplayText =
    activeAcademicInfo?.year && activeSemesterLabel
      ? `${activeAcademicInfo.year} - Semester ${activeSemesterLabel}`
      : activeAcademicInfo?.year || null;

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-sm p-4 sm:p-5 md:p-8 border border-blue-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 flex-1 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-blue-100 dark:bg-gray-600 rounded-full flex items-center justify-center text-blue-700 dark:text-gray-300 font-bold text-2xl sm:text-3xl flex-shrink-0 border-4 border-white dark:border-gray-700 shadow-lg">
              {profileData.full_name?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {profileData.full_name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm sm:text-base">
                @{profileData.username}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${roleBadgeClass(role)}`}>
                  <Shield className="w-3.5 h-3.5" />
                  {roleLabel(role)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                      profileData.is_active ? "bg-green-500" : "bg-gray-400"
                    }`}></span>
                  {profileData.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 justify-center sm:justify-start">
                {profileData.teacher_id && (
                  <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-mono font-medium">
                      {profileData.teacher_id}
                    </span>
                  </div>
                )}
                {profileData.no_hp && (
                  <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                    <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{profileData.no_hp}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0 mt-4 md:mt-0 w-full sm:w-auto">
            {activeAcademicDisplayText && (
              <div className="bg-blue-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Tahun Ajaran:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    {activeAcademicDisplayText}
                  </span>
                </div>
              </div>
            )}
            {homeroomLabel && (
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-300 dark:border-blue-800">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                  <School className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span className="font-medium">
                    {isTeacher ? "Wali Kelas:" : "Kelas:"}
                  </span>
                  <span className="font-bold text-blue-900 dark:text-blue-200">
                    {homeroomLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role Description */}
        <div className="mt-6 border-t pt-6 border-blue-100 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
            Role:{" "}
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {roleLabel(role)}
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            {roleDescription(role)}
          </p>

          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-left">
              <div className="bg-blue-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                  Hak Akses:
                </h4>
                <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Kelola semua user &amp; role
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Akses data lengkap sistem
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Konfigurasi akademik
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Monitoring aktivitas
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                  Fitur Khusus:
                </h4>
                <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Lihat profil semua user
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Edit &amp; hapus user
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Mode maintenance aplikasi
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Kelola tahun ajaran &amp; data sekolah
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid: Password + Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Column 1: Password */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 border border-blue-100 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center gap-2">
              <KeyRound className="w-4.5 h-4.5 text-amber-500" />
              Ubah Password
            </h3>
            <ChangePasswordSection user={user} />
          </div>
        </div>

        {/* Column 2/3: Teaching Assignments (khusus guru) */}
        {isTeacher && (
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 border border-blue-100 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-orange-600" />
                  Penugasan Mengajar
                </span>
                {profileData.teacher_id && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    disabled={loadingHistory}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors disabled:opacity-50 min-h-[40px] px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    {loadingHistory ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-blue-600"></div>
                    ) : showHistory ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {showHistory
                        ? "Sembunyikan Riwayat"
                        : "Tampilkan Riwayat"}
                    </span>
                    <span className="sm:hidden">
                      {showHistory ? "Tutup" : "Riwayat"}
                    </span>
                  </button>
                )}
              </h3>

              {!showHistory && (
                <>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 border-b pb-3 border-blue-100 dark:border-gray-700">
                    Statistik penugasan tahun ajaran aktif (
                    {activeAcademicDisplayText || "N/A"})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-orange-100 dark:bg-orange-900/20 rounded-lg p-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                          {totalSubjects}
                        </p>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-400 font-medium">
                        Total Sesi
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-1.5">
                          <Award className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                          {uniqueSubjects}
                        </p>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-400 font-medium">
                        Mata Pelajaran
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                          {totalClasses}
                        </p>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-400 font-medium">
                        Kelas Diampu
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-1.5">
                          <History className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                          {homeroomLabel || "-"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-400 font-medium">
                        Wali Kelas
                      </p>
                    </div>
                  </div>

                  {currentAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {currentAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="bg-blue-50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                                {assignment.subject}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                                <School className="w-3 h-3" />
                                <span>{getClassName(assignment)}</span>
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                              <span className="bg-blue-100 dark:bg-gray-600 border border-blue-300 dark:border-gray-500 text-gray-800 dark:text-gray-300 px-2 py-1.5 rounded-lg font-medium">
                                Semester {assignment.semester}
                              </span>
                              <span className="bg-blue-200 dark:bg-gray-600 text-gray-800 dark:text-gray-300 px-2 py-1.5 rounded-lg font-medium flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {assignment.academic_year}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-blue-50 dark:bg-gray-700/30 rounded-xl p-6 sm:p-8 border border-blue-200 dark:border-gray-600 text-center">
                      <div className="bg-blue-100 dark:bg-gray-600 rounded-full p-4 w-fit mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-blue-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Belum Ada Tugas Mengajar
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400">
                        Anda belum memiliki mata pelajaran untuk tahun ajaran
                        ini.
                      </p>
                    </div>
                  )}
                </>
              )}

              {showHistory && (
                <div className="mt-4 border-t pt-4 border-blue-100 dark:border-gray-700">
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Riwayat Penugasan Mengajar
                  </p>
                  <div className="space-y-4 sm:space-y-6">
                    {historyYears.map((yearGroup) => (
                      <div key={yearGroup.year}>
                        <h4 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3 border-l-4 border-orange-400 pl-2 sm:pl-3">
                          Tahun Ajaran {yearGroup.year}
                        </h4>
                        <div className="space-y-3 ml-2">
                          {Object.entries(yearGroup.semesters).map(
                            ([semester, list]) => (
                              <div key={semester} className="space-y-1.5">
                                <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-400 flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  Semester {semester}
                                </p>
                                <div className="space-y-2 pl-3 sm:pl-4 border-l border-blue-200 dark:border-gray-600">
                                  {list.map((assignment) => (
                                    <div
                                      key={assignment.id}
                                      className="bg-blue-50 dark:bg-gray-700/30 rounded-lg p-2.5 sm:p-3 border border-blue-200 dark:border-gray-600">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                                            {assignment.subject}
                                          </p>
                                          <p className="text-xs text-gray-700 dark:text-gray-400 mt-0.5">
                                            {getClassName(assignment)}
                                          </p>
                                        </div>
                                        <span className="bg-blue-200 dark:bg-gray-600 text-gray-800 dark:text-gray-300 px-2 py-0.5 sm:py-1 rounded-lg font-medium text-xs">
                                          {assignment.academic_year}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Column 2/3: Info sederhana buat role selain teacher (admin/student) */}
        {!isTeacher && (
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 border border-blue-100 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-blue-600" />
                Informasi Akun
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-blue-50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Username
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                    {profileData.username}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Status
                  </p>
                  <p
                    className={`text-sm sm:text-base font-bold ${
                      profileData.is_active ? "text-green-600" : "text-gray-500"
                    }`}>
                    {profileData.is_active ? "Aktif" : "Nonaktif"}
                  </p>
                </div>
                {!isAdmin && homeroomLabel && (
                  <div className="bg-blue-50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-gray-600 col-span-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Kelas
                    </p>
                    <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                      {homeroomLabel}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
