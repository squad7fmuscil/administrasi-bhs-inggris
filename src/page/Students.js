import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    nis: "",
    gender: "L",
    class_id: "7F",
    academic_year: "2025/2026",
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    class: "Semua Kelas",
    gender: "Semua",
  });

  // Get user data dari localStorage atau sessionStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const sessionUser = sessionStorage.getItem("currentUser");

    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    } else if (sessionUser) {
      setUserData(JSON.parse(sessionUser));
    }
  }, []);

  // Fetch kelas yang diampu guru
  const fetchTeacherClasses = async (teacherId, homeroomClassId, role) => {
    try {
      console.log("=== FETCH TEACHER CLASSES ===");
      console.log("Teacher ID:", teacherId);
      console.log("Homeroom Class ID:", homeroomClassId);
      console.log("Role:", role);

      let classes = [];

      // Jika admin atau guru_bk, return null (lihat semua)
      if (role === "admin" || role === "guru_bk") {
        console.log("Admin/Guru BK - Return NULL (lihat semua)");
        return null;
      }

      // Jika wali kelas, ambil dari homeroom_class_id
      if (homeroomClassId) {
        classes.push(homeroomClassId);
        console.log("Homeroom Class added:", homeroomClassId);
      }

      // Jika guru mapel, ambil dari teacher_assignments
      if (teacherId) {
        const { data, error } = await supabase
          .from("teacher_assignments")
          .select("class_id")
          .eq("teacher_id", teacherId);

        console.log("Teacher Assignments Query Result:", data);
        console.log("Teacher Assignments Error:", error);

        if (!error && data) {
          const assignedClasses = data.map((item) => item.class_id);
          console.log("Assigned Classes from DB:", assignedClasses);
          classes = [...new Set([...classes, ...assignedClasses])];
        }
      }

      console.log("Final Classes Array:", classes);
      return classes.length > 0 ? classes : null;
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      return null;
    }
  };

  // Fetch data siswa berdasarkan kelas guru
  const fetchStudents = async () => {
    if (!userData) {
      console.log("userData belum ready, skip fetch");
      return;
    }

    setLoading(true);

    try {
      console.log("=== FETCH STUDENTS START ===");
      console.log("Current User Data:", userData);

      // Ambil kelas yang diampu
      const classes = await fetchTeacherClasses(
        userData.teacher_id,
        userData.homeroom_class_id,
        userData.role,
      );

      console.log("Classes from fetchTeacherClasses:", classes);
      setTeacherClasses(classes);

      let query = supabase
        .from("students")
        .select("*")
        .order("full_name", { ascending: true });

      // Filter berdasarkan kelas yang diampu
      if (classes && classes.length > 0) {
        console.log("Filtering students by classes:", classes);
        query = query.in("class_id", classes);
      } else {
        console.log("No class filter applied (Admin or no classes)");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching students:", error);
      } else {
        console.log("Students fetched:", data?.length || 0);
        setStudents(data || []);
        setFilteredStudents(data || []);
      }
    } catch (error) {
      console.error("Error in fetchStudents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      console.log("useEffect triggered - userData available:", userData);
      fetchStudents();
    }
  }, [userData]);

  // Apply filters
  useEffect(() => {
    let filtered = students;

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(
        (student) =>
          student.full_name
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          (student.nis &&
            student.nis.toLowerCase().includes(filters.search.toLowerCase())),
      );
    }

    // Filter by class
    if (filters.class !== "Semua Kelas") {
      filtered = filtered.filter(
        (student) => student.class_id === filters.class,
      );
    }

    // Filter by gender
    if (filters.gender !== "Semua") {
      filtered = filtered.filter(
        (student) => student.gender === filters.gender,
      );
    }

    setFilteredStudents(filtered);
  }, [filters, students]);

  // Calculate stats (hanya dari kelas yang diampu)
  const stats = {
    totalKelas: teacherClasses
      ? teacherClasses.length
      : [...new Set(students.map((s) => s.class_id))].length,
    totalSiswa: students.length,
    lakiLaki: students.filter((s) => s.gender === "L").length,
    perempuan: students.filter((s) => s.gender === "P").length,
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add/Edit student
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update student
        const { error } = await supabase
          .from("students")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        // Add new student
        const { error } = await supabase.from("students").insert([formData]);

        if (error) throw error;
      }

      await fetchStudents();
      resetForm();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Error saving student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit student
  const handleEdit = (student) => {
    setFormData({
      full_name: student.full_name,
      nis: student.nis,
      gender: student.gender,
      class_id: student.class_id,
      academic_year: student.academic_year,
      is_active: student.is_active,
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  // Delete student
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus siswa ini?")) return;

    setLoading(true);
    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) {
      console.error("Error deleting student:", error);
      alert("Error deleting student: " + error.message);
    } else {
      await fetchStudents();
    }
    setLoading(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      full_name: "",
      nis: "",
      gender: "L",
      class_id:
        teacherClasses && teacherClasses.length > 0 ? teacherClasses[0] : "7F",
      academic_year: "2025/2026",
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilters({
      search: "",
      class: "Semua Kelas",
      gender: "Semua",
    });
  };

  // Get available classes for dropdown
  const getAvailableClasses = () => {
    if (teacherClasses && teacherClasses.length > 0) {
      // Sort teacherClasses berurutan
      return [...teacherClasses].sort((a, b) => {
        const gradeA = parseInt(a.charAt(0));
        const gradeB = parseInt(b.charAt(0));
        const classA = a.charAt(1);
        const classB = b.charAt(1);

        if (gradeA !== gradeB) {
          return gradeA - gradeB;
        }
        return classA.localeCompare(classB);
      });
    }
    return [
      "7A",
      "7B",
      "7C",
      "7D",
      "7E",
      "7F",
      "8A",
      "8B",
      "8C",
      "8D",
      "8E",
      "8F",
      "9A",
      "9B",
      "9C",
      "9D",
      "9E",
      "9F",
    ];
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Data Siswa</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalKelas}
          </div>
          <div className="text-sm text-blue-800">Total Kelas</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.totalSiswa}
          </div>
          <div className="text-sm text-green-800">Total Siswa</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.lakiLaki}
          </div>
          <div className="text-sm text-orange-800">Laki-laki</div>
        </div>
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-pink-600">
            {stats.perempuan}
          </div>
          <div className="text-sm text-pink-800">Perempuan</div>
        </div>
      </div>

      {/* Filters + Tambah Siswa dalam satu baris */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Cari Siswa */}
          <div>
            <label className="block text-sm font-medium mb-1">Cari Siswa</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-lg"
              placeholder="Cari nama atau NIS..."
            />
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Pilih Kelas
            </label>
            <select
              name="class"
              value={filters.class}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-lg">
              <option value="Semua Kelas">Semua Kelas</option>
              {getAvailableClasses().map((classId) => (
                <option key={classId} value={classId}>
                  Kelas {classId}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Kelamin */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Pilih Jenis Kelamin
            </label>
            <select
              name="gender"
              value={filters.gender}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-lg">
              <option value="Semua">Semua</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          {/* Reset Filter */}
          <div className="flex items-end">
            <button
              onClick={resetAllFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 w-full">
              Reset Filter
            </button>
          </div>

          {/* Tambah Siswa */}
          <div className="flex items-end">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full">
              + Tambah Siswa
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Siswa" : "Tambah Siswa Baru"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nama Siswa
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded-lg"
                placeholder="Nama lengkap siswa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">NIS</label>
              <input
                type="text"
                name="nis"
                value={formData.nis}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                placeholder="Nomor Induk Siswa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Jenis Kelamin
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kelas</label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg">
                {getAvailableClasses().map((classId) => (
                  <option key={classId} value={classId}>
                    {classId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                placeholder="2025/2026"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium">Aktif</label>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {loading ? "Loading..." : editingId ? "Update" : "Simpan"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {filters.class === "Semua Kelas" ? (
          <p className="text-center py-8 text-gray-500">
            Pilih kelas terlebih dahulu untuk menampilkan data siswa
          </p>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Menampilkan {filteredStudents.length} dari {students.length} siswa
            </div>
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">No.</th>
                  <th className="px-4 py-2 text-left">Nama</th>
                  <th className="px-4 py-2 text-left">NIS</th>
                  <th className="px-4 py-2 text-left">Jenis Kelamin</th>
                  <th className="px-4 py-2 text-left">Kelas</th>
                  <th className="px-4 py-2 text-left">Tahun Ajaran</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{student.full_name}</td>
                    <td className="px-4 py-2">{student.nis}</td>
                    <td className="px-4 py-2">
                      {student.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </td>
                    <td className="px-4 py-2">{student.class_id}</td>
                    <td className="px-4 py-2">{student.academic_year}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          student.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {student.is_active ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 && !loading && (
              <p className="text-center py-4 text-gray-500">
                Tidak ada data siswa
              </p>
            )}

            {loading && (
              <p className="text-center py-4 text-gray-500">Loading...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
