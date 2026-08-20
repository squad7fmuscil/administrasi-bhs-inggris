import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getActiveAcademicInfo } from "../services/academicYearService";

// ✅ NEW: Jadwal jam pelajaran master, dipakai buat nentuin "jam ke berapa"
// dari start_time/end_time di teacher_schedules (yang cuma nyimpen jam,
// bukan nomor JP-nya).
const JAM_SCHEDULE = {
  Senin: {
    1: { start: "06:30", end: "07:50" },
    2: { start: "07:50", end: "08:30" },
    3: { start: "08:30", end: "09:10" },
    4: { start: "09:10", end: "09:50" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Selasa: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Rabu: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Kamis: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Jumat: {
    1: { start: "06:30", end: "07:00" },
    2: { start: "07:00", end: "07:30" },
    3: { start: "07:30", end: "08:00" },
    4: { start: "08:00", end: "08:30" },
    5: { start: "08:30", end: "09:00" },
    6: { start: "09:30", end: "10:00" },
    7: { start: "10:00", end: "10:30" },
    8: { start: "", end: "" },
    9: { start: "", end: "" },
  },
};

// ✅ NEW: Normalisasi format jam ("10.30" atau "10:30:00" atau "10:30")
// jadi "HH:MM" biar bisa dibandingin apple-to-apple.
const normalizeJamTime = (t) => {
  if (!t) return "";
  return t.replace(".", ":").slice(0, 5);
};

// ✅ NEW: Cari nomor jam ke berapa dari JAM_SCHEDULE berdasarkan jam mulai
// atau jam selesai (field menentukan mana yang dicocokkan).
const findJamKe = (day, timeValue, field) => {
  const daySchedule = JAM_SCHEDULE[day];
  if (!daySchedule || !timeValue) return null;
  const target = normalizeJamTime(timeValue);
  if (!target) return null;
  const found = Object.entries(daySchedule).find(
    ([, jam]) => normalizeJamTime(jam[field]) === target,
  );
  return found ? found[0] : null;
};

const DashboardHomeTeacher = ({ currentUser, onPageChange }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    pendingNotes: 0,
    maleCount: 0,
    femaleCount: 0,
  });
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  // ✅ NEW: Siswa tidak hadir - Presensi Harian (Walikelas)
  const [homeroomAttendanceTaken, setHomeroomAttendanceTaken] = useState(false);
  const [homeroomAbsentStudents, setHomeroomAbsentStudents] = useState([]);

  // ✅ NEW: Siswa tidak hadir - Presensi Mapel (Guru Mapel)
  const [mapelScheduleToday, setMapelScheduleToday] = useState([]);
  const [mapelAbsentStudents, setMapelAbsentStudents] = useState([]);
  const [mapelAttendanceTaken, setMapelAttendanceTaken] = useState(false);

  // ✅ NEW: Riwayat materi terakhir per kelas+mapel (dari teaching_journal),
  // ditampilkan di card "Jadwal Saya Hari Ini". Key: "classId||subject"
  const [lastMateriMap, setLastMateriMap] = useState({});

  // Update waktu setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  // Format waktu dan hari
  const toTitleCase = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // ✅ NEW: Helper label & warna status kehadiran
  const statusMeta = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "sakit")
      return {
        label: "Sakit",
        badge:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      };
    if (s === "izin")
      return {
        label: "Izin",
        badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
      };
    // alpa / alpha / lainnya
    return {
      label: "Alfa",
      badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    };
  };

  // ✅ NEW: Cek apakah blok jadwal udah lewat (sudah masuk kelas / selesai),
  // dibandingin sama jam sekarang (currentTime), pake end_time blok itu.
  const isBlockDone = (endTime) => {
    if (!endTime) return false;
    const normalized = normalizeJamTime(endTime);
    if (!normalized) return false;
    const [h, m] = normalized.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return false;
    const endDate = new Date(currentTime);
    endDate.setHours(h, m, 0, 0);
    return currentTime > endDate;
  };

  const formatDay = () => {
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

    const day = days[currentTime.getDay()];
    const date = currentTime.getDate();
    const month = months[currentTime.getMonth()];
    const year = currentTime.getFullYear();

    return `${day}, ${date} ${month} ${year}`;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (currentUser.homeroom_class_id) {
        // ✅ FIX: Pakai tanggal LOKAL (WIB), bukan toISOString() yang UTC.
        // toISOString() bikin tanggal mundur 1 hari kalau dashboard dibuka
        // dini hari WIB (sebelum jam 07:00), karena WIB = UTC+7.
        const now = new Date();
        const today = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // ✅ NEW: Nama hari ini (dipake buat query jadwal di bawah)
        const daysList = [
          "Minggu",
          "Senin",
          "Selasa",
          "Rabu",
          "Kamis",
          "Jumat",
          "Sabtu",
        ];
        const todayDay = daysList[new Date().getDay()];

        // ✅ PERF: Query-query di bawah ini gak saling butuh data satu sama
        // lain, jadi ditembak BARENG (paralel) pake Promise.all, bukan
        // satu-satu (await berurutan) kayak sebelumnya. Hasil datanya tetep
        // identik, cuma waktu tunggunya jadi setara query paling lama aja
        // (bukan total semua query).
        const [
          { data: students },
          { data: attendance },
          { data: notes },
          academicInfo,
          { data: schedules, error: scheduleError },
        ] = await Promise.all([
          supabase
            .from("students")
            .select("*")
            .eq("class_id", currentUser.homeroom_class_id)
            .eq("is_active", true),
          supabase
            .from("attendance")
            .select("*")
            .eq("class", currentUser.homeroom_class_id)
            .eq("date", today)
            .eq("type", "walikelas"),
          supabase
            .from("student_notes")
            .select("*")
            .eq("teacher_id", currentUser.teacher_id)
            .is("action_taken", null),
          getActiveAcademicInfo(),
          supabase
            .from("teacher_schedules")
            .select("*")
            .eq("teacher_id", currentUser.id) // ✅ PAKE user.id (UUID)
            .eq("day", todayDay) // ✅ PAKE huruf kapital: "Senin", "Selasa", dst
            .order("start_time"),
        ]);

        if (scheduleError) {
          console.error("Error fetching schedule:", scheduleError);
        } else {
          console.log("Today's schedule:", schedules);
        }

        setTodaySchedule(schedules || []);

        // ✅ NEW: Siswa tidak hadir - Presensi Mapel (Guru Mapel) hari ini
        setMapelScheduleToday(schedules || []);

        const totalStudents = students?.length || 0;

        // ✅ Hitung jumlah siswa Laki-laki (L) dan Perempuan (P)
        const maleCount = students?.filter((s) => s.gender === "L").length || 0;
        const femaleCount =
          students?.filter((s) => s.gender === "P").length || 0;

        // ✅ FIX: Bandingin status case-insensitive. Di database status
        // disimpan "Hadir" (huruf besar di depan), tapi kode lama bandingin
        // ke "hadir" (huruf kecil semua) sehingga cocok gagal terus dan
        // siswa yang hadir ikut kehitung/kelist sebagai tidak hadir.
        const presentToday =
          attendance?.filter((a) => (a.status || "").toLowerCase() === "hadir")
            .length || 0;
        const absentToday = totalStudents - presentToday;

        // ✅ NEW: Siswa tidak hadir - Presensi Harian (Walikelas)
        // Belum presensi kalau belum ada record sama sekali hari ini
        const homeroomTaken = (attendance?.length || 0) > 0;
        const homeroomAbsentList = (attendance || [])
          .filter((a) => (a.status || "").toLowerCase() !== "hadir")
          .map((a) => {
            const student = students?.find((s) => s.id === a.student_id);
            return {
              name: student?.full_name || "Siswa",
              status: a.status,
            };
          });

        // Get teacher assignments (kelas yang diampu) - pake tahun ajaran aktif
        // ⚠️ Ini baru bisa jalan SETELAH academicInfo didapat (tahap 1 di
        // atas), makanya tetep nunggu sendiri, gak ikut Promise.all di atas.
        const currentAcademicYear = academicInfo?.year;
        const currentSemester =
          academicInfo?.semester === 2 ? "genap" : "ganjil";

        const { data: assignments } = await supabase
          .from("teacher_assignments")
          .select("*")
          .eq("teacher_id", currentUser.teacher_id)
          .eq("academic_year", currentAcademicYear)
          .eq("semester", currentSemester)
          .order("class_id");

        // Group by class and subject
        const classesMap = {};
        assignments?.forEach((assign) => {
          if (!classesMap[assign.class_id]) {
            classesMap[assign.class_id] = [];
          }
          classesMap[assign.class_id].push(assign.subject);
        });

        const teacherClassesList = Object.keys(classesMap).map((classId) => ({
          class_id: classId,
          subjects: classesMap[classId],
        }));

        setTeacherClasses(teacherClassesList);

        // ✅ Ambil daftar mata pelajaran unik yang diampu guru
        const uniqueSubjects = [
          ...new Set(assignments?.map((a) => a.subject) || []),
        ].map((subj) => toTitleCase(subj));
        setTeacherSubjects(uniqueSubjects);

        let mapelTakenAny = false;
        let mapelAbsentList = [];
        // ✅ NEW: kumpulin materi terakhir per kelas+mapel di sini
        const materiMap = {};

        // ✅ FIX: Kalau guru punya lebih dari 1 jam pelajaran untuk kelas &
        // mapel yang sama di hari yang sama (misal 2 slot Bahasa Inggris di
        // kelas 7C), jangan query attendance-nya berkali-kali — cukup sekali
        // per kombinasi kelas+mapel, biar siswa gak kelist dobel.
        const uniqueClassSubject = [];
        const seenClassSubject = new Set();
        (schedules || []).forEach((sch) => {
          const subjectForClass =
            sch.subject ||
            (classesMap[sch.class_id] && classesMap[sch.class_id][0]);
          if (!subjectForClass) return;
          const key = `${sch.class_id}||${subjectForClass}`;
          if (seenClassSubject.has(key)) return;
          seenClassSubject.add(key);
          uniqueClassSubject.push({ ...sch, subjectForClass });
        });

        if (uniqueClassSubject.length > 0) {
          // ✅ PERF: Sebelumnya loop ini pakai `await` di dalam `for`, jadi
          // tiap kelas nunggu kelas sebelumnya kelar dulu (3 query × N
          // kelas, semuanya berurutan). Sekarang semua kelas ditembak
          // BARENG pake Promise.all, dan per kelas ketiga query-nya
          // (mapelStudents, mapelAttendance, journalRows — yang emang gak
          // saling butuh) juga ditembak bareng. Urutan hasil di
          // mapelAbsentList/materiMap tetep sama karena Promise.all
          // menjaga urutan array input.
          const results = await Promise.all(
            uniqueClassSubject.map(async (sch) => {
              const subjectForClass = sch.subjectForClass;

              const [
                { data: mapelStudents },
                { data: mapelAttendance },
                { data: journalRows, error: journalError },
              ] = await Promise.all([
                supabase
                  .from("students")
                  .select("id, full_name")
                  .eq("class_id", sch.class_id)
                  .eq("is_active", true),
                supabase
                  .from("attendance")
                  .select("*")
                  .eq("class", sch.class_id)
                  .eq("date", today)
                  .eq("type", "mapel")
                  .eq("mapel", subjectForClass),
                // ✅ Ambil materi terakhir yang diajar di kelas+mapel ini,
                // sebelum hari ini (riwayat murni, gak termasuk entry
                // hari ini).
                supabase
                  .from("teaching_journal")
                  .select("*")
                  .eq("teacher_id", currentUser.teacher_id)
                  .eq("class_id", sch.class_id)
                  .eq("subject", subjectForClass)
                  .lt("tanggal", today)
                  .order("tanggal", { ascending: false })
                  .limit(1),
              ]);

              if (journalError) {
                console.error("Error fetching teaching_journal:", journalError);
              }

              return {
                sch,
                subjectForClass,
                mapelStudents,
                mapelAttendance,
                journalRows,
              };
            }),
          );

          results.forEach(
            ({
              sch,
              subjectForClass,
              mapelStudents,
              mapelAttendance,
              journalRows,
            }) => {
              if (mapelAttendance && mapelAttendance.length > 0) {
                mapelTakenAny = true;
                const absentInClass = mapelAttendance
                  .filter((a) => (a.status || "").toLowerCase() !== "hadir")
                  .map((a) => {
                    const student = mapelStudents?.find(
                      (s) => s.id === a.student_id,
                    );
                    return {
                      name: student?.full_name || "Siswa",
                      status: a.status,
                      classId: sch.class_id,
                      subject: subjectForClass,
                    };
                  });
                mapelAbsentList = [...mapelAbsentList, ...absentInClass];
              }

              if (journalRows && journalRows.length > 0) {
                materiMap[`${sch.class_id}||${subjectForClass}`] =
                  journalRows[0];
              }
            },
          );
        }

        setLastMateriMap(materiMap);

        setMapelAttendanceTaken(mapelTakenAny);
        setMapelAbsentStudents(mapelAbsentList);

        // ✅ Commit state siswa tidak hadir - Presensi Harian (Walikelas)
        setHomeroomAttendanceTaken(homeroomTaken);
        setHomeroomAbsentStudents(homeroomAbsentList);

        setStats({
          totalStudents,
          presentToday,
          absentToday,
          pendingNotes: notes?.length || 0,
          maleCount,
          femaleCount,
        });

        setClassInfo(currentUser.homeroom_class_id);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Memuat dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Soft Pastel */}
        {/* ✅ Judul "Dashboard" & jam sudah dipindah/ditampilkan di Layout header
            (selalu terlihat karena sticky), jadi banner ini cuma info sambutan
            aja. Padding ditambah dikit biar tampilannya lebih lega. */}
        <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-7 md:p-9 mb-5 sm:mb-7 relative overflow-hidden border border-blue-200/50 dark:border-slate-700">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20 dark:opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
          </div>

          <div className="relative min-w-0">
            <p className="text-slate-700 dark:text-slate-200 text-xl sm:text-3xl break-words">
              Selamat Datang,{" "}
              <span className="font-bold text-slate-900 dark:text-slate-50">
                {currentUser.full_name}
              </span>
            </p>
            {classInfo && (
              <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm sm:text-lg">
                Wali Kelas{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100 bg-white/60 dark:bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-slate-200 dark:border-slate-600">
                  {classInfo}
                </span>
              </p>
            )}
            {teacherSubjects.length > 0 && (
              <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm sm:text-lg">
                Guru{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {teacherSubjects.join(", ")}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* ✅ Card "Aksi Cepat" dihapus dari sini — 5 menu (Home, Presensi
            Siswa, Presensi Guru, Jurnal, Logout) sekarang ada di BottomNav
            (lihat components/layout/BottomNav.js) yang sticky di bawah layar
            di semua halaman. "Laporan" tetap bisa diakses lewat sidebar. */}

        {/* Quick Stats - Soft Colors, compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Total Students */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-3 sm:p-4 hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700 min-w-0 text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mb-0.5 truncate">
              Total Siswa
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              {stats.totalStudents}
            </p>
            <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-medium truncate">Kelas {classInfo}</span>
            </div>
          </div>

          {/* L / P */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-3 sm:p-4 hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700 min-w-0 text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-sky-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14v7m0 0h-3m3 0h3m6-11a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mb-0.5 truncate">
              L / P
            </p>
            <p className="text-xl sm:text-2xl font-bold mb-1">
              <span className="text-sky-600 dark:text-sky-400">
                {stats.maleCount}
              </span>
              <span className="text-slate-400 dark:text-slate-500 mx-1">/</span>
              <span className="text-pink-600 dark:text-pink-400">
                {stats.femaleCount}
              </span>
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              <span>Laki-laki / Perempuan</span>
            </div>
          </div>
          {/* Present Today */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-3 sm:p-4 hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700 min-w-0 text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mb-0.5 truncate">
              Hadir Hari Ini
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              {stats.presentToday}
            </p>
            <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              {stats.totalStudents > 0 && (
                <span className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium truncate">
                  {((stats.presentToday / stats.totalStudents) * 100).toFixed(
                    1,
                  )}
                  % hadir
                </span>
              )}
            </div>
          </div>

          {/* Absent Today */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-3 sm:p-4 hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-700 min-w-0 text-center">
            <div className="flex items-center justify-center mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mb-0.5 truncate">
              Tidak Hadir
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              {stats.absentToday}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              <span>Alfa, Sakit, Izin</span>
            </div>
          </div>
        </div>

        {/* 2 Cards: Siswa Tidak Hadir - Kelas & Siswa Tidak Hadir - Mapel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Card: Siswa Tidak Hadir - Kelas (Walikelas) */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-slate-100 dark:border-slate-700 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 sm:mb-4 flex items-center min-w-0">
              <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-rose-500 to-orange-500 rounded-full mr-3 shrink-0"></span>
              <span className="truncate">
                Siswa Tidak Hadir - Kelas {classInfo}
              </span>
            </h2>

            {!homeroomAttendanceTaken ? (
              <div className="rounded-xl p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-center">
                <p className="text-2xl mb-2">⚠️</p>
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  Anda belum melakukan presensi hari ini
                </p>
                <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Silakan lakukan presensi harian untuk kelas {classInfo}
                </p>
              </div>
            ) : homeroomAbsentStudents.length === 0 ? (
              <div className="rounded-xl p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Semua siswa hadir hari ini
                </p>
              </div>
            ) : (
              <div className="space-y-1 sm:space-y-1.5 max-h-72 overflow-y-auto">
                {homeroomAbsentStudents.map((s, idx) => {
                  const meta = statusMeta(s.status);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700 min-w-0">
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {s.name}
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Siswa Tidak Hadir - Mata Pelajaran */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-slate-100 dark:border-slate-700 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 sm:mb-4 flex items-center min-w-0">
              <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3 shrink-0"></span>
              <span className="truncate">
                Siswa Tidak Hadir - Mata Pelajaran
                {teacherSubjects.length > 0 &&
                  ` (${teacherSubjects.join(", ")})`}
              </span>
            </h2>

            {mapelScheduleToday.length === 0 ? (
              <div className="rounded-xl p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Tidak ada jadwal mengajar hari ini
                </p>
              </div>
            ) : !mapelAttendanceTaken ? (
              <div className="rounded-xl p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-center">
                <p className="text-2xl mb-2">⚠️</p>
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  Anda belum melakukan presensi mapel hari ini
                </p>
                <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Silakan lakukan presensi untuk kelas yang dijadwalkan hari ini
                </p>
              </div>
            ) : mapelAbsentStudents.length === 0 ? (
              <div className="rounded-xl p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Semua siswa hadir hari ini
                </p>
              </div>
            ) : (
              <div className="space-y-1 sm:space-y-1.5 max-h-72 overflow-y-auto">
                {mapelAbsentStudents.map((s, idx) => {
                  const meta = statusMeta(s.status);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2.5 py-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700 min-w-0">
                      {/* Nama */}
                      <span className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {s.name}
                      </span>

                      {/* Kelas - kolom tengah */}
                      <span className="shrink-0 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        {s.classId}
                      </span>

                      {/* Status */}
                      <span
                        className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2 Cards: Kelas yang Diampu & Jadwal Hari Ini */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Kelas yang Diampu */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-slate-100 dark:border-slate-700 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center min-w-0">
                <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full mr-3 shrink-0"></span>
                <span className="truncate">Kelas yang Diampu</span>
              </h2>
              <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                {teacherClasses.length} Kelas
              </div>
            </div>

            {teacherClasses.length > 0 ? (
              <div className="space-y-3">
                {/* Group by subject */}
                {(() => {
                  const groupedBySubject = {};
                  teacherClasses.forEach((item) => {
                    item.subjects.forEach((subject) => {
                      if (!groupedBySubject[subject]) {
                        groupedBySubject[subject] = [];
                      }
                      groupedBySubject[subject].push(item.class_id);
                    });
                  });

                  return Object.entries(groupedBySubject).map(
                    ([subject, classes]) => (
                      <div
                        key={subject}
                        className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 min-w-0">
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shrink-0">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-slate-100 mb-2 truncate">
                              {subject}
                            </p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {classes.map((classId, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs sm:text-sm font-semibold border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors">
                                  {classId}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Belum ada kelas yang diampu
                </p>
                <p className="text-sm">Hubungi admin untuk assignment kelas</p>
              </div>
            )}
          </div>

          {/* Card 2: Jadwal Saya Hari Ini */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-slate-100 dark:border-slate-700 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center min-w-0">
                <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full mr-3 shrink-0"></span>
                <span className="truncate">
                  Jadwal Saya Hari Ini - {formatDay().split(",")[0]}
                </span>
              </h2>
              <button
                onClick={() => onPageChange("schedule")}
                className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center group shrink-0">
                Lihat Semua
                <svg
                  className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {todaySchedule.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-3 max-h-80 overflow-y-auto">
                {(() => {
                  // ✅ NEW: Nama hari ini, dipakai buat lookup JAM_SCHEDULE
                  const days = [
                    "Minggu",
                    "Senin",
                    "Selasa",
                    "Rabu",
                    "Kamis",
                    "Jumat",
                    "Sabtu",
                  ];
                  const todayDayName = days[currentTime.getDay()];

                  // ✅ NEW: Tempelin subjectForClass ke tiap row jadwal
                  // (fallback ke teacher_assignments kalau kolom subject
                  // di teacher_schedules kosong)
                  const scheduleWithSubject = todaySchedule.map((sch) => ({
                    ...sch,
                    subjectForClass:
                      sch.subject ||
                      teacherClasses.find((c) => c.class_id === sch.class_id)
                        ?.subjects?.[0] ||
                      "",
                  }));

                  // ✅ NEW: Gabungin row jadwal yang berurutan (kelas & mapel
                  // sama, dan end_time row sebelumnya = start_time row
                  // berikutnya) jadi satu blok "2JP", biar gak nampilin
                  // per-JP satu-satu.
                  const groupedBlocks = [];
                  scheduleWithSubject.forEach((sch) => {
                    const last = groupedBlocks[groupedBlocks.length - 1];
                    if (
                      last &&
                      last.class_id === sch.class_id &&
                      last.subjectForClass === sch.subjectForClass &&
                      last.end_time === sch.start_time
                    ) {
                      last.end_time = sch.end_time;
                      last.count += 1;
                    } else {
                      groupedBlocks.push({
                        class_id: sch.class_id,
                        subjectForClass: sch.subjectForClass,
                        start_time: sch.start_time,
                        end_time: sch.end_time,
                        count: 1,
                      });
                    }
                  });

                  return groupedBlocks.map((block, index) => {
                    const jamKeStart = findJamKe(
                      todayDayName,
                      block.start_time,
                      "start",
                    );
                    const jamKeEnd = findJamKe(
                      todayDayName,
                      block.end_time,
                      "end",
                    );
                    const jpLabel =
                      jamKeStart && jamKeEnd
                        ? jamKeStart === jamKeEnd
                          ? `${block.count}JP (${jamKeStart})`
                          : `${block.count}JP (${jamKeStart}-${jamKeEnd})`
                        : `${block.count}JP`;

                    const lastMateri = block.subjectForClass
                      ? lastMateriMap[
                          `${block.class_id}||${block.subjectForClass}`
                        ]
                      : null;

                    return (
                      <div
                        key={index}
                        className="p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30 rounded-xl hover:shadow-md transition-all duration-300 border border-emerald-100 dark:border-emerald-900/50 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md shrink-0">
                            {jpLabel}
                          </span>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {block.start_time?.slice(0, 5)} -{" "}
                              {block.end_time?.slice(0, 5)}
                            </span>
                            {/* ✅ NEW: Badge "Selesai" muncul kalau jadwal ini
                                udah lewat jam selesainya (posisinya di bawah
                                jam, terutama di tampilan hp) */}
                            {isBlockDone(block.end_time) && (
                              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Selesai
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {block.subjectForClass || "-"}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          🏫 Kelas {block.class_id}
                        </p>

                        {/* ✅ NEW: Riwayat materi terakhir di kelas ini */}
                        {lastMateri ? (
                          <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 min-w-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Materi terakhir ({lastMateri.tanggal}):
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {lastMateri.materi || "-"}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 min-w-0">
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                              Belum ada riwayat materi sebelumnya
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {/* ✅ NEW: Catatan kecil khusus hari Jumat, jam pelajarannya
                    lebih singkat (30 menit/JP) dibanding hari lain */}
                {currentTime.getDay() === 5 && (
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 italic text-center pt-1">
                    *Jumat memiliki jam pelajaran khusus (30 menit/JP)
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tidak ada jadwal hari ini
                </p>
                <p className="text-sm">Hari ini jadwal kosong atau libur</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHomeTeacher;
