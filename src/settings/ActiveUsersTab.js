import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// Tabel "users" sekarang punya kolom last_login (ditambahkan manual di
// Supabase + di-update di Login.js tiap kali ada yang berhasil login,
// baik siswa maupun guru/admin). Tab ini nampilin GURU dan SISWA
// sekaligus (siswa yang wali-kelasnya kepake buat ngecek portal siswa
// beneran dipake atau nggak), dengan filter role.
export default function ActiveUsersTab({ showToast }) {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, roleFilter, allUsers]);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, full_name, username, role, teacher_id, homeroom_class_id, is_active, no_hp, updated_at, last_login",
        )
        .in("role", ["teacher", "admin", "student"])
        .order("last_login", { ascending: false, nullsFirst: false });

      if (error) throw error;

      setAllUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (showToast) showToast("Gagal memuat data user", "error");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allUsers];

    // Filter by status akun
    if (statusFilter === "active") {
      filtered = filtered.filter((u) => u.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((u) => !u.is_active);
    } else if (statusFilter === "never") {
      filtered = filtered.filter((u) => !u.last_login);
    }

    // Filter by peran
    if (roleFilter === "teacher") {
      filtered = filtered.filter((u) => u.role === "teacher");
    } else if (roleFilter === "student") {
      filtered = filtered.filter((u) => u.role === "student");
    } else if (roleFilter === "homeroom") {
      filtered = filtered.filter(
        (u) => u.role === "teacher" && u.homeroom_class_id,
      );
    }

    setUsers(filtered);
  };

  const getStatusColor = (lastLogin) => {
    if (!lastLogin) return "⚪"; // belum pernah login sama sekali

    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffHours = (now - loginDate) / (1000 * 60 * 60);

    if (diffHours < 1) return "🟢";
    if (diffHours < 24) return "🟡";
    if (diffHours < 168) return "🟠";
    return "🔴";
  };

  const getTimeAgo = (date) => {
    if (!date) return "Belum pernah login";

    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return "Kemarin";
    return `${diffDays} hari yang lalu`;
  };

  const stats = {
    total: allUsers.length,
    teachers: allUsers.filter((u) => u.role === "teacher").length,
    students: allUsers.filter((u) => u.role === "student").length,
    neverLogin: allUsers.filter((u) => !u.last_login).length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          👥 Monitor Aktivitas Login
        </h2>
        <p className="text-sm text-gray-600">
          Pantau siapa aja yang aktif login — guru maupun siswa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">
            Total Akun
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-800">
            {stats.total}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-sm p-3 sm:p-4 border border-blue-200">
          <div className="text-xs sm:text-sm text-blue-700 mb-1">👨‍🏫 Guru</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-800">
            {stats.teachers}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-sm p-3 sm:p-4 border border-purple-200">
          <div className="text-xs sm:text-sm text-purple-700 mb-1">
            🎒 Siswa
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-800">
            {stats.students}
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-300">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">
            ⚪ Belum Pernah Login
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-700">
            {stats.neverLogin}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter Aktivitas
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 bg-white text-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="all">Semua</option>
              <option value="active">🟢 Akun Aktif</option>
              <option value="inactive">🔴 Akun Nonaktif</option>
              <option value="never">⚪ Belum Pernah Login</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter Peran
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-300 bg-white text-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="all">Semua Peran</option>
              <option value="teacher">👨‍🏫 Guru</option>
              <option value="homeroom">👑 Wali Kelas</option>
              <option value="student">🎒 Siswa</option>
            </select>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500">
              Tidak ada data dengan filter yang dipilih
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getStatusColor(user.last_login)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-base mb-1">
                    {user.full_name || user.username}
                  </div>
                  <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">
                      👤 {user.username}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1">
                      {user.role === "student" ? (
                        <>🎒 Siswa {user.homeroom_class_id}</>
                      ) : user.homeroom_class_id ? (
                        <>👑 Wali Kelas {user.homeroom_class_id}</>
                      ) : user.role === "admin" ? (
                        <>🛠️ Admin</>
                      ) : (
                        <>📚 Guru Mapel</>
                      )}
                    </span>
                    {!user.is_active && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-rose-600 font-semibold">
                          Akun Nonaktif
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-2 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">
                      🕐 {getTimeAgo(user.last_login)}
                    </span>
                    {user.last_login && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs">
                          {new Date(user.last_login).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      {users.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-2 text-sm text-blue-700">
            <span className="text-lg">💡</span>
            <div>
              <p className="font-semibold mb-1">Legend Status:</p>
              <div className="space-y-1 text-xs">
                <p>🟢 Login &lt; 1 jam yang lalu</p>
                <p>🟡 Login hari ini (&lt; 24 jam)</p>
                <p>🟠 Login minggu ini (&lt; 7 hari)</p>
                <p>🔴 Login &gt; 7 hari yang lalu</p>
                <p>⚪ Belum pernah login sejak fitur ini aktif</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
