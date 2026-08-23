// settings/SystemTab.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Table,
  FileText,
  Database,
} from "lucide-react";

// Daftar semua tabel yang di-backup/restore/export.
// Urutan di list ini JUGA dipakai buat urutan INSERT pas restore (induk -> anak).
// Delete pas restore pakai urutan KEBALIKANNYA (anak -> induk), biar gak
// nabrak foreign key constraint.
const ALL_TABLES = [
  // Induk / data inti
  { name: "academic_years", display: "Tahun Ajaran", group: "Data Inti" },
  {
    name: "school_settings",
    display: "Pengaturan Sekolah",
    group: "Data Inti",
  },
  { name: "users", display: "Data Pengguna", group: "Data Inti" },
  { name: "event_categories", display: "Kategori Event", group: "Data Inti" },
  { name: "classes", display: "Data Kelas", group: "Data Inti" },
  { name: "students", display: "Data Siswa", group: "Data Inti" },

  // Penugasan & jadwal
  {
    name: "teacher_assignments",
    display: "Penugasan Guru",
    group: "Penugasan & Jadwal",
  },
  {
    name: "teacher_schedules",
    display: "Jadwal Guru",
    group: "Penugasan & Jadwal",
  },
  {
    name: "class_schedules",
    display: "Jadwal Kelas",
    group: "Penugasan & Jadwal",
  },
  {
    name: "teaching_journal",
    display: "Jurnal Mengajar",
    group: "Penugasan & Jadwal",
  },

  // Kehadiran & nilai
  {
    name: "attendance",
    display: "Kehadiran Siswa",
    group: "Kehadiran & Nilai",
  },
  {
    name: "teacher_attendance",
    display: "Kehadiran Guru",
    group: "Kehadiran & Nilai",
  },
  { name: "grades", display: "Data Nilai", group: "Kehadiran & Nilai" },
  {
    name: "grades_katrol",
    display: "Nilai Katrol",
    group: "Kehadiran & Nilai",
  },
  {
    name: "grades_katrol_settings",
    display: "Pengaturan Katrol",
    group: "Kehadiran & Nilai",
  },

  // Kegiatan kelas
  {
    name: "class_organization",
    display: "Struktur Organisasi Kelas",
    group: "Kegiatan Kelas",
  },
  {
    name: "duty_schedules",
    display: "Layout Jadwal Piket",
    group: "Kegiatan Kelas",
  },
  {
    name: "piket_schedule",
    display: "Jadwal Piket Siswa",
    group: "Kegiatan Kelas",
  },
  {
    name: "seating_charts",
    display: "Denah Tempat Duduk",
    group: "Kegiatan Kelas",
  },

  // Akademik & kalender
  {
    name: "academic_events",
    display: "Agenda Akademik",
    group: "Akademik & Kalender",
  },
  {
    name: "kaldik_documents",
    display: "Dokumen Kaldik",
    group: "Akademik & Kalender",
  },

  // Siswa tambahan
  {
    name: "student_development_notes",
    display: "Catatan Perkembangan Siswa",
    group: "Data Siswa Tambahan",
  },
  {
    name: "student_devices",
    display: "Perangkat Siswa",
    group: "Data Siswa Tambahan",
  },
  {
    name: "student_profile_details",
    display: "Detail Profil Siswa",
    group: "Data Siswa Tambahan",
    pk: "student_id",
  },
  {
    name: "saran_masukan",
    display: "Saran & Masukan",
    group: "Data Siswa Tambahan",
  },

  // Komunikasi & sistem
  { name: "pengumuman", display: "Pengumuman", group: "Komunikasi & Sistem" },
  {
    name: "system_health_logs",
    display: "System Health Logs",
    group: "Komunikasi & Sistem",
  },
  {
    name: "cleanup_history",
    display: "Riwayat Cleanup",
    group: "Komunikasi & Sistem",
  },
];

const TOTAL_TABLES = ALL_TABLES.length;

