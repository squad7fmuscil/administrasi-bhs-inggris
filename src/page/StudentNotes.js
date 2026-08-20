import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Edit,
  X,
  Users,
} from "lucide-react";

// Komponen FormView yang terpisah
const FormView = ({
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  siswaList,
  editingNote,
  loading,
  kategoris,
  isAdmin,
}) => {
  // JIKA ADMIN, JANGAN TAMPILKAN FORM
  if (isAdmin) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-gray-600 mb-4">
            Admin tidak dapat membuat atau mengedit catatan perkembangan siswa.
          </p>
          <button
            onClick={onCancel}
            className="bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-300 font-medium transition">
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFormChange(name, value);
  };

  const handleLabelSelect = (label) => {
    onFormChange("label", label);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col gap-3 mb-6 pb-4 border-b sm:flex-row sm:justify-between sm:items-center">
          <button
            type="button"
            onClick={onCancel}
            className="order-1 sm:order-2 self-start bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-300 font-medium transition text-sm sm:text-base">
            ← Kembali
          </button>
          <h2 className="order-2 sm:order-1 text-lg sm:text-2xl font-bold text-gray-800 text-center sm:text-left">
            {editingNote ? "Edit Catatan" : "Tambah Catatan Baru"}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Siswa <span className="text-red-500">*</span>
              </label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
                disabled={editingNote}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="">Pilih Siswa</option>
                {siswaList.map((siswa) => (
                  <option key={siswa.id} value={siswa.id}>
                    {siswa.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Pilih Kategori</option>
                {kategoris.map((kategori) => (
                  <option key={kategori} value={kategori}>
                    {kategori}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Label <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleLabelSelect("positif")}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    formData.label === "positif"
                      ? "bg-teal-200 border-teal-400 text-teal-900 shadow-sm ring-2 ring-teal-300 ring-offset-1"
                      : "bg-teal-50 border-teal-100 text-teal-700 hover:bg-teal-100 hover:border-teal-200"
                  }`}>
                  <span className="text-2xl leading-none">👍</span>
                  <span className="text-sm">Positif</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLabelSelect("perhatian")}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    formData.label === "perhatian"
                      ? "bg-pink-200 border-pink-400 text-pink-900 shadow-sm ring-2 ring-pink-300 ring-offset-1"
                      : "bg-pink-50 border-pink-100 text-pink-700 hover:bg-pink-100 hover:border-pink-200"
                  }`}>
                  <span className="text-2xl leading-none">⚠️</span>
                  <span className="text-sm">Perhatian</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLabelSelect("netral")}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    formData.label === "netral"
                      ? "bg-purple-200 border-purple-400 text-purple-900 shadow-sm ring-2 ring-purple-300 ring-offset-1"
                      : "bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100 hover:border-purple-200"
                  }`}>
                  <span className="text-2xl leading-none">📝</span>
                  <span className="text-sm">Biasa</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Isi Catatan <span className="text-red-500">*</span>
            </label>
            <textarea
              name="note_content"
              value={formData.note_content}
              onChange={handleInputChange}
              rows={6}
              placeholder="Tuliskan catatan perkembangan siswa secara detail..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tindakan yang Diambil
            </label>
            <textarea
              name="action_taken"
              value={formData.action_taken}
              onChange={handleInputChange}
              rows={3}
              placeholder="Tuliskan tindakan yang sudah atau akan dilakukan..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {editingNote ? "Menyimpan..." : "Membuat..."}
                </>
              ) : editingNote ? (
                "Update Catatan"
              ) : (
                "Buat Catatan"
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg border border-gray-300 font-semibold hover:bg-gray-100 transition disabled:opacity-50">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Komponen DashboardView yang terpisah - UPDATE untuk admin
const DashboardView = ({
  currentClass,
  academicYear,
  semester,
  stats,
  searchTerm,
  onSearchChange,
  onAddNote,
  loading,
  siswaList,
  filteredSiswa,
  onViewDetail,
  isAdmin,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isAdmin
              ? "Monitoring Catatan Perkembangan Siswa"
              : "Catatan Perkembangan Siswa"}
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            {currentClass
              ? `Kelas ${currentClass} - ${academicYear} (${semester})`
              : `Semua Kelas - ${academicYear} (${semester})`}
            {isAdmin && (
              <span className="ml-2 text-blue-600 font-semibold">
                (Mode Admin)
              </span>
            )}
          </p>
        </div>
        {/* HIDE TOMBOL TAMBAH CATATAN UNTUK ADMIN */}
        {!isAdmin && (
          <button
            onClick={onAddNote}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition self-start sm:self-auto">
            <Plus className="w-5 h-5" />
            Tambah Catatan
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-sky-50 p-4 rounded-xl shadow-sm border border-sky-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-200 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-sky-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sky-700/80 text-xs sm:text-sm truncate">
              Total Siswa
            </p>
            <p className="text-xl sm:text-2xl font-bold text-sky-900">
              {stats.totalSiswa}
            </p>
          </div>
        </div>
        <div className="bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-200 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-teal-700" />
          </div>
          <div className="min-w-0">
            <p className="text-teal-700/80 text-xs sm:text-sm truncate">
              Progress Positif
            </p>
            <p className="text-xl sm:text-2xl font-bold text-teal-900">
              {stats.progressPositif}
            </p>
          </div>
        </div>
        <div className="bg-pink-50 p-4 rounded-xl shadow-sm border border-pink-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-200 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-pink-700" />
          </div>
          <div className="min-w-0">
            <p className="text-pink-700/80 text-xs sm:text-sm truncate">
              Perlu Perhatian
            </p>
            <p className="text-xl sm:text-2xl font-bold text-pink-900">
              {stats.perluPerhatian}
            </p>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-200 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-purple-700" />
          </div>
          <div className="min-w-0">
            <p className="text-purple-700/80 text-xs sm:text-sm truncate">
              Catatan Biasa
            </p>
            <p className="text-xl sm:text-2xl font-bold text-purple-900">
              {stats.catatanBiasa}
            </p>
          </div>
        </div>
      </div>

      {/* Info untuk Admin */}
      {isAdmin && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">
                Mode Monitoring Admin
              </p>
              <p className="text-sm text-blue-800">
                Anda dapat memantau semua catatan perkembangan siswa dari semua
                kelas dan guru.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari siswa berdasarkan nama atau NIS..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      ) : siswaList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600 text-lg">
            Tidak ada data siswa di kelas ini.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Pastikan sudah ada siswa yang terdaftar di kelas Anda.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  NIS
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Positif
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Perhatian
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Catatan Biasa
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Update Terakhir
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500">
                    Tidak ada siswa yang sesuai dengan pencarian "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {siswa.nama}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{siswa.nis}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        {siswa.positif}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {siswa.perhatian > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                          <TrendingDown className="w-4 h-4" />
                          {siswa.perhatian}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {siswa.netral > 0 ? (
                        <span className="inline-flex items-center gap-1 text-gray-600 font-semibold">
                          <Info className="w-4 h-4" />
                          {siswa.netral}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {siswa.lastUpdate}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onViewDetail(siswa)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto font-medium">
                        <Eye className="w-4 h-4" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Komponen DetailView yang terpisah - UPDATE untuk admin
const DetailView = ({
  selectedSiswa,
  catatanList,
  loading,
  onBack,
  onAddNote,
  onEditNote,
  onDeleteNote,
  formatDate,
  getLabelBadge,
  getLabelIcon,
  isAdmin,
}) => {
  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-300 mb-6 font-medium transition">
        ← Kembali ke Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedSiswa?.nama}
            </h2>
            <p className="text-gray-600 mt-1">NIS: {selectedSiswa?.nis}</p>
            {isAdmin && (
              <p className="text-sm text-blue-600 mt-1 font-semibold">
                Mode Monitoring Admin
              </p>
            )}
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Catatan Positif</p>
              <p className="text-3xl font-bold text-green-600">
                {selectedSiswa?.positif}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Perlu Perhatian</p>
              <p className="text-3xl font-bold text-red-600">
                {selectedSiswa?.perhatian}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Catatan Biasa</p>
              <p className="text-3xl font-bold text-gray-600">
                {selectedSiswa?.netral}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Timeline Catatan</h3>
        {/* HIDE TOMBOL TAMBAH CATATAN UNTUK ADMIN */}
        {!isAdmin && (
          <button
            onClick={onAddNote}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-medium">
            <Plus className="w-4 h-4" />
            Tambah Catatan
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat catatan...</p>
        </div>
      ) : catatanList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg mb-2">Belum ada catatan untuk siswa ini</p>
          {!isAdmin && (
            <p className="text-sm text-gray-400">
              Klik "Tambah Catatan" untuk membuat catatan pertama
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {catatanList.map((catatan) => (
            <div
              key={catatan.id}
              className="bg-white rounded-lg shadow-sm p-6 border-l-4"
              style={{
                borderLeftColor:
                  catatan.label === "positif"
                    ? "#10b981"
                    : catatan.label === "perhatian"
                      ? "#ef4444"
                      : "#6b7280",
              }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${getLabelBadge(
                      catatan.label,
                    )}`}>
                    {getLabelIcon(catatan.label)}
                    {catatan.label === "positif"
                      ? "Positif"
                      : catatan.label === "perhatian"
                        ? "Perlu Perhatian"
                        : "Catatan Biasa"}
                  </span>
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {catatan.category}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">
                    {formatDate(catatan.created_at)}
                  </span>
                </div>
                {/* HIDE EDIT/DELETE BUTTONS UNTUK ADMIN */}
                {!isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditNote(catatan)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit catatan">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(catatan.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Hapus catatan">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-800 leading-relaxed mb-2 whitespace-pre-line">
                {catatan.note_content}
              </p>
              {catatan.action_taken && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-800">
                      Tindakan:
                    </span>{" "}
                    {catatan.action_taken}
                  </p>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                Oleh: {catatan.teacher_name || "Guru"}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSiswa?.perhatian > 0 && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 mb-1">
                Perhatian Khusus
              </p>
              <p className="text-sm text-yellow-800">
                Terdeteksi pola yang perlu diperhatikan. Pertimbangkan untuk
                melakukan konsultasi lebih lanjut dengan guru BK.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen Utama - UPDATE dengan isAdmin logic
const CatatanSiswa = ({ user, onShowToast }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [siswaList, setSiswaList] = useState([]);
  const [catatanList, setCatatanList] = useState([]);
  const [stats, setStats] = useState({
    totalSiswa: 0,
    progressPositif: 0,
    perluPerhatian: 0,
    catatanBiasa: 0,
  });

  // Form states
  const [formData, setFormData] = useState({
    student_id: "",
    category: "",
    label: "",
    note_content: "",
    action_taken: "",
  });
  const [editingNote, setEditingNote] = useState(null);

  // User session data
  const [currentUser, setCurrentUser] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [initError, setInitError] = useState(null);

  const kategoris = ["Akademik", "Perilaku", "Sosial", "Karakter", "Kesehatan"];

  // TAMBAH: Cek apakah user adalah admin
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "administrator";

  // Get current user and class info
  useEffect(() => {
    console.log("🔥 EFFECT 1 - User prop:", user);
    if (user) {
      getCurrentUser();
    }
  }, [user]);

  // Load data when user is ready
  useEffect(() => {
    console.log("🔥 EFFECT 2 - currentUser:", currentUser);
    console.log("🔥 EFFECT 2 - currentClass:", currentClass);
    console.log("🔥 EFFECT 2 - academicYear:", academicYear);
    console.log("🔥 EFFECT 2 - semester:", semester);
    // ✅ FIX: Tunggu academicYear & semester siap dulu, biar nggak race condition
    if (currentUser && academicYear && semester) {
      loadDashboardData();
    }
  }, [currentUser, currentClass, academicYear, semester]);

  const getCurrentUser = async () => {
    try {
      setLoading(true);
      console.log("🔍 Getting current user...");

      if (!user) {
        console.warn("⚠️ No user prop provided");
        setInitError("Sesi tidak ditemukan. Silakan login kembali.");
        setLoading(false);
        return;
      }

      console.log("✅ User from props:", user);

      const { data: dbUser, error: userError } = await supabase
        .from("users")
        .select("id, full_name, homeroom_class_id, is_active, role")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("❌ Error verifying user:", userError);
        setInitError("Error memverifikasi sesi. Silakan login kembali.");
        setLoading(false);
        return;
      }

      if (!dbUser) {
        console.warn("⚠️ User not found in database");
        setInitError("Akun tidak ditemukan. Silakan login kembali.");
        setLoading(false);
        return;
      }

      if (!dbUser.is_active) {
        console.warn("⚠️ User account is inactive");
        setInitError("Akun Anda tidak aktif. Hubungi administrator.");
        setLoading(false);
        return;
      }

      console.log("📊 User verified:", dbUser);

      // FIX: Handle admin user yang gak punya homeroom_class_id
      const isAdminUser =
        dbUser.role === "admin" || dbUser.role === "administrator";

      if (!dbUser.homeroom_class_id && !isAdminUser) {
        console.warn("⚠️ User has no homeroom class assigned and is not admin");
        setInitError(
          "Anda belum memiliki kelas yang di-assign. Hubungi administrator untuk assign kelas wali.",
        );
        setLoading(false);
        return;
      }

      setCurrentUser(dbUser);

      // FIX: Untuk admin, biarkan currentClass = null (lihat semua kelas)
      if (isAdminUser && !dbUser.homeroom_class_id) {
        console.log("👨‍💼 Admin user detected - will view all classes");
        setCurrentClass(null);
      } else {
        setCurrentClass(dbUser.homeroom_class_id);
      }

      const { data: activeYear, error: yearError } = await supabase
        .from("academic_years")
        .select("year, semester")
        .eq("is_active", true)
        .single();

      if (yearError) {
        console.warn("⚠️ No active academic year found, using default");
      } else if (activeYear) {
        console.log("📅 Active academic year:", activeYear);
        setAcademicYear(activeYear.year);
        setSemester(activeYear.semester === 1 ? "Ganjil" : "Genap");
      }

      console.log("✅ User initialization complete");
      setLoading(false);
    } catch (err) {
      console.error("💥 Unexpected error in getCurrentUser:", err);
      setInitError(`Terjadi kesalahan: ${err.message}`);
      setLoading(false);
    }
  };

  // LOAD DASHBOARD DATA - FIX semester comparison
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📊 Loading dashboard via RPC...");

      const semesterValue = semester === "Ganjil" ? "1" : "2";

      // Call RPC function
      const { data, error } = await supabase.rpc("get_student_notes_summary", {
        p_academic_year: academicYear,
        p_semester: semesterValue,
        p_teacher_id: !isAdmin ? currentUser.id : null,
        p_class_id: !isAdmin ? currentClass : null,
      });

      if (error) {
        console.error("❌ RPC Error:", error);
        throw error;
      }

      console.log(`✅ RPC returned ${data?.length || 0} students`);

      if (!data || data.length === 0) {
        setSiswaList([]);
        setStats({
          totalSiswa: 0,
          progressPositif: 0,
          perluPerhatian: 0,
          catatanBiasa: 0,
        });
        setLoading(false);
        return;
      }

      // Process RPC results
      const processedStudents = data.map((student) => ({
        id: student.student_id,
        nama: student.full_name,
        nis: student.nis,
        class_id: student.class_id,
        positif: parseInt(student.positif_count) || 0,
        perhatian: parseInt(student.perhatian_count) || 0,
        netral: parseInt(student.netral_count) || 0,
        lastUpdate: student.last_note_date
          ? formatRelativeTime(student.last_note_date)
          : "Belum ada catatan",
      }));

      setSiswaList(processedStudents);

      // Calculate stats
      const studentsWithPositif = processedStudents.filter(
        (s) => s.positif > 0,
      );
      const studentsWithPerhatian = processedStudents.filter(
        (s) => s.perhatian > 0,
      );
      const studentsWithNetral = processedStudents.filter((s) => s.netral > 0);

      setStats({
        totalSiswa: processedStudents.length,
        progressPositif: studentsWithPositif.length,
        perluPerhatian: studentsWithPerhatian.length,
        catatanBiasa: studentsWithNetral.length,
      });

      console.log("✅ Dashboard loaded via RPC! 🚀");
    } catch (err) {
      setError(err.message);
      console.error("💥 Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Juga UPDATE loadStudentNotes function - cari dan ganti bagian ini:
  const loadStudentNotes = async (studentId) => {
    setLoading(true);
    try {
      console.log("📝 Loading notes for student:", studentId);

      // FIX: Gunakan semester sebagai text
      const semesterValue = semester === "Ganjil" ? "1" : "2";

      let notesQuery = supabase
        .from("student_development_notes")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_year", academicYear)
        .eq("semester", semesterValue) // FIX: Gunakan text, bukan number
        .order("created_at", { ascending: false });

      // Hanya teacher yang filter by teacher_id sendiri
      if (!isAdmin && currentUser) {
        notesQuery = notesQuery.eq("teacher_id", currentUser.id);
        console.log("👨‍🏫 Teacher mode: only loading own notes");
      } else {
        console.log("👨‍💼 Admin mode: loading all notes from all teachers");
      }

      const { data, error } = await notesQuery;

      if (error) {
        console.error("❌ Error loading student notes:", error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} notes for student`);

      // Add teacher name
      const notesWithTeacher = await Promise.all(
        (data || []).map(async (note) => {
          if (note.teacher_id) {
            const { data: teacher } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", note.teacher_id)
              .single();

            return {
              ...note,
              teacher_name: teacher?.full_name || "Guru",
            };
          }
          return { ...note, teacher_name: "Guru" };
        }),
      );

      setCatatanList(notesWithTeacher);
    } catch (err) {
      setError(err.message);
      console.error("💥 Error loading notes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Juga UPDATE handleCreateNote function - cari dan ganti bagian ini:
  const handleCreateNote = async (e) => {
    e.preventDefault();

    if (isAdmin) {
      window.alert("Admin tidak dapat membuat catatan perkembangan siswa.");
      return;
    }

    if (
      !formData.student_id ||
      !formData.category ||
      !formData.label ||
      !formData.note_content
    ) {
      window.alert("Mohon lengkapi semua field yang wajib diisi!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // FIX: Gunakan semester sebagai text
      const semesterValue = semester === "Ganjil" ? "1" : "2";

      const noteData = {
        student_id: formData.student_id,
        teacher_id: currentUser.id,
        class_id: currentClass,
        academic_year: academicYear,
        semester: semesterValue, // FIX: Gunakan text, bukan number
        category: formData.category,
        label: formData.label,
        note_content: formData.note_content,
        action_taken: formData.action_taken || null,
      };

      console.log("💾 Creating note:", noteData);

      const { error } = await supabase
        .from("student_development_notes")
        .insert([noteData]);

      if (error) throw error;

      console.log("✅ Note created successfully");

      setFormData({
        student_id: "",
        category: "",
        label: "",
        note_content: "",
        action_taken: "",
      });

      await loadDashboardData();
      setActiveView("dashboard");

      if (onShowToast) {
        onShowToast("Catatan berhasil disimpan!", "success");
      } else {
        window.alert("Catatan berhasil disimpan!");
      }
    } catch (err) {
      setError(err.message);
      console.error("💥 Error creating note:", err);
      window.alert("Gagal menyimpan catatan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE NOTE - ADMIN TIDAK BISA UPDATE
  const handleUpdateNote = async (e) => {
    e.preventDefault();

    if (isAdmin) {
      window.alert("Admin tidak dapat mengedit catatan perkembangan siswa.");
      return;
    }

    if (!formData.category || !formData.label || !formData.note_content) {
      window.alert("Mohon lengkapi semua field yang wajib diisi!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates = {
        category: formData.category,
        label: formData.label,
        note_content: formData.note_content,
        action_taken: formData.action_taken || null,
        updated_at: new Date().toISOString(),
      };

      console.log("💾 Updating note:", editingNote.id, updates);

      const { error } = await supabase
        .from("student_development_notes")
        .update(updates)
        .eq("id", editingNote.id);

      if (error) throw error;

      console.log("✅ Note updated successfully");

      // FIX: Reload data untuk semua state
      await loadStudentNotes(selectedSiswa.id);
      await loadDashboardData();

      setEditingNote(null);
      setFormData({
        student_id: "",
        category: "",
        label: "",
        note_content: "",
        action_taken: "",
      });

      setActiveView("detail");

      if (onShowToast) {
        onShowToast("Catatan berhasil diupdate!", "success");
      } else {
        window.alert("Catatan berhasil diupdate!");
      }
    } catch (err) {
      setError(err.message);
      console.error("💥 Error updating note:", err);
      window.alert("Gagal update catatan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // DELETE NOTE - ADMIN TIDAK BISA DELETE
  const handleDeleteNote = async (noteId) => {
    if (isAdmin) {
      window.alert("Admin tidak dapat menghapus catatan perkembangan siswa.");
      return;
    }

    if (!window.confirm("Yakin ingin menghapus catatan ini?")) return;

    setLoading(true);
    try {
      console.log("🗑️ Deleting note:", noteId);

      const { error } = await supabase
        .from("student_development_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      console.log("✅ Note deleted successfully");

      await loadStudentNotes(selectedSiswa.id);
      await loadDashboardData();

      if (onShowToast) {
        onShowToast("Catatan berhasil dihapus!", "success");
      } else {
        window.alert("Catatan berhasil dihapus!");
      }
    } catch (err) {
      setError(err.message);
      console.error("💥 Error deleting note:", err);
      window.alert("Gagal menghapus catatan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "1 hari lalu";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    return `${Math.floor(diffDays / 30)} bulan lalu`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLabelIcon = (label) => {
    if (label === "positif") return <CheckCircle className="w-4 h-4" />;
    if (label === "perhatian") return <AlertCircle className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const getLabelBadge = (label) => {
    if (label === "positif") return "bg-green-100 text-green-800";
    if (label === "perhatian") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  // Memoized handlers
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleAddNote = useCallback(() => {
    if (isAdmin) {
      window.alert("Admin tidak dapat membuat catatan perkembangan siswa.");
      return;
    }
    setFormData({
      student_id: "",
      category: "",
      label: "",
      note_content: "",
      action_taken: "",
    });
    setEditingNote(null);
    setActiveView("form");
  }, [isAdmin]);

  const handleViewDetail = useCallback(async (siswa) => {
    setSelectedSiswa(siswa);
    setActiveView("detail");
    await loadStudentNotes(siswa.id);
  }, []);

  const handleEditNote = useCallback(
    (catatan) => {
      if (isAdmin) {
        window.alert("Admin tidak dapat mengedit catatan perkembangan siswa.");
        return;
      }
      setEditingNote(catatan);
      setFormData({
        student_id: catatan.student_id,
        category: catatan.category,
        label: catatan.label,
        note_content: catatan.note_content,
        action_taken: catatan.action_taken || "",
      });
      setActiveView("form");
    },
    [isAdmin],
  );

  const handleCancelForm = useCallback(() => {
    setActiveView(editingNote ? "detail" : "dashboard");
    setEditingNote(null);
    setFormData({
      student_id: "",
      category: "",
      label: "",
      note_content: "",
      action_taken: "",
    });
  }, [editingNote]);

  const handleBackToDashboard = useCallback(() => {
    setActiveView("dashboard");
  }, []);

  const handleAddNoteFromDetail = useCallback(() => {
    if (isAdmin) {
      window.alert("Admin tidak dapat membuat catatan perkembangan siswa.");
      return;
    }
    setFormData({
      student_id: selectedSiswa.id,
      category: "",
      label: "",
      note_content: "",
      action_taken: "",
    });
    setEditingNote(null);
    setActiveView("form");
  }, [selectedSiswa, isAdmin]);

  const filteredSiswa = useMemo(
    () =>
      siswaList.filter(
        (s) =>
          s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.nis.includes(searchTerm),
      ),
    [siswaList, searchTerm],
  );

  // MAIN RENDER
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {initError ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Tidak Dapat Memuat Data
            </h2>
            <p className="text-gray-600 mb-6">{initError}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setInitError(null);
                  setLoading(true);
                  getCurrentUser();
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition">
                Coba Lagi
              </button>
              <div className="text-sm text-gray-500">
                <p>Jika masalah berlanjut, silakan:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Pastikan Anda sudah login</li>
                  <li>• Periksa koneksi internet Anda</li>
                  <li>• Hubungi administrator untuk assign kelas wali</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : loading && !currentUser ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Memuat data pengguna...</p>
            <p className="text-gray-500 text-sm mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      ) : (
        <>
          {activeView === "dashboard" && (
            <DashboardView
              currentClass={currentClass}
              academicYear={academicYear}
              semester={semester}
              stats={stats}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onAddNote={handleAddNote}
              loading={loading}
              siswaList={siswaList}
              filteredSiswa={filteredSiswa}
              onViewDetail={handleViewDetail}
              isAdmin={isAdmin}
            />
          )}

          {activeView === "form" && (
            <FormView
              formData={formData}
              onFormChange={handleFormChange}
              onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
              onCancel={handleCancelForm}
              siswaList={siswaList}
              editingNote={editingNote}
              loading={loading}
              kategoris={kategoris}
              isAdmin={isAdmin}
            />
          )}

          {activeView === "detail" && (
            <DetailView
              selectedSiswa={selectedSiswa}
              catatanList={catatanList}
              loading={loading}
              onBack={handleBackToDashboard}
              onAddNote={handleAddNoteFromDetail}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              formatDate={formatDate}
              getLabelBadge={getLabelBadge}
              getLabelIcon={getLabelIcon}
              isAdmin={isAdmin}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CatatanSiswa;
