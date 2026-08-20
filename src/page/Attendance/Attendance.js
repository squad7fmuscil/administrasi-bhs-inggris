//[file name]: Attendance.js (REFACTORED - Pure Input Mode)
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import AttendanceFilters from "./AttendanceFilters";
import AttendanceTable from "./AttendanceTable";
import AttendanceStats from "./AttendanceStats";

// ✅ IMPORT ACADEMIC YEAR SERVICE
import {
  getActiveAcademicInfo,
  getAllSemesters,
} from "../../services/academicYearService";

// ✅ UTILITY FUNCTIONS - DATE HANDLING
const getDefaultDate = () => {
  const now = new Date();
  const wibOffset = 7 * 60;
  const localOffset = now.getTimezoneOffset();
  const wibTime = new Date(now.getTime() + (wibOffset + localOffset) * 60000);

  const year = wibTime.getFullYear();
  const month = String(wibTime.getMonth() + 1).padStart(2, "0");
  const day = String(wibTime.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayWIB = () => {
  const now = new Date();
  const wibOffset = 7 * 60;
  const localOffset = now.getTimezoneOffset();
  const wibTime = new Date(now.getTime() + (wibOffset + localOffset) * 60000);
  wibTime.setHours(0, 0, 0, 0);
  return wibTime;
};

const parseDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

// ✅ UTILITY: Check if date is weekend (Saturday = 6, Sunday = 0)
const isWeekend = (dateString) => {
  const date = parseDate(dateString);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
};

// ✅ UTILITY: Get next weekday if selected date is weekend
const getNextWeekday = (dateString) => {
  let date = parseDate(dateString);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const Attendance = ({ user, onShowToast }) => {
  // ========== STATE MANAGEMENT ==========
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [date, setDate] = useState(getDefaultDate());
  const [students, setStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [attendanceNotes, setAttendanceNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [teacherId, setTeacherId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHomeroomTeacher, setIsHomeroomTeacher] = useState(false);
  const [homeroomClass, setHomeroomClass] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingAttendanceData, setExistingAttendanceData] = useState(null);
  const [pendingAttendanceData, setPendingAttendanceData] = useState(null);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // ✅ STATE BARU UNTUK EXPORT EXCEL
  const [teacherAssignment, setTeacherAssignment] = useState(null); // ✅ TAMBAH STATE BARU INI

  // ✅ ACADEMIC YEAR STATES
  const [activeAcademicInfo, setActiveAcademicInfo] = useState(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);

  // ✅ WEEKEND VALIDATION: Auto-skip to next weekday if weekend selected
  const handleDateChange = (newDate) => {
    if (isWeekend(newDate)) {
      const nextWeekday = getNextWeekday(newDate);
      console.log(
        `⚠️ Weekend detected (${newDate}), auto-skipping to ${nextWeekday}`,
      );

      if (onShowToast) {
        const dateObj = parseDate(newDate);
        const dayName = dateObj.getDay() === 0 ? "Minggu" : "Sabtu";
        onShowToast(
          `Hari ${dayName} bukan hari efektif. Auto-skip ke hari kerja berikutnya.`,
          "warning",
        );
      }

      setDate(nextWeekday);
    } else {
      setDate(newDate);
    }
  };

  // ========== UTILITY FUNCTIONS ==========
  const isHomeroomDaily = useCallback(() => {
    return selectedSubject && selectedSubject.includes("PRESENSI HARIAN");
  }, [selectedSubject]);

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ========== CORE HANDLERS ==========

  // ✅ VALIDATE DEFAULT DATE: Skip weekend on mount
  useEffect(() => {
    if (date && isWeekend(date)) {
      const nextWeekday = getNextWeekday(date);
      console.log(
        `⚠️ Initial date is weekend (${date}), auto-skipping to ${nextWeekday}`,
      );
      setDate(nextWeekday);
    }
  }, []); // Only run on mount

  const setAllHadir = () => {
    if (students.length === 0) {
      if (onShowToast) {
        onShowToast("Tidak ada siswa untuk diset hadir", "error");
      }
      return;
    }

    const newStatus = {};
    students.forEach((student) => {
      newStatus[student.id] = "Hadir";
    });
    setAttendanceStatus(newStatus);
    setHasUserInteracted(true); // ✅ Mark as interacted

    if (onShowToast) {
      onShowToast(
        `Berhasil mengubah status ${students.length} siswa menjadi HADIR`,
        "success",
      );
    }
  };

  // ✅ FUNCTION VALIDASI TANGGAL
  const validateDate = () => {
    if (!selectedSemesterId || !date) return { valid: true };

    const selectedSemester = availableSemesters.find(
      (s) => s.id === selectedSemesterId,
    );

    if (!selectedSemester) {
      return { valid: false, message: "Semester tidak valid" };
    }

    const inputDate = parseDate(date);
    const today = getTodayWIB();

    const startDate = parseDate(selectedSemester.start_date);
    const endDate = parseDate(selectedSemester.end_date);

    // ✅ VALIDASI 1: Tanggal tidak boleh masa depan
    if (inputDate > today) {
      return {
        valid: false,
        message: "❌ Tidak bisa input presensi untuk tanggal masa depan!",
      };
    }

    // ✅ VALIDASI 2: Tanggal harus dalam range semester
    if (inputDate < startDate || inputDate > endDate) {
      const semesterName =
        Number(selectedSemester.semester) === 1
          ? "Ganjil (Juli-Desember)"
          : "Genap (Januari-Juni)"; // ✅ FIXED: Number() karena Supabase balikin string
      return {
        valid: false,
        message: `❌ Tanggal harus dalam periode ${selectedSemester.year} Semester ${semesterName}`,
      };
    }

    // ✅ VALIDASI 3: Hanya semester aktif yang bisa input
    if (!selectedSemester.is_active) {
      return {
        valid: false,
        message: "❌ Hanya semester aktif yang bisa input presensi baru!",
      };
    }

    return { valid: true };
  };

  // ========== DATA FETCHING EFFECTS ==========
  useEffect(() => {
    if (user?.role === "admin" || !teacherId) return;

    const channel = supabase
      .channel(`attendance-${teacherId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance", // ✅ FIXED: nama tabel aslinya singular, bukan 'attendances'
        },
        () => {
          if (onShowToast) {
            onShowToast("Presensi Baru Ditambahkan", "info");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, user, onShowToast]);

  // ✅ LOAD ACTIVE ACADEMIC INFO
  useEffect(() => {
    const loadActiveAcademicInfo = async () => {
      try {
        const info = await getActiveAcademicInfo(); // 1 row academic_years yang is_active = true
        const allSemesters = await getAllSemesters(); // semua row buat dropdown

        setActiveAcademicInfo(info);
        setAvailableSemesters(allSemesters || []);

        if (info && info.id) {
          setSelectedSemesterId(info.id); // ✅ FIXED: field aslinya 'id', bukan 'activeSemesterId'
          setIsReadOnlyMode(false);

          console.log("📅 Default semester set:", {
            activeSemesterId: info.id,
            year: info.year,
            semester: info.semester,
          });
        } else {
          console.warn(
            "⚠️ Tidak ada academic_years dengan is_active = true di database",
          );
        }

        console.log("✅ Active Academic Info loaded for Attendance:", info);
      } catch (error) {
        console.error("❌ Error loading active academic info:", error);
        setMessage("Error loading academic year info");
      }
    };

    loadActiveAcademicInfo();
  }, []);

  // ✅ HANDLE SEMESTER CHANGE
  const handleSemesterChange = (semesterId) => {
    setSelectedSemesterId(semesterId);

    const selectedSemester = availableSemesters.find(
      (s) => s.id === semesterId,
    );
    const isActive = selectedSemester?.is_active || false;

    setIsReadOnlyMode(!isActive);

    // Reset data ketika ganti semester
    setClasses([]);
    setSelectedClass("");
    setStudents([]);
    setStudentsLoaded(false);
    setHasUserInteracted(false); // ✅ Reset interaction flag
    setTeacherAssignment(null); // ✅ Reset teacher assignment

    if (onShowToast) {
      if (selectedSemester) {
        const mode = isActive ? "Input Mode" : "View Only Mode";
        onShowToast(
          `Switched to ${selectedSemester.year} - Semester ${selectedSemester.semester} (${mode})`,
          isActive ? "info" : "warning",
        );
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (user) {
          if (user.role === "admin") {
            console.log("✅ Admin access granted to Attendance page");
            setAuthLoading(false);
            return;
          }

          // ✅ FIX: Add proper headers for Supabase request
          const { data: teacherData, error: teacherError } = await supabase
            .from("users")
            .select("teacher_id, homeroom_class_id")
            .eq("username", user.username)
            .maybeSingle(); // ✅ Use maybeSingle() instead of single()

          if (teacherError) {
            console.error("Error fetching teacher data:", teacherError);
            setMessage("Error: Data guru tidak ditemukan");
            setAuthLoading(false);
            return;
          }

          if (teacherData) {
            console.log("✅ Teacher data loaded:", teacherData);
            setTeacherId(teacherData.teacher_id);
            if (teacherData.homeroom_class_id) {
              setIsHomeroomTeacher(true);
              setHomeroomClass(teacherData.homeroom_class_id);
            }
          } else {
            console.warn(
              "⚠️ No teacher data found for username:",
              user.username,
            );
            setMessage("Data guru tidak ditemukan di sistem");
          }
        } else {
          setMessage("Silakan login terlebih dahulu");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setMessage("Error: Terjadi kesalahan sistem");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [user]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (user?.role === "admin") {
        console.log("ℹ️ Admin mode: Subjects not loaded");
        return;
      }

      if (!teacherId) return;

      if (!selectedSemesterId) {
        console.log("⚠️ No semester selected, clearing subjects");
        setSubjects([]);
        return;
      }

      try {
        console.log("🔍 Fetching subjects for:", {
          teacherId,
          selectedSemesterId,
          isHomeroomTeacher,
          homeroomClass,
        });

        let query = supabase
          .from("teacher_assignments")
          .select("subject")
          .eq("teacher_id", teacherId)
          .eq("academic_year_id", selectedSemesterId); // ✅ FIXED: filter langsung, bukan lewat filterBySemester

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching subjects:", error);
          setMessage("Error: Gagal mengambil mata pelajaran");
          return;
        }

        console.log("📚 Raw subjects data:", data);

        const uniqueSubjects = [...new Set(data.map((item) => item.subject))];

        if (isHomeroomTeacher && homeroomClass) {
          uniqueSubjects.push(`PRESENSI HARIAN KELAS ${homeroomClass}`);
        }

        console.log("✅ Final subjects:", uniqueSubjects);
        setSubjects(uniqueSubjects);
        setMessage(""); // Clear any error messages
      } catch (error) {
        console.error("Error in fetchSubjects:", error);
        setMessage("Error: Terjadi kesalahan sistem");
      }
    };

    fetchSubjects();
  }, [
    teacherId,
    isHomeroomTeacher,
    homeroomClass,
    user?.role,
    selectedSemesterId,
  ]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (user?.role === "admin") {
        console.log("ℹ️ Admin mode: Classes not loaded");
        return;
      }

      if (!selectedSubject || !teacherId) {
        setClasses([]);
        setTeacherAssignment(null); // ✅ Reset teacher assignment
        return;
      }

      setMessage("");

      try {
        const isDailyMode = selectedSubject.includes("PRESENSI HARIAN");

        if (isDailyMode) {
          if (!homeroomClass) {
            setTeacherAssignment(null); // ✅ Reset teacher assignment
            return;
          }

          const formattedClasses = [
            {
              id: homeroomClass,
              grade: homeroomClass.charAt(0),
              displayName: `Kelas ${homeroomClass}`,
            },
          ];

          setClasses(formattedClasses);
          setSelectedClass(homeroomClass);
          setTeacherAssignment(null); // ✅ RESET teacher assignment untuk harian

          setLoading(true);
          const { data: studentsData, error: studentsError } = await supabase
            .from("students")
            .select("id, full_name, nis, gender")
            .eq("class_id", homeroomClass)
            .eq("is_active", true)
            .order("full_name");

          if (studentsError) {
            setMessage(
              "Error: Gagal mengambil data siswa - " + studentsError.message,
            );
          } else {
            setStudents(studentsData || []);
            setStudentsLoaded(true);

            const newStatus = {};
            studentsData?.forEach((student) => {
              newStatus[student.id] = "Hadir";
            });
            setAttendanceStatus(newStatus);
          }
          setLoading(false);
          return;
        }

        if (!selectedSemesterId) {
          setClasses([]);
          setMessage("Pilih semester terlebih dahulu");
          setTeacherAssignment(null); // ✅ RESET teacher assignment
          return;
        }

        // ✅ UPDATE QUERY: TAMBAH SELECT subject
        let query = supabase
          .from("teacher_assignments")
          .select("class_id, subject") // ✅ TAMBAH subject DI SINI
          .eq("teacher_id", teacherId)
          .eq("subject", selectedSubject)
          .eq("academic_year_id", selectedSemesterId); // ✅ FIXED: filter langsung, bukan lewat filterBySemester

        const { data: assignmentData, error: assignmentError } = await query;

        if (assignmentError) {
          console.error("Assignment error:", assignmentError);
          throw assignmentError;
        }

        // ✅ SIMPAN TEACHER ASSIGNMENT (ambil yang pertama)
        if (assignmentData && assignmentData.length > 0) {
          setTeacherAssignment(assignmentData[0]); // ✅ SIMPAN DATA ASSIGNMENT
        } else {
          setTeacherAssignment(null);
        }

        if (!assignmentData?.length) {
          setClasses([]);
          const currentSemester = availableSemesters.find(
            (s) => s.id === selectedSemesterId,
          );
          setMessage(
            `Tidak ada kelas untuk "${selectedSubject}" di ${
              currentSemester
                ? `${currentSemester.year} - Semester ${currentSemester.semester}`
                : "semester ini"
            }`,
          );
          return;
        }

        const classIds = assignmentData.map((item) => item.class_id);
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("id, grade")
          .in("id", classIds);

        if (classError) throw classError;

        const formattedClasses = classData.map((cls) => ({
          id: cls.id,
          grade: cls.grade,
          displayName: `Kelas ${cls.id}`,
        }));

        setClasses(formattedClasses);
        setSelectedClass("");
        setStudents([]);
        setStudentsLoaded(false);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setMessage("Error: Gagal mengambil data kelas - " + error.message);
        setTeacherAssignment(null); // ✅ Reset on error
      }
    };

    fetchClasses();
  }, [
    selectedSubject,
    teacherId,
    isHomeroomTeacher,
    homeroomClass,
    user,
    selectedSemesterId,
    availableSemesters,
  ]);

  useEffect(() => {
    if (selectedClass && !isHomeroomDaily()) {
      fetchStudentsForClass(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (
      students.length > 0 &&
      studentsLoaded &&
      selectedClass &&
      date &&
      selectedSubject &&
      selectedSemesterId
    ) {
      fetchExistingAttendance();
    }
  }, [
    date,
    selectedClass,
    selectedSubject,
    students,
    studentsLoaded,
    selectedSemesterId,
  ]);

  const fetchStudentsForClass = async (classId) => {
    if (!classId) {
      setStudents([]);
      return;
    }

    try {
      setLoading(true);
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, nis, gender")
        .eq("class_id", classId)
        .eq("is_active", true)
        .order("full_name");

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);
      setStudentsLoaded(true);

      // ✅ Reset ke kosong - TIDAK AUTO-SET HADIR
      setAttendanceStatus({});
      setAttendanceNotes({});
      setHasUserInteracted(false); // ✅ Reset interaction flag
    } catch (error) {
      console.error("Error fetching students:", error);
      setMessage("Error: Gagal mengambil data siswa - " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    if (
      !selectedClass ||
      !date ||
      !selectedSubject ||
      !teacherId ||
      !selectedSemesterId
    ) {
      return;
    }

    try {
      setLoading(true);

      // ✅ SIMPLIFIED: tabel 'attendance' nyimpen nama guru langsung (teks),
      // jadi nggak perlu lagi lookup UUID dari tabel 'users'
      const teacherName = user?.full_name || user?.nama;
      if (!teacherName) {
        console.error("Nama guru tidak ditemukan di data user");
        return;
      }

      const typeValue = isHomeroomDaily() ? "walikelas" : "mapel"; // ✅ FIXED: constraint attendance_type_check cuma nerima 'mapel'/'walikelas', bukan 'harian'
      const currentSemester = availableSemesters.find(
        (s) => s.id === selectedSemesterId,
      );

      let query = supabase
        .from("attendance") // ✅ FIXED: nama tabel aslinya singular, bukan 'attendances'
        .select("student_id, status, notes")
        .eq("teacher_name", teacherName) // ✅ FIXED: kolom aslinya 'teacher_name' (text), bukan 'teacher_id'
        .eq("date", date)
        .eq("type", typeValue)
        .eq("class", selectedClass) // ✅ FIXED: kolom aslinya 'class', bukan 'class_id'
        .eq("academic_year", currentSemester?.year); // ✅ FIXED: kolom aslinya 'academic_year' (text tahun ajaran), bukan 'academic_year_id'

      const { data: attendanceData, error: attendanceError } = await query;

      if (attendanceError) {
        console.error("Error fetching attendance:", attendanceError);
        return;
      }

      if (attendanceData && attendanceData.length > 0) {
        const statusMap = {};
        const notesMap = {};

        attendanceData.forEach((record) => {
          statusMap[record.student_id] = record.status;
          if (record.notes) {
            notesMap[record.student_id] = record.notes;
          }
        });

        setAttendanceStatus(statusMap);
        setAttendanceNotes(notesMap);
        setHasUserInteracted(true); // ✅ Existing data = sudah ada interaksi

        console.log(
          "✅ Loaded existing attendance data:",
          attendanceData.length,
          "records",
        );
      } else {
        // ✅ TIDAK AUTO-SET HADIR - biarkan kosong
        setAttendanceStatus({});
        setAttendanceNotes({});
        setHasUserInteracted(false); // ✅ Belum ada interaksi
        console.log("ℹ️ No existing attendance - waiting for user input");
      }
    } catch (error) {
      console.error("Error in fetchExistingAttendance:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========== ATTENDANCE PROCESSING ==========
  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus((prev) => ({ ...prev, [studentId]: status }));
    setHasUserInteracted(true); // ✅ Mark as interacted when user changes status
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceNotes((prev) => ({ ...prev, [studentId]: notes }));
    setHasUserInteracted(true); // ✅ Mark as interacted when user adds notes
  };

  const checkExistingAttendance = async (teacherName, typeValue) => {
    try {
      const currentSemester = availableSemesters.find(
        (s) => s.id === selectedSemesterId,
      );

      let query = supabase
        .from("attendance") // ✅ FIXED: nama tabel aslinya singular, bukan 'attendances'
        .select("id, student_id, status, notes")
        .eq("teacher_name", teacherName) // ✅ FIXED: kolom aslinya 'teacher_name' (text), bukan 'teacher_id'
        .eq("date", date)
        .eq("type", typeValue)
        .eq("class", selectedClass) // ✅ FIXED: kolom aslinya 'class', bukan 'class_id'
        .in(
          "student_id",
          students.map((s) => s.id),
        );

      if (selectedSemesterId) {
        query = query.eq("academic_year", currentSemester?.year); // ✅ FIXED: kolom aslinya 'academic_year' (text), bukan 'academic_year_id'
      }

      const { data: existingData, error } = await query;

      if (error) {
        console.error("Error checking existing attendance:", error);
        return null;
      }

      return existingData || [];
    } catch (error) {
      console.error("Error in checkExistingAttendance:", error);
      return null;
    }
  };

  const prepareAttendanceData = (teacherName) => {
    const subjectValue = isHomeroomDaily() ? "Harian" : selectedSubject;
    const typeValue = isHomeroomDaily() ? "walikelas" : "mapel"; // ✅ FIXED: constraint attendance_type_check cuma nerima 'mapel'/'walikelas', bukan 'harian'

    const currentSemester = availableSemesters.find(
      (s) => s.id === selectedSemesterId,
    );

    return students.map((student) => ({
      student_id: student.id,
      teacher_name: teacherName, // ✅ FIXED: kolom aslinya 'teacher_name' (text), bukan 'teacher_id'
      date: date,
      mapel: subjectValue, // ✅ FIXED: kolom aslinya 'mapel', bukan 'subject'
      class: selectedClass, // ✅ FIXED: kolom aslinya 'class', bukan 'class_id'
      type: typeValue,
      status: attendanceStatus[student.id] || "Hadir",
      notes: attendanceNotes[student.id] || null,
      academic_year: currentSemester?.year || null, // ✅ FIXED: kolom aslinya 'academic_year' (text tahun ajaran), bukan 'academic_year_id'
      semester: Number(currentSemester?.semester) === 1 ? "ganjil" : "genap", // ✅ FIXED: constraint 'attendance_semester_check' cuma nerima 'ganjil'/'genap' (lowercase text), bukan angka "1"/"2"
    }));
  };

  const deleteExistingAttendance = async (teacherName, typeValue) => {
    try {
      const currentSemester = availableSemesters.find(
        (s) => s.id === selectedSemesterId,
      );

      let query = supabase
        .from("attendance") // ✅ FIXED: nama tabel aslinya singular, bukan 'attendances'
        .delete()
        .eq("teacher_name", teacherName) // ✅ FIXED: kolom aslinya 'teacher_name' (text), bukan 'teacher_id'
        .eq("date", date)
        .eq("type", typeValue)
        .eq("class", selectedClass); // ✅ FIXED: kolom aslinya 'class', bukan 'class_id'

      if (selectedSemesterId) {
        query = query.eq("academic_year", currentSemester?.year); // ✅ FIXED: kolom aslinya 'academic_year' (text), bukan 'academic_year_id'
      }

      const { error } = await query;

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting existing attendance:", error);
      throw error;
    }
  };

  const saveAttendanceData = async (attendanceData) => {
    const BATCH_SIZE = 5;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < attendanceData.length; i += BATCH_SIZE) {
      const batch = attendanceData.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("attendance").insert(batch); // ✅ FIXED: nama tabel aslinya singular, bukan 'attendances'

      if (error) {
        console.error(
          `Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
          error,
        );
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    return { successCount, errorCount };
  };

  const processAttendanceSubmission = async () => {
    const dateValidation = validateDate();
    if (!dateValidation.valid) {
      if (onShowToast) {
        onShowToast(dateValidation.message, "error");
      }
      return;
    }

    if (isReadOnlyMode) {
      if (onShowToast) {
        onShowToast(
          "🔒 Semester ini dalam mode View Only. Ganti ke semester aktif untuk input data baru!",
          "error",
        );
      }
      return;
    }

    if (!teacherId || !selectedSubject || !selectedClass) {
      if (onShowToast) {
        onShowToast("Pilih mata pelajaran dan kelas terlebih dahulu!", "error");
      }
      return;
    }

    if (!selectedSemesterId) {
      if (onShowToast) {
        onShowToast("Tidak ada semester yang dipilih!", "error");
      }
      return;
    }

    if (students.length === 0) {
      if (onShowToast) {
        onShowToast("Tidak ada siswa untuk diabsen!", "error");
      }
      return;
    }

    setLoading(true);

    try {
      // ✅ SIMPLIFIED: tabel 'attendance' nyimpen nama guru langsung (teks),
      // jadi nggak perlu lagi lookup UUID dari tabel 'users'
      const teacherName = user?.full_name || user?.nama;
      if (!teacherName) {
        throw new Error("Nama guru tidak ditemukan di data user");
      }

      const typeValue = isHomeroomDaily() ? "walikelas" : "mapel"; // ✅ FIXED: constraint attendance_type_check cuma nerima 'mapel'/'walikelas', bukan 'harian'

      const existingData = await checkExistingAttendance(
        teacherName,
        typeValue,
      );

      if (existingData && existingData.length > 0) {
        const attendanceData = prepareAttendanceData(teacherName);
        setPendingAttendanceData(attendanceData);
        setExistingAttendanceData(existingData);
        setShowConfirmModal(true);
        setLoading(false);
        return;
      }

      const attendanceData = prepareAttendanceData(teacherName);
      const { successCount, errorCount } =
        await saveAttendanceData(attendanceData);

      if (errorCount > 0) {
        throw new Error(
          `Berhasil menyimpan ${successCount} data, gagal ${errorCount} data.`,
        );
      }

      handleSaveSuccess(successCount);
    } catch (error) {
      console.error("Error saving attendance:", error);
      if (onShowToast) {
        onShowToast("Gagal menyimpan presensi: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverwriteConfirmation = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      // ✅ SIMPLIFIED: tabel 'attendance' nyimpen nama guru langsung (teks),
      // jadi nggak perlu lagi lookup UUID dari tabel 'users'
      const teacherName = user?.full_name || user?.nama;
      if (!teacherName) {
        throw new Error("Nama guru tidak ditemukan di data user");
      }

      const typeValue = isHomeroomDaily() ? "walikelas" : "mapel"; // ✅ FIXED: constraint attendance_type_check cuma nerima 'mapel'/'walikelas', bukan 'harian'

      await deleteExistingAttendance(teacherName, typeValue);
      const { successCount, errorCount } = await saveAttendanceData(
        pendingAttendanceData,
      );

      if (errorCount > 0) {
        throw new Error(
          `Berhasil menyimpan ${successCount} data, gagal ${errorCount} data.`,
        );
      }

      handleSaveSuccess(successCount);
    } catch (error) {
      console.error("Error overwriting attendance:", error);
      if (onShowToast) {
        onShowToast("Gagal menimpa presensi: " + error.message, "error");
      }
    } finally {
      setLoading(false);
      setPendingAttendanceData(null);
      setExistingAttendanceData(null);
    }
  };

  const handleCancelOverwrite = () => {
    setShowConfirmModal(false);
    setPendingAttendanceData(null);
    setExistingAttendanceData(null);

    if (onShowToast) {
      onShowToast("Penyimpanan dibatalkan", "info");
    }
  };

  const handleSaveSuccess = (successCount) => {
    const currentSemester = availableSemesters.find(
      (s) => s.id === selectedSemesterId,
    );

    if (onShowToast) {
      onShowToast(
        `Presensi berhasil disimpan untuk ${successCount} siswa pada ${
          isHomeroomDaily() ? "presensi harian" : selectedSubject
        } tanggal ${date}${
          currentSemester
            ? ` (${currentSemester.year} - Semester ${currentSemester.semester})`
            : ""
        }`,
        "success",
      );
    }

    // ✅ Reset states after successful save
    const newStatus = {};
    students.forEach((student) => {
      newStatus[student.id] = "Hadir";
    });
    setAttendanceStatus(newStatus);
    setAttendanceNotes({});
    setHasUserInteracted(true); // ✅ Keep as interacted (data sudah tersimpan)
  };

  // ========== RENDER LOGIC ==========
  if (authLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-blue-600 dark:text-blue-400 text-lg animate-pulse">
            Memeriksa autentikasi...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">
            Anda harus login untuk mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
      {/* READ-ONLY MODE WARNING */}
      {isReadOnlyMode && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mb-6 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border-2 border-amber-300 dark:border-amber-600 rounded-2xl p-5 shadow-sm transition-colors duration-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-amber-800 dark:text-amber-300 mb-2">
                Mode View Only (Read-Only)
              </h3>
              <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                Semester ini tidak aktif. Anda hanya bisa{" "}
                <strong>melihat data</strong>. Untuk input presensi baru, pilih
                semester yang sedang aktif.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Component */}
      <AttendanceFilters
        subjects={subjects}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        classes={classes}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        date={date}
        setDate={handleDateChange}
        loading={loading}
        teacherId={teacherId}
        isHomeroomDaily={isHomeroomDaily}
        setStudents={setStudents}
        setStudentsLoaded={setStudentsLoaded}
        activeAcademicInfo={activeAcademicInfo}
        selectedSemesterId={selectedSemesterId}
        availableSemesters={availableSemesters}
        onSemesterChange={handleSemesterChange}
        isReadOnlyMode={isReadOnlyMode}
        teacherAssignment={teacherAssignment} // ✅ PASS teacherAssignment ke filters jika dibutuhkan
      />

      {/* Conditional Rendering */}
      {students.length > 0 && (
        <>
          {/* ✅ ATTENDANCE STATS - Summary Cards */}
          <AttendanceStats
            attendanceStatus={attendanceStatus}
            students={students}
          />

          {/* Action Buttons & Search */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6 lg:mb-8">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Cari siswa (nama/NIS)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3.5 sm:py-3 text-base border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:ring-3 focus:ring-blue-500/30 dark:focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 shadow-sm"
              />
              <span className="absolute right-4 top-3.5 text-blue-500 dark:text-blue-400 text-xl">
                🔍
              </span>
            </div>

            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <button
                className="flex-1 sm:flex-none min-h-[52px] px-5 py-3 text-base font-medium bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                onClick={setAllHadir}
                disabled={loading || isReadOnlyMode}
                title={
                  isReadOnlyMode ? "Tidak bisa edit di semester non-aktif" : ""
                }
                style={{ minWidth: "140px" }}>
                ✅ Hadir Semua
              </button>

              <button
                className={`flex-1 sm:flex-none min-h-[52px] px-5 py-3 text-base font-semibold rounded-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                  isReadOnlyMode
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 border-2 border-gray-400 dark:border-gray-600 text-white"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 border-2 border-emerald-500 dark:border-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800"
                }`}
                onClick={processAttendanceSubmission}
                disabled={
                  loading ||
                  !selectedSubject ||
                  !selectedClass ||
                  !selectedSemesterId ||
                  students.length === 0 ||
                  !hasUserInteracted || // ✅ FIXED: Cek apakah user sudah interact
                  isReadOnlyMode
                }
                title={
                  isReadOnlyMode
                    ? "Tidak bisa input di semester non-aktif"
                    : !hasUserInteracted
                      ? "Silakan input status presensi siswa terlebih dahulu"
                      : ""
                }
                style={{ minWidth: "180px" }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Menyimpan...
                  </span>
                ) : isReadOnlyMode ? (
                  "🔒 View Only Mode"
                ) : (
                  "💾 Simpan Presensi"
                )}
              </button>
            </div>
          </div>

          {/* Table Component */}
          <AttendanceTable
            filteredStudents={filteredStudents}
            classes={classes}
            selectedClass={selectedClass}
            searchTerm={searchTerm}
            attendanceStatus={attendanceStatus}
            attendanceNotes={attendanceNotes}
            loading={loading}
            handleStatusChange={handleStatusChange}
            handleNotesChange={handleNotesChange}
            teacherAssignment={teacherAssignment} // ✅ PASS teacherAssignment ke table jika dibutuhkan
          />
        </>
      )}

      {/* Empty States */}
      {selectedClass && students.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-colors duration-200">
          <div className="text-5xl mb-4 text-slate-300 dark:text-slate-600">
            📚
          </div>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Tidak ada siswa aktif di kelas ini
          </p>
        </div>
      )}

      {!selectedClass &&
        selectedSubject &&
        classes.length === 0 &&
        !isHomeroomDaily() && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-colors duration-200">
            <div className="text-5xl mb-4 text-slate-300 dark:text-slate-600">
              🏫
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              {selectedSemesterId
                ? `Tidak ada kelas untuk "${selectedSubject}" di semester yang dipilih`
                : "Pilih semester terlebih dahulu"}
            </p>
          </div>
        )}

      {!selectedSubject && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-colors duration-200">
          <div className="text-5xl mb-4 text-slate-300 dark:text-slate-600">
            📚
          </div>
        </div>
      )}

      {/* CONFIRM OVERWRITE MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Data Presensi Sudah Ada!
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Presensi untuk tanggal <strong>{date}</strong> sudah tercatat.
                <br />
                Apakah Anda ingin menimpa data yang ada?
              </p>
            </div>

            {existingAttendanceData && existingAttendanceData.length > 0 && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">
                  Data Presensi yang Ada:
                </p>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <p>• Total siswa: {existingAttendanceData.length}</p>
                  <p>
                    • Hadir:{" "}
                    {
                      existingAttendanceData.filter((d) => d.status === "Hadir")
                        .length
                    }
                  </p>
                  <p>
                    • Sakit:{" "}
                    {
                      existingAttendanceData.filter((d) => d.status === "Sakit")
                        .length
                    }
                  </p>
                  <p>
                    • Izin:{" "}
                    {
                      existingAttendanceData.filter((d) => d.status === "Izin")
                        .length
                    }
                  </p>
                  <p>
                    • Alpha:{" "}
                    {
                      existingAttendanceData.filter((d) => d.status === "Alpha")
                        .length
                    }
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelOverwrite}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50">
                Batal
              </button>
              <button
                onClick={handleOverwriteConfirmation}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50">
                {loading ? "Menyimpan..." : "Ya, Timpa Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
