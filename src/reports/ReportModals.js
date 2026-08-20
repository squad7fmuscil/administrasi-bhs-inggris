// src/reports/modals/ReportModal.js
import React, { useState, useMemo } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Users,
  Calendar,
  BarChart3,
  BookOpen,
} from "lucide-react";

const ReportModal = ({
  isOpen,
  onClose,
  reportData = {},
  reportType,
  onDownload,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 50;

  // ✅ Destructure report data safely
  const {
    preview = [],
    fullData = [],
    headers = [],
    summary = [],
    reportTitle = "LAPORAN",
    total = 0,
  } = reportData;

  // ✅ Use preview if fullData is empty
  const dataToUse = fullData.length > 0 ? fullData : preview;

  // ✅ Auto-generate headers if empty
  const effectiveHeaders = useMemo(() => {
    if (headers && headers.length > 0) {
      return headers;
    }

    if (dataToUse.length > 0) {
      const firstRow = dataToUse[0];
      return Object.keys(firstRow).map((key) => {
        return key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      });
    }

    return [];
  }, [headers, dataToUse]);

  // ✅ Get report icon based on type
  const getReportIcon = () => {
    switch (reportType) {
      case "students":
        return Users;
      case "attendance":
      case "attendance-recap":
      case "teacher-attendance":
        return Calendar;
      case "grades":
      case "teacher-grades":
        return BarChart3;
      case "teacher-recap":
        return BookOpen;
      default:
        return BookOpen;
    }
  };

  const ReportIcon = getReportIcon();

  // ✅ Get report color theme
  const getThemeColor = () => {
    switch (reportType) {
      case "students":
        return "green";
      case "attendance":
        return "yellow";
      case "attendance-recap":
        return "orange";
      case "grades":
        return "purple";
      case "teacher-grades":
        return "blue";
      case "teacher-attendance":
        return "indigo";
      case "teacher-recap":
        return "teal";
      default:
        return "indigo";
    }
  };

  const themeColor = getThemeColor();

  // ✅ Color classes mapping
  const colorClasses = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
      button: "bg-green-600 hover:bg-green-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-600",
      button: "bg-purple-600 hover:bg-purple-700",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-600",
      button: "bg-indigo-600 hover:bg-indigo-700",
    },
    teal: {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-600",
      button: "bg-teal-600 hover:bg-teal-700",
    },
  };

  const colors = colorClasses[themeColor];

  // ✅ Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return dataToUse;

    const query = searchQuery.toLowerCase();
    return dataToUse.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [dataToUse, searchQuery]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // ✅ Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // ✅ Render cell with conditional formatting
  const renderCell = (header, value) => {
    if (header === "Status" || header === "Status Kehadiran") {
      const statusColors = {
        Hadir: "bg-green-100 text-green-800",
        Sakit: "bg-yellow-100 text-yellow-800",
        Izin: "bg-blue-100 text-blue-800",
        Alpa: "bg-red-100 text-red-800",
        "Tidak Hadir": "bg-red-100 text-red-800",
      };
      const colorClass = statusColors[value] || "bg-gray-100 text-gray-800";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {value}
        </span>
      );
    }

    if (
      (header === "Persentase" || header === "Tingkat Kehadiran") &&
      typeof value === "string" &&
      value.includes("%")
    ) {
      const pct = parseFloat(value);
      let colorClass = "text-gray-600";
      if (pct >= 90) colorClass = "text-green-600 font-bold";
      else if (pct >= 75) colorClass = "text-yellow-600 font-bold";
      else colorClass = "text-red-600 font-bold";

      return <span className={colorClass}>{value}</span>;
    }

    if (
      (header === "Nilai" ||
        header === "Nilai Akhir" ||
        header === "Rata-rata Nilai") &&
      typeof value === "number"
    ) {
      let colorClass = "text-gray-600";
      if (value >= 85) colorClass = "text-green-600 font-bold";
      else if (value >= 70) colorClass = "text-yellow-600 font-bold";
      else colorClass = "text-red-600 font-bold";

      return <span className={colorClass}>{value}</span>;
    }

    return value !== undefined && value !== null ? value : "-";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className={`${colors.bg} border-b-2 ${colors.border} p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 ${colors.bg} border-2 ${colors.border} rounded-xl flex items-center justify-center`}>
                <ReportIcon className={`w-7 h-7 ${colors.text}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {reportTitle}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Preview Data • {filteredData.length} dari {total} record
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {summary && summary.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex gap-2 justify-between">
              {summary.map((stat, idx) => {
                const pastelColors = [
                  "bg-blue-50 border-blue-100",
                  "bg-green-50 border-green-100",
                  "bg-purple-50 border-purple-100",
                  "bg-pink-50 border-pink-100",
                  "bg-yellow-50 border-yellow-100",
                  "bg-indigo-50 border-indigo-100",
                ];
                const colorClass = pastelColors[idx % pastelColors.length];

                return (
                  <div
                    key={idx}
                    className={`${colorClass} rounded-lg border p-2.5 text-center flex-1 min-w-0`}>
                    <p className="text-xs text-slate-600 mb-1 truncate">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-slate-800 truncate">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari dalam data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-auto p-6">
          {currentData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                      No
                    </th>
                    {effectiveHeaders.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentData.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-200 font-medium">
                        {startIndex + rowIdx + 1}
                      </td>
                      {effectiveHeaders.map((header, colIdx) => {
                        const value =
                          row[header] !== undefined ? row[header] : "-";
                        return (
                          <td
                            key={colIdx}
                            className="px-4 py-3 text-sm text-slate-700 border-r border-slate-200">
                            {renderCell(header, value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg font-medium">
                Tidak ada data yang sesuai
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Coba ubah kata kunci pencarian atau periksa filter
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-slate-50 border-t-2 border-slate-200">
          <div className="flex items-center justify-between gap-4">
            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600 whitespace-nowrap">
                  Menampilkan {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredData.length)} dari{" "}
                  {filteredData.length} data
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? `${colors.button} text-white`
                              : "border border-slate-300 hover:bg-slate-100"
                          }`}>
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                Menampilkan {filteredData.length} data
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors">
                Tutup
              </button>
              <button
                onClick={() => onDownload(reportType, "xlsx")}
                disabled={loading}
                className={`${colors.button} text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}>
                <FileSpreadsheet className="w-4 h-4" />
                {loading ? "Exporting..." : "Export ke Excel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
