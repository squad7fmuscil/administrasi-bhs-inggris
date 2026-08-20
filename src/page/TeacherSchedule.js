import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Upload,
  LayoutGrid,
  List,
  Save,
} from "lucide-react";
import TeacherScheduleExcel from "./TeacherScheduleExcel";
import { getActiveAcademicInfo } from "../services/academicYearService";

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

const TeacherSchedule = ({ user }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [academicInfo, setAcademicInfo] = useState(null);
  const [academicLoading, setAcademicLoading] = useState(true);

  // Inline editing di grid (klik cell langsung isi jadwal)
  const [editingCell, setEditingCell] = useState(null); // { day, period }
  const [selectedClass, setSelectedClass] = useState("");

  const [formData, setFormData] = useState({
    day: "Senin",
    start_period: "1",
    end_period: "1",
    class_id: "",
  });

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  // Load info tahun ajaran aktif dulu sebelum fetch jadwal
  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        setAcademicLoading(true);
        const info = await getActiveAcademicInfo();
        setAcademicInfo(info);
      } catch (err) {
        console.error("Error loading academic info:", err);
        setError("Gagal memuat informasi tahun ajaran");
      } finally {
        setAcademicLoading(false);
      }
    };
    loadAcademicData();
  }, []);

  useEffect(() => {
    if (user && user.id && academicInfo) {
      fetchSchedules();
      fetchClasses();
    }
  }, [user, academicInfo]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // ✅ PAKE user.id (UUID) bukan user.teacher_id (string)
      const { data, error } = await supabase
        .from("teacher_schedules")
        .select("*")
        .eq("teacher_id", user.id)
        .order("day")
        .order("start_time");

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      setError("Gagal memuat jadwal: " + err.message);
      console.error("Fetch schedules error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH CLASSES - Ambil dari teacher_assignments sesuai guru yang login
  const fetchClasses = async () => {
    try {
      // Ambil class_id dari teacher_assignments berdasarkan teacher_id guru
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select("class_id")
        .eq("teacher_id", user.teacher_id) // Pake user.teacher_id (string) bukan user.id (UUID)
        .order("class_id");

      if (error) throw error;

      // Get unique class_id saja
      const uniqueClasses = [...new Set(data.map((item) => item.class_id))]
        .filter(Boolean) // Remove null/undefined
        .sort((a, b) => {
          // Sort by grade number if format is like "7A", "7B", "8A"
          const gradeA = parseInt(a.match(/\d+/)?.[0] || 0);
          const gradeB = parseInt(b.match(/\d+/)?.[0] || 0);
          if (gradeA !== gradeB) return gradeA - gradeB;
          return a.localeCompare(b);
        })
        .map((class_id) => ({ id: class_id, class_id }));

      setClasses(uniqueClasses);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Gagal memuat kelas: " + err.message);
    }
  };

  // ✅ INLINE EDIT: klik cell di grid untuk langsung isi/ubah jadwal
  const handleCellClick = (day, period) => {
    // Skip Senin Jam 1 (Upacara)
    if (day === "Senin" && period === "1") return;

    const existing = schedules.find(
      (s) =>
        s.day === day &&
        findPeriodsByTimeRange(s.day, s.start_time, s.end_time).includes(
          period,
        ),
    );

    setEditingCell({ day, period });
    setSelectedClass(existing ? existing.class_id : "");
  };

  const handleInlineSave = async () => {
    if (!editingCell) return;

    const { day, period } = editingCell;
    const daySchedule = JAM_SCHEDULE[day];
    const startTime = daySchedule[period].start;
    const endTime = daySchedule[period].end;

    const existing = schedules.find(
      (s) =>
        s.day === day &&
        findPeriodsByTimeRange(s.day, s.start_time, s.end_time).includes(
          period,
        ),
    );

    try {
      if (selectedClass === "") {
        // Kosongkan -> hapus jadwal
        if (existing) {
          const { error } = await supabase
            .from("teacher_schedules")
            .delete()
            .eq("id", existing.id);
          if (error) throw error;
          setSuccess("Jadwal berhasil dihapus");
        }
      } else {
        const scheduleData = {
          day,
          start_time: startTime,
          end_time: endTime,
          class_id: selectedClass,
          teacher_id: user.id,
        };

        if (existing) {
          const { error } = await supabase
            .from("teacher_schedules")
            .update(scheduleData)
            .eq("id", existing.id);
          if (error) throw error;
          setSuccess("Jadwal berhasil diperbarui");
        } else {
          const { error } = await supabase
            .from("teacher_schedules")
            .insert(scheduleData);
          if (error) throw error;
          setSuccess("Jadwal berhasil ditambahkan");
        }
      }

      fetchSchedules();
      setEditingCell(null);
      setSelectedClass("");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError("Gagal menyimpan: " + err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleInlineCancel = () => {
    setEditingCell(null);
    setSelectedClass("");
  };

  // ✅ FUNGSI SIMPAN DATA IMPORT
  const saveImportedSchedules = async (importedSchedules) => {
    try {
      // ✅ PAKE user.id (UUID)
      const { error: deleteError } = await supabase
        .from("teacher_schedules")
        .delete()
        .eq("teacher_id", user.id);

      if (deleteError) throw deleteError;

      // Insert jadwal baru
      const { error: insertError } = await supabase
        .from("teacher_schedules")
        .insert(importedSchedules);

      if (insertError) throw insertError;

      return {
        success: true,
        message: `Berhasil menyimpan ${importedSchedules.length} jadwal`,
      };
    } catch (error) {
      throw new Error("Gagal menyimpan jadwal import: " + error.message);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const result = await TeacherScheduleExcel.exportToExcel(
        schedules,
        user,
        days,
        academicInfo,
      );

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Gagal export ke Excel: " + err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleImportFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // ✅ KIRIM UUID, BUKAN TEACHER_ID STRING
      const result = await TeacherScheduleExcel.importFromExcel(
        file,
        user.id,
        academicInfo,
      );

      if (result.success) {
        if (result.schedules && result.schedules.length > 0) {
          // ✅ VALIDASI & FIX teacher_id jadi UUID
          const schedulesWithUUID = result.schedules.map((schedule) => ({
            ...schedule,
            teacher_id: user.id, // FORCE PAKE UUID
          }));

          const saveResult = await saveImportedSchedules(schedulesWithUUID);
          if (saveResult.success) {
            setSuccess(`${result.message} ${saveResult.message}`);
          } else {
            setError(saveResult.message);
          }
        } else {
          setSuccess(result.message);
        }

        setTimeout(() => {
          setSuccess(null);
          setError(null);
        }, 4000);

        fetchSchedules();
      } else {
        setError(result.message);
        setTimeout(() => setError(null), 4000);
      }
    } catch (err) {
      setError("Gagal import dari Excel: " + err.message);
      console.error("Import error:", err);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await TeacherScheduleExcel.downloadTemplate(
        user,
        academicInfo,
      );
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Gagal download template: " + err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const generateScheduleGrid = () => {
    const grid = {};

    days.forEach((day) => {
      grid[day] = {};

      const daySchedule = JAM_SCHEDULE[day];
      if (daySchedule) {
        Object.keys(daySchedule).forEach((period) => {
          grid[day][period] = null;
        });
      }

      schedules
        .filter((schedule) => schedule.day === day)
        .forEach((schedule) => {
          const periods = findPeriodsByTimeRange(
            day,
            schedule.start_time,
            schedule.end_time,
          );
          periods.forEach((period) => {
            grid[day][period] = schedule;
          });
        });
    });

    return grid;
  };

  const findPeriodsByTimeRange = (day, startTime, endTime) => {
    const daySchedule = JAM_SCHEDULE[day];
    if (!daySchedule) return [];

    const periods = [];
    const targetStart = timeToMinutes(startTime);
    const targetEnd = timeToMinutes(endTime);

    for (const [period, timeRange] of Object.entries(daySchedule)) {
      const periodStart = timeToMinutes(timeRange.start);
      const periodEnd = timeToMinutes(timeRange.end);

      if (periodStart >= targetStart && periodEnd <= targetEnd) {
        periods.push(period);
      }
    }

    return periods;
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getPeriodFromTime = (day, startTime, endTime) => {
    const periods = findPeriodsByTimeRange(day, startTime, endTime);
    return {
      startPeriod: periods[0] || "1",
      endPeriod: periods[periods.length - 1] || "1",
    };
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingId(schedule.id);
      const { startPeriod, endPeriod } = getPeriodFromTime(
        schedule.day,
        schedule.start_time,
        schedule.end_time,
      );
      setFormData({
        day: schedule.day,
        start_period: startPeriod,
        end_period: endPeriod,
        class_id: schedule.class_id,
      });
    } else {
      setEditingId(null);
      setFormData({
        day: "Senin",
        start_period: "1",
        end_period: "1",
        class_id: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.class_id) {
      setError("Kelas harus dipilih");
      return;
    }

    if (parseInt(formData.start_period) > parseInt(formData.end_period)) {
      setError("Jam mulai harus lebih awal dari jam selesai");
      return;
    }

    setLoading(true);

    try {
      const daySchedule = JAM_SCHEDULE[formData.day];
      const startTime = daySchedule[formData.start_period].start;
      const endTime = daySchedule[formData.end_period].end;

      const scheduleData = {
        day: formData.day,
        start_time: startTime,
        end_time: endTime,
        class_id: formData.class_id,
        teacher_id: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("teacher_schedules")
          .update(scheduleData)
          .eq("id", editingId);
        if (error) throw error;
        setSuccess("Jadwal berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("teacher_schedules")
          .insert(scheduleData);
        if (error) throw error;
        setSuccess("Jadwal berhasil ditambahkan");
      }

      handleCloseModal();
      fetchSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Gagal menyimpan jadwal: " + err.message);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("teacher_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setSuccess("Jadwal berhasil dihapus");
      fetchSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Gagal menghapus jadwal");
    } finally {
      setLoading(false);
    }
  };

  const getTodaySchedules = () => {
    const today = days[new Date().getDay() - 1] || "Senin";
    return schedules.filter((s) => s.day === today);
  };

  const getGroupedTodaySchedules = () => {
    const todaySchedules = getTodaySchedules();
    if (todaySchedules.length === 0) return [];

    const sorted = [...todaySchedules].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );

    const groups = [];
    let currentGroup = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = currentGroup[currentGroup.length - 1];

      const isSameClass = current.class_id === last.class_id;
      const lastEndMinutes = timeToMinutes(last.end_time);
      const currentStartMinutes = timeToMinutes(current.start_time);
      const isConsecutive =
        Math.abs(currentStartMinutes - lastEndMinutes) <= 30;

      if (isSameClass && isConsecutive) {
        currentGroup.push(current);
      } else {
        groups.push(currentGroup);
        currentGroup = [current];
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const getAvailablePeriods = () => {
    return Object.keys(JAM_SCHEDULE[formData.day] || {});
  };

  const scheduleGrid = generateScheduleGrid();

  if (academicLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-gray-400">
            Memuat informasi tahun ajaran...
          </p>
        </div>
      </div>
    );
  }

  if (!academicInfo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-6 py-4 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-bold">Gagal Memuat Data</h3>
          </div>
          <p>
            Informasi tahun ajaran tidak tersedia. Silakan hubungi
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-gray-100 truncate">
                JADWAL MENGAJAR
              </h1>
              <p className="text-xs sm:text-base text-slate-600 dark:text-gray-400 font-semibold truncate">
                TAHUN AJARAN {academicInfo.year}{" "}
                {academicInfo.semester === 1
                  ? "SEMESTER GANJIL"
                  : "SEMESTER GENAP"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-3 sm:p-4 transition-colors duration-300">
          {/* MOBILE: 2 baris */}
          <div className="block sm:hidden space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 justify-center border transition-all ${
                  viewMode === "grid"
                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                    : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 border-slate-300 dark:border-gray-600"
                }`}>
                <LayoutGrid className="w-4 h-4" />
                Grid
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 justify-center border transition-all ${
                  viewMode === "list"
                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                    : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 border-slate-300 dark:border-gray-600"
                }`}>
                <List className="w-4 h-4" />
                List
              </button>

              <button
                onClick={() => handleOpenModal()}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 justify-center transition-all">
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportToExcel}
                disabled={schedules.length === 0}
                className="flex-1 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-slate-700 dark:text-gray-300 px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 justify-center border border-slate-300 dark:border-gray-600">
                <Download className="w-4 h-4" />
                Export
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="flex-1 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 justify-center border border-slate-300 dark:border-gray-600">
                <Download className="w-4 h-4" />
                Template
              </button>

              <label className="flex-1 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 cursor-pointer text-slate-700 dark:text-gray-300 px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 justify-center border border-slate-300 dark:border-gray-600">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFromExcel}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* DESKTOP: satu baris */}
          <div className="hidden sm:flex flex-row gap-2 sm:gap-3 justify-center flex-wrap">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 min-w-[120px] sm:min-w-[140px] px-3 py-2.5 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border transition-all ${
                viewMode === "grid"
                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                  : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 border-slate-300 dark:border-gray-600 hover:bg-slate-200 dark:hover:bg-gray-600"
              }`}>
              <LayoutGrid className="w-5 h-5" />
              Tampilan Grid
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 min-w-[120px] sm:min-w-[140px] px-3 py-2.5 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border transition-all ${
                viewMode === "list"
                  ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                  : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 border-slate-300 dark:border-gray-600 hover:bg-slate-200 dark:hover:bg-gray-600"
              }`}>
              <List className="w-5 h-5" />
              Tampilan List
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="flex-1 min-w-[120px] sm:min-w-[140px] bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-2.5 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border border-green-300 dark:border-green-700 transition-all"
              title="Untuk jadwal 2+ jam berturut-turut (misal: Jam 2-4)">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Tambah Multi-Jam</span>
              <span className="sm:hidden">Multi-Jam</span>
            </button>

            <button
              onClick={handleExportToExcel}
              disabled={schedules.length === 0}
              className="flex-1 min-w-[120px] sm:min-w-[140px] bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-slate-700 dark:text-gray-300 px-3 py-2.5 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border border-slate-300 dark:border-gray-600">
              <Download className="w-5 h-5" />
              Export Jadwal
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="flex-1 min-w-[120px] sm:min-w-[140px] bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 px-3 py-2.5 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border border-slate-300 dark:border-gray-600">
              <Download className="w-5 h-5" />
              Template Excel
            </button>

            <label className="flex-1 min-w-[120px] sm:min-w-[140px] bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 cursor-pointer text-slate-700 dark:text-gray-300 px-3 py-2.5 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border border-slate-300 dark:border-gray-600">
              <Upload className="w-5 h-5" />
              Import Jadwal
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFromExcel}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg mb-4 sm:mb-6">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-4 sm:mb-6">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Jadwal Hari Ini */}
        {getGroupedTodaySchedules().length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-indigo-200 dark:border-indigo-800 p-3 sm:p-4 mb-6 sm:mb-8 transition-colors duration-300">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="truncate">
                Jadwal Hari Ini ({days[new Date().getDay() - 1] || "Senin"})
              </span>
            </h2>

            <div
              className={`
      grid gap-2
      ${
        getGroupedTodaySchedules().length <= 4
          ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
          : ""
      }
      ${
        getGroupedTodaySchedules().length > 4 &&
        getGroupedTodaySchedules().length <= 6
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3"
          : ""
      }
      ${
        getGroupedTodaySchedules().length > 6
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          : ""
      }
    `}>
              {getGroupedTodaySchedules().map((group, idx) => {
                const first = group[0];
                const last = group[group.length - 1];
                const totalJP = group.length;

                return (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800/60 p-2 rounded-lg min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 truncate">
                          {first.start_time} - {last.end_time}
                        </p>
                        <p className="font-semibold text-slate-800 dark:text-gray-100 text-sm mb-1 truncate">
                          Kelas {first.class_id}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-gray-400 truncate">
                          {totalJP}JP
                          {group.length > 1 &&
                            ` (${
                              findPeriodsByTimeRange(
                                first.day,
                                first.start_time,
                                first.end_time,
                              )[0]
                            }-${findPeriodsByTimeRange(
                              last.day,
                              last.start_time,
                              last.end_time,
                            ).pop()})`}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenModal(first)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0.5"
                          title="Edit">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Hapus sesi Kelas ${first.class_id}?`,
                              )
                            ) {
                              group.forEach((schedule) =>
                                handleDelete(schedule.id),
                              );
                            }
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-0.5"
                          title="Hapus Sesi">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Schedule Grid */}
        {viewMode === "grid" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-3 sm:p-4 transition-colors duration-300">
            {loading && schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-600 dark:text-gray-400">
                Memuat jadwal...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-max">
                  <thead>
                    <tr className="bg-blue-800 dark:bg-blue-900 text-white text-xs sm:text-sm">
                      <th className="p-2 sm:p-3 border border-slate-600 dark:border-gray-600 text-center font-semibold">
                        JAM KE
                      </th>
                      <th className="p-2 sm:p-3 border border-slate-600 dark:border-gray-600 text-center font-semibold">
                        WAKTU*
                      </th>
                      {days.map((day) => (
                        <th
                          key={day}
                          className="p-2 sm:p-3 border border-slate-600 dark:border-gray-600 text-center font-semibold">
                          {day.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(JAM_SCHEDULE.Selasa || {}).map(
                      ([period, time]) => (
                        <React.Fragment key={period}>
                          <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50 text-sm">
                            <td className="p-2 border border-slate-300 dark:border-gray-600 text-center font-semibold bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200">
                              {period}
                            </td>
                            <td
                              className={`p-2 border border-slate-300 dark:border-gray-600 text-center text-xs ${
                                period === "1"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                  : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300"
                              }`}>
                              {time.start} - {time.end}
                              {period === "1" && (
                                <div className="text-[10px] mt-1 text-yellow-600 dark:text-yellow-400">
                                  Senin: {JAM_SCHEDULE.Senin[1].start}-
                                  {JAM_SCHEDULE.Senin[1].end}
                                </div>
                              )}
                            </td>
                            {days.map((day) => {
                              const periodExists =
                                JAM_SCHEDULE[day] && JAM_SCHEDULE[day][period];
                              const isUpacara =
                                day === "Senin" && period === "1";

                              return (
                                <td
                                  key={day}
                                  className={`p-2 border border-slate-300 dark:border-gray-600 text-center ${
                                    periodExists && !isUpacara
                                      ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                      : ""
                                  } ${
                                    !periodExists
                                      ? "bg-gray-100 dark:bg-gray-800"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    periodExists &&
                                    !isUpacara &&
                                    handleCellClick(day, period)
                                  }>
                                  {!periodExists ? (
                                    <span className="text-gray-400 dark:text-gray-600 text-xs">
                                      -
                                    </span>
                                  ) : editingCell &&
                                    editingCell.day === day &&
                                    editingCell.period === period ? (
                                    // Mode inline-edit
                                    <div
                                      className="flex flex-col gap-1"
                                      onClick={(e) => e.stopPropagation()}>
                                      <select
                                        value={selectedClass}
                                        onChange={(e) =>
                                          setSelectedClass(e.target.value)
                                        }
                                        className="w-full px-2 py-1 text-xs sm:text-sm border border-blue-500 dark:border-blue-400 rounded dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus>
                                        <option value="">
                                          -- Kosongkan --
                                        </option>
                                        {classes.map((cls) => (
                                          <option
                                            key={cls.id}
                                            value={cls.class_id}>
                                            {cls.class_id}
                                          </option>
                                        ))}
                                      </select>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={handleInlineSave}
                                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1">
                                          <Save className="w-3 h-3" />
                                          Simpan
                                        </button>
                                        <button
                                          onClick={handleInlineCancel}
                                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs">
                                          Batal
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    // Mode tampilan
                                    <>
                                      {day === "Jumat" ? (
                                        <div className="flex flex-col items-center">
                                          {scheduleGrid[day] &&
                                          scheduleGrid[day][period] ? (
                                            <>
                                              <span className="font-bold text-slate-800 dark:text-gray-100 text-sm sm:text-lg">
                                                {
                                                  scheduleGrid[day][period]
                                                    .class_id
                                                }
                                              </span>
                                              <div className="text-[10px] mt-1 text-blue-600 dark:text-blue-400 font-medium">
                                                {
                                                  JAM_SCHEDULE.Jumat[period]
                                                    ?.start
                                                }
                                                -
                                                {
                                                  JAM_SCHEDULE.Jumat[period]
                                                    ?.end
                                                }
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-slate-400 dark:text-gray-600 text-sm sm:text-lg">
                                                -
                                              </span>
                                              <div className="text-[10px] mt-1 text-blue-600 dark:text-blue-400 font-medium">
                                                {
                                                  JAM_SCHEDULE.Jumat[period]
                                                    ?.start
                                                }
                                                -
                                                {
                                                  JAM_SCHEDULE.Jumat[period]
                                                    ?.end
                                                }
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      ) : scheduleGrid[day] &&
                                        scheduleGrid[day][period] ? (
                                        <span className="font-bold text-slate-800 dark:text-gray-100 text-sm sm:text-lg">
                                          {scheduleGrid[day][period].class_id}
                                        </span>
                                      ) : isUpacara ? (
                                        <span className="font-bold text-slate-800 dark:text-gray-100 text-xs sm:text-base">
                                          UPACARA
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 dark:text-gray-600 text-sm sm:text-lg">
                                          -
                                        </span>
                                      )}
                                    </>
                                  )}
                                </td>
                              );
                            })}
                          </tr>

                          {period === "4" && (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-center text-orange-800 dark:text-orange-300 font-semibold text-xs sm:text-sm">
                                🕛 ISTIRAHAT {time.end} - 10:10 (30 menit)
                              </td>
                            </tr>
                          )}

                          {period === "7" && (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-center text-orange-800 dark:text-orange-300 font-semibold text-xs sm:text-sm">
                                🕛 ISTIRAHAT 12:10 - 13:00 (50 menit)
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ),
                    )}
                  </tbody>
                </table>
                <div className="p-3 bg-slate-50 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 text-center font-bold italic">
                    *Waktu Mengikuti Jadwal Masing-Masing Hari. Senin & Jumat
                    Memiliki Waktu Khusus. Klik cell untuk isi/ubah jadwal.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-gray-100">
                Jadwal Mengajar Mingguan (Tampilan List)
              </h2>
            </div>

            {loading && schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-600 dark:text-gray-400">
                Memuat jadwal...
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-gray-600" />
                <p className="mb-2">Belum ada jadwal</p>
                <p className="text-sm">Klik "Tambah" untuk memulai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-blue-800 dark:bg-blue-900 text-white text-xs sm:text-sm">
                    <tr>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Hari
                      </th>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Jam Ke
                      </th>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Waktu
                      </th>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Kelas
                      </th>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => {
                      const daySchedules = schedules.filter(
                        (s) => s.day === day,
                      );
                      return daySchedules.map((schedule, idx) => {
                        const periods = findPeriodsByTimeRange(
                          day,
                          schedule.start_time,
                          schedule.end_time,
                        );
                        const jamKe =
                          periods.length > 0
                            ? `${periods[0]}${
                                periods.length > 1
                                  ? `-${periods[periods.length - 1]}`
                                  : ""
                              }`
                            : "?";

                        return (
                          <tr
                            key={schedule.id}
                            className="border-b border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 text-sm transition-colors">
                            {idx === 0 && (
                              <td
                                className="px-3 py-3 sm:px-6 font-semibold text-slate-800 dark:text-gray-100"
                                rowSpan={daySchedules.length}>
                                {day}
                              </td>
                            )}
                            <td className="px-3 py-3 sm:px-6 text-slate-700 dark:text-gray-300 font-medium">
                              JP {jamKe}
                            </td>
                            <td className="px-3 py-3 sm:px-6 text-slate-700 dark:text-gray-400">
                              {schedule.start_time} - {schedule.end_time}
                            </td>
                            <td className="px-3 py-3 sm:px-6 font-semibold text-slate-800 dark:text-gray-100">
                              Kelas {schedule.class_id}
                            </td>
                            <td className="px-3 py-3 sm:px-6">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenModal(schedule)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-xs sm:text-sm">
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(schedule.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 text-xs sm:text-sm">
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 flex flex-col transition-colors duration-300">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-gray-100">
                {editingId
                  ? "Edit Jadwal Multi-Jam"
                  : "Tambah Jadwal Multi-Jam"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex-shrink-0">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                💡 Gunakan form ini untuk jadwal{" "}
                <strong>2+ jam berturut-turut</strong> (contoh: Jam 2-4 atau Jam
                5-7). Buat 1 jam pelajaran, klik langsung cell-nya di tampilan
                grid.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0">
              <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Hari
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm sm:text-base border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]">
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Dari Jam Ke
                    </label>
                    <select
                      name="start_period"
                      value={formData.start_period}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-sm sm:text-base border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]">
                      {getAvailablePeriods().map((jam) => (
                        <option key={jam} value={jam}>
                          Jam {jam}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Sampai Jam Ke
                    </label>
                    <select
                      name="end_period"
                      value={formData.end_period}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-sm sm:text-base border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]">
                      {getAvailablePeriods().map((jam) => (
                        <option
                          key={jam}
                          value={jam}
                          disabled={
                            parseInt(jam) < parseInt(formData.start_period)
                          }>
                          Jam {jam}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Kelas
                  </label>
                  <select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm sm:text-base border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]">
                    <option value="">Pilih Kelas</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.class_id}>
                        Kelas {cls.class_id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 sm:pt-6 mt-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-lg font-medium text-sm sm:text-base">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-indigo-400 font-medium text-sm sm:text-base">
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;
