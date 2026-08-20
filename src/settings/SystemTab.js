import React, { useState, useEffect } from "react";
import {
  Wrench,
  Database,
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const SystemTab = () => {
  const [loading, setLoading] = useState(false);
  const [dbStats, setDbStats] = useState({
    totalStudents: 0,
    totalAttendance: 0,
    totalGrades: 0,
    totalNotes: 0,
    databaseSize: "N/A",
  });
  const [healthLogs, setHealthLogs] = useState([]);
  const [cleanupHistory, setCleanupHistory] = useState([]);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      // Load database statistics
      const [students, attendance, grades, notes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true }),
        supabase.from("grades").select("id", { count: "exact", head: true }),
        supabase
          .from("student_notes")
          .select("id", { count: "exact", head: true }),
      ]);

      setDbStats({
        totalStudents: students.count || 0,
        totalAttendance: attendance.count || 0,
        totalGrades: grades.count || 0,
        totalNotes: notes.count || 0,
        databaseSize: "N/A",
      });

      // Load recent health logs
      const { data: logs } = await supabase
        .from("system_health_logs")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(5);

      if (logs) setHealthLogs(logs);

      // Load cleanup history
      const { data: cleanup } = await supabase
        .from("cleanup_history")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(5);

      if (cleanup) setCleanupHistory(cleanup);
    } catch (error) {
      console.error("Error loading system data:", error);
    } finally {
      setLoading(false);
    }
  };

  const runSystemCheck = async () => {
    setLoading(true);
    try {
      const startTime = Date.now();
      const issues = [];
      let criticalCount = 0;
      let warningCount = 0;

      // Check 1: Inactive students
      const { data: inactiveStudents } = await supabase
        .from("students")
        .select("id")
        .eq("is_active", false);

      if (inactiveStudents && inactiveStudents.length > 0) {
        issues.push(`${inactiveStudents.length} siswa tidak aktif`);
        warningCount++;
      }

      // Check 2: Old attendance records (> 2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const { data: oldAttendance } = await supabase
        .from("attendance")
        .select("id")
        .lt("created_at", twoYearsAgo.toISOString());

      if (oldAttendance && oldAttendance.length > 10) {
        issues.push(`${oldAttendance.length} data absensi lama (>2 tahun)`);
        warningCount++;
      }

      // Check 3: Users without homeroom class
      const { data: usersNoClass } = await supabase
        .from("users")
        .select("id")
        .eq("role", "Guru")
        .is("homeroom_class_id", null);

      if (usersNoClass && usersNoClass.length > 0) {
        issues.push(`${usersNoClass.length} guru tanpa kelas`);
        warningCount++;
      }

      const executionTime = Date.now() - startTime;

      // Save health log
      await supabase.from("system_health_logs").insert({
        checked_by: localStorage.getItem("username"),
        total_issues: issues.length,
        critical_count: criticalCount,
        warning_count: warningCount,
        info_count: 0,
        issues_detail: JSON.stringify(issues),
        execution_time: executionTime,
        status:
          criticalCount > 0
            ? "critical"
            : warningCount > 0
            ? "warning"
            : "healthy",
      });

      await loadSystemData();
      alert(
        `Pemeriksaan selesai!\n\nTotal Masalah: ${issues.length}\nKritis: ${criticalCount}\nPeringatan: ${warningCount}\nWaktu: ${executionTime}ms`
      );
    } catch (error) {
      console.error("Error running system check:", error);
      alert("Gagal menjalankan pemeriksaan sistem");
    } finally {
      setLoading(false);
    }
  };

  const cleanupOldData = async () => {
    if (!confirm("Hapus data lama (>2 tahun)? Aksi ini tidak bisa dibatalkan!"))
      return;

    setLoading(true);
    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      // Delete old attendance
      const { data: deleted } = await supabase
        .from("attendance")
        .delete()
        .lt("created_at", twoYearsAgo.toISOString())
        .select();

      const deletedCount = deleted ? deleted.length : 0;

      // Save cleanup history
      await supabase.from("cleanup_history").insert({
        triggered_by: localStorage.getItem("username"),
        results: JSON.stringify({
          deleted_records: deletedCount,
          tables: ["attendance"],
          cutoff_date: twoYearsAgo.toISOString(),
        }),
      });

      await loadSystemData();
      alert(`Berhasil menghapus ${deletedCount} data lama!`);
    } catch (error) {
      console.error("Error cleaning up data:", error);
      alert("Gagal membersihkan data");
    } finally {
      setLoading(false);
    }
  };

  const exportDatabase = () => {
    alert("Fitur export database akan tersedia dalam versi mendatang.");
  };

  if (loading && !dbStats.totalStudents) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Wrench className="w-6 h-6 text-indigo-600" />
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Pemeliharaan Sistem
          </h3>
          <p className="text-sm text-slate-600">
            Monitor kesehatan dan kelola database
          </p>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Siswa</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">
            {dbStats.totalStudents}
          </p>
          <p className="text-xs text-blue-600 mt-1">Total records</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-green-700">Absensi</span>
          </div>
          <p className="text-3xl font-bold text-green-900">
            {dbStats.totalAttendance}
          </p>
          <p className="text-xs text-green-600 mt-1">Total records</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Nilai</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">
            {dbStats.totalGrades}
          </p>
          <p className="text-xs text-purple-600 mt-1">Total records</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-8 h-8 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Catatan</span>
          </div>
          <p className="text-3xl font-bold text-amber-900">
            {dbStats.totalNotes}
          </p>
          <p className="text-xs text-amber-600 mt-1">Total records</p>
        </div>
      </div>

      {/* System Actions */}
      <div className="grid md:grid-cols-3 gap-4 pt-4">
        <button
          onClick={runSystemCheck}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-white border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all disabled:opacity-50">
          <Activity className="w-6 h-6 text-indigo-600" />
          <div className="text-left">
            <p className="font-semibold text-slate-800">Cek Kesehatan</p>
            <p className="text-xs text-slate-600">Scan masalah sistem</p>
          </div>
        </button>

        <button
          onClick={cleanupOldData}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-white border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all disabled:opacity-50">
          <Trash2 className="w-6 h-6 text-red-600" />
          <div className="text-left">
            <p className="font-semibold text-slate-800">Cleanup Data</p>
            <p className="text-xs text-slate-600">Hapus data lama</p>
          </div>
        </button>

        <button
          onClick={exportDatabase}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-white border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-50">
          <Download className="w-6 h-6 text-green-600" />
          <div className="text-left">
            <p className="font-semibold text-slate-800">Export DB</p>
            <p className="text-xs text-slate-600">Backup manual</p>
          </div>
        </button>
      </div>

      {/* Health Logs */}
      {healthLogs.length > 0 && (
        <div className="pt-6 border-t">
          <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Riwayat Pemeriksaan Sistem
          </h4>
          <div className="space-y-2">
            {healthLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {log.status === "healthy" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : log.status === "warning" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {log.total_issues} masalah ditemukan
                      {log.critical_count > 0 &&
                        ` (${log.critical_count} kritis)`}
                    </p>
                    <p className="text-xs text-slate-600">
                      {new Date(log.checked_at).toLocaleString("id-ID")} •{" "}
                      {log.checked_by}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {log.execution_time}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cleanup History */}
      {cleanupHistory.length > 0 && (
        <div className="pt-6 border-t">
          <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Riwayat Cleanup
          </h4>
          <div className="space-y-2">
            {cleanupHistory.map((item) => {
              const results =
                typeof item.results === "string"
                  ? JSON.parse(item.results)
                  : item.results;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {results.deleted_records || 0} data dihapus
                    </p>
                    <p className="text-xs text-slate-600">
                      {new Date(item.timestamp).toLocaleString("id-ID")} •{" "}
                      {item.triggered_by}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Perhatian!</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>Lakukan backup sebelum cleanup data</li>
              <li>Cleanup akan menghapus data permanen</li>
              <li>Jalankan health check secara berkala</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTab;