const SystemTab = ({ showToast, loading, setLoading }) => {
  const [schoolSettings, setSchoolSettings] = useState({
    academic_year: "",
    school_name: "SMP Muslimin Cililin",
  });
  const [schoolStats, setSchoolStats] = useState({
    total_students: 0,
    total_teachers: 0,
  });
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [exportProgress, setExportProgress] = useState("");

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (currentMonth >= 7) {
      return `${currentYear + 1}/${currentYear + 2}`;
    } else {
      return `${currentYear}/${currentYear + 1}`;
    }
  };

  useEffect(() => {
    loadSchoolData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);

      const { data: settingsData, error: settingsError } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value");

      if (settingsError) throw settingsError;

      const settings = {};
      settingsData?.forEach((item) => {
        settings[item.setting_key] = item.setting_value;
      });

      setSchoolSettings((prev) => ({
        ...prev,
        academic_year: settings.academic_year || getCurrentAcademicYear(),
        school_name: settings.school_name || prev.school_name,
      }));

      const [teachersRes, studentsRes] = await Promise.all([
        supabase.from("users").select("id").neq("role", "student"),
        supabase.from("students").select("id").eq("is_active", true),
      ]);

      if (teachersRes.error) throw teachersRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setSchoolStats({
        total_students: studentsRes.data?.length || 0,
        total_teachers: teachersRes.data?.length || 0,
      });
    } catch (error) {
      console.error("Error loading school data:", error);
      showToast?.("Error memuat data sekolah", "error");
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return "";

    const validData = data.filter(
      (item) => item !== null && typeof item === "object",
    );
    if (validData.length === 0) return "";

    const headers = Object.keys(validData[0]);
    const csvHeaders = headers.join(",");

    const csvRows = validData.map((row) => {
      return headers
        .map((header) => {
          let value = row[header];
          if (value === null || value === undefined) value = "";
          value = String(value);
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    return [csvHeaders, ...csvRows].join("\n");
  };

  const buildFileName = (tableName) => {
    const schoolName = (
      schoolSettings.school_name || "SMP_Muslimin_Cililin"
    ).replace(/\s+/g, "_");
    const academicYear = (
      schoolSettings.academic_year || getCurrentAcademicYear()
    ).replace("/", "_");
    const date = new Date().toISOString().split("T")[0];
    return `${schoolName}_${tableName}_${academicYear}_${date}.csv`;
  };

  const groupedTables = ALL_TABLES.reduce((acc, table) => {
    if (!acc[table.group]) acc[table.group] = [];
    acc[table.group].push(table);
    return acc;
  }, {});

  const groupColors = {
    "Data Inti": "blue",
    "Penugasan & Jadwal": "indigo",
    "Kehadiran & Nilai": "green",
    "Kegiatan Kelas": "amber",
    "Akademik & Kalender": "cyan",
    "Data Siswa Tambahan": "purple",
    "Komunikasi & Sistem": "gray",
  };

  const colorMap = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    cyan: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-100",
    gray: "bg-gray-50 text-gray-700 hover:bg-gray-100",
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportTableToCSV = async (tableName, displayName) => {
    try {
      setLoading(true);
      setExportProgress(`Mengambil data ${displayName}...`);

      const { data, error } = await supabase.from(tableName).select("*");
      if (error) throw error;

      if (!data || data.length === 0) {
        showToast?.(`Tidak ada data di tabel ${displayName}`, "warning");
        return;
      }

      setExportProgress(`Mengkonversi ${data.length} records...`);
      const csvContent = convertToCSV(data);

      if (!csvContent) {
        showToast?.(`Data ${displayName} tidak valid untuk di-export`, "error");
        return;
      }

      setExportProgress("Membuat file...");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, buildFileName(tableName));

      showToast?.(
        `${displayName} berhasil di-export! (${data.length} records)`,
        "success",
      );
    } catch (error) {
      console.error(`Error exporting ${tableName}:`, error);
      showToast?.(`Error exporting ${displayName}: ${error.message}`, "error");
    } finally {
      setLoading(false);
      setExportProgress("");
    }
  };

  const exportAllTablesToCSV = async () => {
    try {
      setLoading(true);
      let exportedCount = 0;

      for (let i = 0; i < ALL_TABLES.length; i++) {
        const table = ALL_TABLES[i];
        try {
          setExportProgress(
            `Exporting ${table.display} (${i + 1}/${TOTAL_TABLES})...`,
          );

          const { data, error } = await supabase.from(table.name).select("*");
          if (error) {
            console.error(`Error fetching ${table.name}:`, error);
            continue;
          }

          if (data && data.length > 0) {
            const csvContent = convertToCSV(data);
            if (csvContent) {
              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              downloadBlob(blob, buildFileName(table.name));
              exportedCount++;
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        } catch (tableError) {
          console.error(`Error exporting ${table.name}:`, tableError);
        }
      }

      if (exportedCount > 0) {
        showToast?.(
          `✅ ${exportedCount} tabel berhasil di-export ke CSV!`,
          "success",
        );
      } else {
        showToast?.("Tidak ada data untuk di-export", "warning");
      }
    } catch (error) {
      console.error("Error exporting all tables:", error);
      showToast?.("Error exporting data", "error");
    } finally {
      setLoading(false);
      setExportProgress("");
    }
  };

  const handleRestoreFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setRestoreFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);

          if (!backupData.data || !backupData.stats) {
            throw new Error("Format backup tidak valid");
          }

          setRestorePreview({
            timestamp: backupData.timestamp,
            academic_year: backupData.academic_year,
            school_info: backupData.school_info,
            stats: backupData.stats,
          });
        } catch (error) {
          showToast?.(
            "Format file backup tidak valid: " + error.message,
            "error",
          );
          setRestoreFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const executeRestore = async () => {
    if (!restoreFile) return;

    const statsLines = ALL_TABLES.map(
      (table) =>
        `- ${restorePreview.stats?.[`total_${table.name}`] || 0} ${table.display.toLowerCase()}`,
    ).join("\n");

    const confirmed = window.confirm(
      `PERINGATAN: Restore akan menimpa semua data yang ada!\n\n` +
        `Backup dari: ${new Date(restorePreview.timestamp).toLocaleString("id-ID")}\n` +
        `Tahun Ajaran: ${restorePreview.academic_year}\n` +
        `Sekolah: ${restorePreview.school_info?.school_name}\n\n` +
        `Data yang akan di-restore:\n${statsLines}\n\n` +
        `Tindakan ini TIDAK DAPAT DIBATALKAN. Apakah Anda yakin?`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setExportProgress("Membaca file backup...");

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);

          // Hapus data lama: urutan ANAK -> INDUK (kebalikan dari ALL_TABLES)
          const deleteOrder = [...ALL_TABLES].reverse();
          for (let i = 0; i < deleteOrder.length; i++) {
            const table = deleteOrder[i];
            setExportProgress(
              `Menghapus data lama (${i + 1}/${TOTAL_TABLES})...`,
            );
            const pkColumn = table.pk || "id";
            const { error } = await supabase
              .from(table.name)
              .delete()
              .neq(pkColumn, "00000000-0000-0000-0000-000000000000");
            if (error) console.error(`Error deleting ${table.name}:`, error);
          }

          // Insert data baru: urutan INDUK -> ANAK (sesuai ALL_TABLES)
          let insertedTables = 0;
          for (let i = 0; i < ALL_TABLES.length; i++) {
            const table = ALL_TABLES[i];
            const rows = backupData.data?.[table.name];
            if (rows?.length > 0) {
              insertedTables++;
              setExportProgress(
                `Restore ${table.display} (${insertedTables}/${TOTAL_TABLES})...`,
              );
              const { error } = await supabase.from(table.name).insert(rows);
              if (error) console.error(`Error inserting ${table.name}:`, error);
            }
          }

          showToast?.("✅ Database berhasil di-restore!", "success");
          setRestoreFile(null);
          setRestorePreview(null);

          setExportProgress("Memuat ulang data...");
          await loadSchoolData();
        } catch (error) {
          console.error("Error restoring backup:", error);
          showToast?.("❌ Error restoring database: " + error.message, "error");
        } finally {
          setLoading(false);
          setExportProgress("");
        }
      };

      reader.readAsText(restoreFile);
    } catch (error) {
      console.error("Error reading restore file:", error);
      showToast?.("Error membaca file backup", "error");
      setLoading(false);
      setExportProgress("");
    }
  };

  const exportDatabaseBackup = async () => {
    try {
      setLoading(true);
      setExportProgress("Mengambil data dari database...");

      const results = {};
      const errors = [];

      for (let i = 0; i < ALL_TABLES.length; i++) {
        const table = ALL_TABLES[i];
        setExportProgress(
          `Mengambil ${table.display} (${i + 1}/${TOTAL_TABLES})...`,
        );
        const { data, error } = await supabase.from(table.name).select("*");
        if (error) {
          errors.push(`${table.name}: ${error.message}`);
        }
        results[table.name] = data || [];
      }

      if (errors.length > 0) {
        throw new Error(`Gagal mengambil sebagian tabel: ${errors.join(", ")}`);
      }

      setExportProgress("Membuat file backup...");

      const stats = {};
      ALL_TABLES.forEach((table) => {
        stats[`total_${table.name}`] = results[table.name]?.length || 0;
      });

      const backupData = {
        timestamp: new Date().toISOString(),
        academic_year: schoolSettings.academic_year || getCurrentAcademicYear(),
        school_info: schoolSettings,
        data: results,
        stats,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const schoolName = (
        schoolSettings.school_name || "SMP_Muslimin_Cililin"
      ).replace(/\s+/g, "_");
      const academicYear = (
        schoolSettings.academic_year || getCurrentAcademicYear()
      ).replace("/", "_");
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `${schoolName}_backup_${academicYear}_${date}.json`);

      showToast?.("✅ Database backup berhasil didownload!", "success");
    } catch (error) {
      console.error("Error creating backup:", error);
      showToast?.(
        "❌ Error membuat database backup: " + error.message,
        "error",
      );
    } finally {
      setLoading(false);
      setExportProgress("");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          Management System
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Backup & Restore Database — {schoolSettings.school_name}
        </p>

        {exportProgress && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="animate-spin text-blue-600" size={20} />
              <span className="text-sm sm:text-base text-blue-800 font-medium">
                {exportProgress}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Export per Tabel */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-blue-600" size={20} />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            Export Data ke CSV
          </h3>
        </div>
        <p className="text-gray-600 mb-5 text-sm sm:text-base">
          Export data per tabel ke format CSV untuk analisis atau backup
          selektif.
        </p>

        {Object.entries(groupedTables).map(([groupName, tables]) => {
          const color = groupColors[groupName] || "gray";
          return (
            <div key={groupName} className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {groupName}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => exportTableToCSV(table.name, table.display)}
                    disabled={loading}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-lg disabled:opacity-50 font-medium transition-colors min-h-[44px] ${colorMap[color]}`}>
                    <Table size={16} />
                    <span className="truncate">Export {table.display}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <button
          onClick={exportAllTablesToCSV}
          disabled={loading}
          className="flex items-center justify-center gap-3 px-5 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold transition-colors w-full min-h-[44px] mt-2">
          <FileText size={20} />
          <span className="text-base">
            {loading
              ? "Exporting..."
              : `Export Semua Tabel (${TOTAL_TABLES} Tabel)`}
          </span>
        </button>
      </div>

      {/* Database Backup */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Download className="text-blue-600" size={20} />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            Database Backup (JSON)
          </h3>
        </div>
        <p className="text-gray-600 mb-5 text-sm sm:text-base">
          Download backup lengkap database untuk keperluan keamanan dan migrasi
          data.
        </p>

        <button
          onClick={exportDatabaseBackup}
          disabled={loading}
          className="flex items-center justify-center gap-3 px-5 sm:px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold transition-colors w-full sm:w-auto min-h-[44px] mb-5">
          <Download size={20} />
          <span className="text-base">
            {loading ? "Membuat Backup..." : "Download Backup Database (JSON)"}
          </span>
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-3">
            ℹ️ Backup akan berisi semua data dari {TOTAL_TABLES} tabel:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700">
            {ALL_TABLES.map((table) => (
              <div key={table.name} className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>{table.display}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database Restore */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="text-red-600" size={20} />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            Database Restore
          </h3>
        </div>
        <p className="text-gray-600 mb-5 text-sm sm:text-base">
          Upload dan restore backup database.{" "}
          <span className="text-red-600 font-bold">
            PERHATIAN: Ini akan menimpa semua data yang ada!
          </span>
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Backup File (.json)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer"
            />
          </div>

          {restorePreview && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle
                  className="text-yellow-600 flex-shrink-0 mt-1"
                  size={20}
                />
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-800 text-base mb-3">
                    ⚠️ Backup File Preview
                  </h4>
                  <div className="text-sm text-yellow-700 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p>
                        <strong className="block text-xs">
                          Tanggal Backup:
                        </strong>
                        {new Date(restorePreview.timestamp).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                      <p>
                        <strong className="block text-xs">Tahun Ajaran:</strong>
                        {restorePreview.academic_year}
                      </p>
                      <p>
                        <strong className="block text-xs">Sekolah:</strong>
                        {restorePreview.school_info?.school_name}
                      </p>
                      <p>
                        <strong className="block text-xs">
                          Total Records:
                        </strong>
                        {Object.values(restorePreview.stats || {}).reduce(
                          (sum, n) => sum + (n || 0),
                          0,
                        )}{" "}
                        records
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-5">
                    <button
                      onClick={executeRestore}
                      disabled={loading}
                      className="flex items-center justify-center gap-3 px-5 py-3.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-bold transition-colors min-h-[44px]">
                      {loading ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          <span>Restoring...</span>
                        </>
                      ) : (
                        "Execute Restore"
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setRestoreFile(null);
                        setRestorePreview(null);
                      }}
                      disabled={loading}
                      className="px-5 py-3.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium transition-colors min-h-[44px]">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informasi Sistem */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-blue-600" size={20} />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            Informasi Sistem
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Database
            </label>
            <p className="text-sm font-medium text-gray-800">
              Supabase PostgreSQL
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Total Pengguna
            </label>
            <p className="text-sm font-medium text-gray-800">
              {schoolStats.total_students + schoolStats.total_teachers} pengguna
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Tahun Ajaran
            </label>
            <p className="text-sm font-medium text-gray-800">
              {schoolSettings.academic_year}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Nama Sekolah
            </label>
            <p className="text-sm font-medium text-gray-800">
              {schoolSettings.school_name}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              👨‍🏫 {schoolStats.total_teachers} guru
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
            <span className="text-sm font-medium text-green-700">
              👨‍🎓 {schoolStats.total_students} siswa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTab;
