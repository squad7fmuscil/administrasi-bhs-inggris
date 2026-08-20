// components/DashboardAdmin.js
import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  FileText,
  Shield,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const DashboardAdmin = ({ currentUser, onPageChange }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeStudents: 0,
  });

  const [systemHealth, setSystemHealth] = useState({
    status: "loading",
    lastCheck: null,
    totalIssues: 0,
    criticalCount: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const [studentsRes, teachersRes, classesRes, activeStudentsRes] =
        await Promise.all([
          supabase.from("students").select("*", { count: "exact", head: true }),
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "teacher")
            .eq("is_active", true),
          supabase
            .from("classes")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
        ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalClasses: classesRes.count || 0,
        activeStudents: activeStudentsRes.count || 0,
      });

      // Fetch system health
      const { data: healthData } = await supabase
        .from("system_health_logs")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(1)
        .single();

      if (healthData) {
        setSystemHealth({
          status: healthData.status || "unknown",
          lastCheck: healthData.checked_at,
          totalIssues: healthData.total_issues || 0,
          criticalCount: healthData.critical_count || 0,
        });
      }

      // Fetch recent activities (from attendance & grades)
      const today = new Date().toISOString().split("T")[0];
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*, students(full_name)")
        .gte("date", today)
        .order("created_at", { ascending: false })
        .limit(5);

      const activities = (attendanceData || []).map((item) => ({
        type: "attendance",
        description: `${item.students?.full_name || "Siswa"} - ${item.status}`,
        time: item.created_at,
        class: item.class,
      }));

      setRecentActivities(activities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp size={12} />
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );

  const SystemHealthCard = () => {
    const statusConfig = {
      healthy: {
        color: "bg-green-500",
        text: "Sistem Sehat",
        icon: CheckCircle,
      },
      warning: {
        color: "bg-yellow-500",
        text: "Ada Peringatan",
        icon: AlertCircle,
      },
      critical: {
        color: "bg-red-500",
        text: "Perlu Perhatian",
        icon: AlertCircle,
      },
      loading: { color: "bg-gray-400", text: "Memuat...", icon: Clock },
      unknown: {
        color: "bg-gray-400",
        text: "Tidak Diketahui",
        icon: AlertCircle,
      },
    };

    const config = statusConfig[systemHealth.status] || statusConfig.unknown;
    const StatusIcon = config.icon;

    return (
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => onPageChange("sistem")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">System Health</h3>
          <Shield className="text-gray-400" size={20} />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${config.color} animate-pulse`}></div>
          <span className="font-medium text-gray-700">{config.text}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Total Issues</p>
            <p className="text-2xl font-bold text-gray-900">
              {systemHealth.totalIssues}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-600">
              {systemHealth.criticalCount}
            </p>
          </div>
        </div>

        {systemHealth.lastCheck && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={12} />
            Last check:{" "}
            {new Date(systemHealth.lastCheck).toLocaleString("id-ID")}
          </p>
        )}

        <button className="mt-4 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors">
          View Details →
        </button>
      </div>
    );
  };

  const QuickActionCard = ({
    icon: Icon,
    title,
    description,
    color,
    onClick,
  }) => (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={onClick}>
      <div
        className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className="text-white" size={20} />
      </div>
      <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Administrator
        </h1>
        <p className="text-gray-600">
          Selamat datang,{" "}
          <span className="font-semibold">{currentUser.full_name}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          title="Total Siswa"
          value={stats.totalStudents}
          subtitle={`${stats.activeStudents} siswa aktif`}
          color="bg-blue-500"
          onClick={() => onPageChange("students")}
        />
        <StatCard
          icon={GraduationCap}
          title="Total Guru"
          value={stats.totalTeachers}
          subtitle="Guru aktif"
          color="bg-green-500"
        />
        <StatCard
          icon={BookOpen}
          title="Total Kelas"
          value={stats.totalClasses}
          subtitle="Kelas aktif"
          color="bg-purple-500"
        />
        <StatCard
          icon={Activity}
          title="System Status"
          value={systemHealth.status === "healthy" ? "✓" : "!"}
          subtitle={
            systemHealth.status === "healthy"
              ? "All systems operational"
              : "Needs attention"
          }
          color={
            systemHealth.status === "healthy"
              ? "bg-emerald-500"
              : "bg-yellow-500"
          }
          onClick={() => onPageChange("sistem")}
        />
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <SystemHealthCard />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionCard
                icon={Users}
                title="Kelola Siswa"
                description="Tambah & edit data siswa"
                color="bg-blue-500"
                onClick={() => onPageChange("students")}
              />
              <QuickActionCard
                icon={FileText}
                title="Laporan"
                description="Lihat & export laporan"
                color="bg-green-500"
                onClick={() => onPageChange("report")}
              />
              <QuickActionCard
                icon={Settings}
                title="Pengaturan"
                description="Konfigurasi sistem"
                color="bg-purple-500"
                onClick={() => onPageChange("setting")}
              />
              <QuickActionCard
                icon={Shield}
                title="Monitor Sistem"
                description="Cek kesehatan sistem"
                color="bg-red-500"
                onClick={() => onPageChange("sistem")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Aktivitas Terbaru
          </h3>
          <BarChart3 className="text-gray-400" size={20} />
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Kelas {activity.class}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.time).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity size={48} className="mx-auto mb-2 opacity-50" />
            <p>Belum ada aktivitas hari ini</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAdmin;
