import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ✅ JAM SCHEDULE SAMA PERSIS DENGAN TeacherSchedule.js
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

const TeacherScheduleExcel = {
  // ✅ EXPORT TO EXCEL WITH BREAK TIMES
  exportToExcel: async (schedules, user, days) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Jadwal Mengajar");

      // Title
      worksheet.mergeCells("A1:G1");
      const titleCell1 = worksheet.getCell("A1");
      titleCell1.value = "SMP MUSLIMIN CILILIN";
      titleCell1.font = { bold: true, size: 16 };
      titleCell1.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A2:G2");
      const titleCell2 = worksheet.getCell("A2");
      titleCell2.value = `JADWAL MENGAJAR (${user?.full_name || "GURU"})`;
      titleCell2.font = { bold: true, size: 14 };
      titleCell2.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A3:G3");
      const titleCell3 = worksheet.getCell("A3");
      titleCell3.value = "TAHUN AJARAN 2025/2026 SEMESTER GANJIL";
      titleCell3.font = { bold: true, size: 12 };
      titleCell3.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.addRow([]);
      worksheet.addRow([]);

      // Header tabel
      const headers = [
        "JAM KE",
        "WAKTU",
        "SENIN",
        "SELASA",
        "RABU",
        "KAMIS",
        "JUMAT",
      ];
      const headerRow = worksheet.addRow(headers);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1e40af" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Generate schedule grid
      const scheduleGrid = TeacherScheduleExcel._generateScheduleGrid(
        schedules,
        days,
      );

      // Data rows dengan ISTIRAHAT
      const maxPeriods = 9;

      for (let period = 1; period <= maxPeriods; period++) {
        let time = JAM_SCHEDULE.Selasa[period];

        if (!time) continue;

        const rowData = [period, `${time.start} - ${time.end}`];

        days.forEach((day) => {
          // Jumat cuma sampai jam ke-6
          if (day === "Jumat" && period > 6) {
            rowData.push("");
            return;
          }

          if (scheduleGrid[day] && scheduleGrid[day][period]) {
            rowData.push(`Kelas ${scheduleGrid[day][period].class_id}`);
          } else if (day === "Senin" && period === 1) {
            rowData.push("UPACARA");
          } else {
            rowData.push("");
          }
        });

        const row = worksheet.addRow(rowData);

        // Styling untuk UPACARA
        if (row.getCell(3).value === "UPACARA") {
          row.getCell(3).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" },
          };
          row.getCell(3).font = { bold: true };
        }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
          };

          if (row.number % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF3F4F6" },
            };
          }
        });

        // ✅ TAMBAH BARIS ISTIRAHAT SETELAH JAM KE-4
        if (period === 4) {
          worksheet.mergeCells(`A${row.number + 1}:G${row.number + 1}`);
          const breakRow = worksheet.getRow(row.number + 1);
          const breakCell = breakRow.getCell(1);
          breakCell.value = "🕛 ISTIRAHAT 09:40 - 10:10 (30 menit)";
          breakCell.font = { bold: true, size: 11 };
          breakCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFCD34D" },
          };
          breakCell.alignment = { horizontal: "center", vertical: "middle" };
          breakCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          breakRow.height = 25;
        }

        // ✅ TAMBAH BARIS ISTIRAHAT SETELAH JAM KE-7
        if (period === 7) {
          worksheet.mergeCells(`A${row.number + 1}:G${row.number + 1}`);
          const breakRow = worksheet.getRow(row.number + 1);
          const breakCell = breakRow.getCell(1);
          breakCell.value = "🕛 ISTIRAHAT 12:10 - 13:00 (50 menit)";
          breakCell.font = { bold: true, size: 11 };
          breakCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFCD34D" },
          };
          breakCell.alignment = { horizontal: "center", vertical: "middle" };
          breakCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          breakRow.height = 25;
        }
      }

      // Footer note
      const footerRow = worksheet.addRow([]);
      worksheet.mergeCells(`A${footerRow.number}:G${footerRow.number}`);
      const footerCell = worksheet.getCell(`A${footerRow.number}`);
      footerCell.value =
        "*Waktu Mengikuti Jadwal Masing-Masing Hari. Senin & Jumat Memiliki Waktu Khusus.";
      footerCell.font = { italic: true, bold: true, size: 10 };
      footerCell.alignment = { horizontal: "center" };

      // Auto column width
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      worksheet.eachRow((row) => {
        if (!row.height) row.height = 25;
      });

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `Jadwal_Mengajar_${user?.full_name || "Guru"}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
      );

      return { success: true, message: "Jadwal berhasil diexport ke Excel!" };
    } catch (error) {
      return {
        success: false,
        message: "Gagal export ke Excel: " + error.message,
      };
    }
  },

  // ✅ DOWNLOAD TEMPLATE WITH BREAK TIMES
  downloadTemplate: async (user) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Jadwal Mengajar");

      // Title
      worksheet.mergeCells("A1:G1");
      const titleCell1 = worksheet.getCell("A1");
      titleCell1.value = "SMP MUSLIMIN CILILIN";
      titleCell1.font = { bold: true, size: 16 };
      titleCell1.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A2:G2");
      const titleCell2 = worksheet.getCell("A2");
      titleCell2.value = `TEMPLATE JADWAL MENGAJAR${
        user?.full_name ? ` (${user.full_name})` : ""
      }`;
      titleCell2.font = { bold: true, size: 14 };
      titleCell2.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A3:G3");
      const titleCell3 = worksheet.getCell("A3");
      titleCell3.value = "TAHUN AJARAN 2025/2026 SEMESTER GANJIL";
      titleCell3.font = { bold: true, size: 12 };
      titleCell3.alignment = { horizontal: "center", vertical: "middle" };

      // Instruksi pengisian
      worksheet.addRow([]);
      worksheet.mergeCells("A5:G5");
      const instructionCell = worksheet.getCell("A5");
      instructionCell.value =
        "📝 Cara Mengisi: Isi kolom hari dengan kelas yang akan diajar (contoh: 7A, 8B, 9C)";
      instructionCell.font = {
        italic: true,
        size: 10,
        color: { argb: "FF666666" },
      };
      instructionCell.alignment = { horizontal: "center" };

      worksheet.addRow([]);

      // Header tabel
      const headers = [
        "JAM KE",
        "WAKTU",
        "SENIN",
        "SELASA",
        "RABU",
        "KAMIS",
        "JUMAT",
      ];
      const headerRow = worksheet.addRow(headers);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1e40af" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Data rows dengan ISTIRAHAT
      const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
      const maxPeriods = 9;

      for (let period = 1; period <= maxPeriods; period++) {
        let time;

        if (period === 1) {
          time = JAM_SCHEDULE.Senin[period];
        } else {
          time = JAM_SCHEDULE.Selasa[period];
        }

        if (!time) continue;

        const rowData = [period, `${time.start} - ${time.end}`];

        days.forEach((day) => {
          if (day === "Jumat" && period > 6) {
            rowData.push("");
            return;
          }

          if (day === "Senin" && period === 1) {
            rowData.push("UPACARA");
          } else {
            rowData.push("");
          }
        });

        const row = worksheet.addRow(rowData);

        // Styling untuk UPACARA
        if (row.getCell(3).value === "UPACARA") {
          row.getCell(3).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" },
          };
          row.getCell(3).font = { bold: true };
        }

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
          };

          if (row.number % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF3F4F6" },
            };
          }

          if (colNumber >= 3 && colNumber <= 7 && cell.value !== "UPACARA") {
            const dayIndex = colNumber - 3;
            if (days[dayIndex] === "Jumat" && period > 6) {
              // Keep disabled
            } else {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFFFF" },
              };
            }
          }
        });

        // ✅ TAMBAH BARIS ISTIRAHAT SETELAH JAM KE-4
        if (period === 4) {
          worksheet.mergeCells(`A${row.number + 1}:G${row.number + 1}`);
          const breakRow = worksheet.getRow(row.number + 1);
          const breakCell = breakRow.getCell(1);
          breakCell.value = "🕛 ISTIRAHAT 09:40 - 10:10 (30 menit)";
          breakCell.font = { bold: true, size: 11 };
          breakCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFCD34D" },
          };
          breakCell.alignment = { horizontal: "center", vertical: "middle" };
          breakCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          breakRow.height = 25;
        }

        // ✅ TAMBAH BARIS ISTIRAHAT SETELAH JAM KE-7
        if (period === 7) {
          worksheet.mergeCells(`A${row.number + 1}:G${row.number + 1}`);
          const breakRow = worksheet.getRow(row.number + 1);
          const breakCell = breakRow.getCell(1);
          breakCell.value = "🕛 ISTIRAHAT 12:10 - 13:00 (50 menit)";
          breakCell.font = { bold: true, size: 11 };
          breakCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFCD34D" },
          };
          breakCell.alignment = { horizontal: "center", vertical: "middle" };
          breakCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          breakRow.height = 25;
        }
      }

      // Footer note
      const footerRow = worksheet.addRow([]);
      worksheet.mergeCells(`A${footerRow.number}:G${footerRow.number}`);
      const footerCell = worksheet.getCell(`A${footerRow.number}`);
      footerCell.value =
        "*Waktu Mengikuti Jadwal Masing-Masing Hari. Senin & Jumat Memiliki Waktu Khusus.";
      footerCell.font = { italic: true, bold: true, size: 10 };
      footerCell.alignment = { horizontal: "center" };

      // Auto column width
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      worksheet.eachRow((row) => {
        if (!row.height) row.height = 25;
      });

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `Template_Jadwal_${user?.full_name || "Guru"}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
      );

      return {
        success: true,
        message:
          "Template berhasil didownload! Silakan isi dan upload kembali.",
      };
    } catch (error) {
      return {
        success: false,
        message: "Gagal download template: " + error.message,
      };
    }
  },

  // ✅ IMPORT FROM EXCEL
  importFromExcel: async (file, teacherId) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error("Sheet tidak ditemukan");
      }

      const schedules = [];
      const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

      let headerRowIndex = 0;
      let dayColumns = {};

      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex > 10) return;

        row.eachCell((cell, colIndex) => {
          const cellValue = cell.value?.toString().toUpperCase().trim();

          days.forEach((day) => {
            if (cellValue === day.toUpperCase()) {
              headerRowIndex = rowIndex;
              dayColumns[day] = colIndex;
            }
          });
        });
      });

      if (!headerRowIndex) {
        throw new Error(
          "Header tidak ditemukan. Pastikan file menggunakan template yang benar.",
        );
      }

      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex <= headerRowIndex) return;

        const periodCell = row.getCell(1).value;
        const period = periodCell?.toString().trim();

        if (!period || isNaN(period)) return;

        const periodNum = parseInt(period);

        days.forEach((day) => {
          const colIndex = dayColumns[day];
          if (!colIndex) return;

          const cellValue = row.getCell(colIndex).value?.toString().trim();

          if (
            !cellValue ||
            cellValue === "" ||
            cellValue === "-" ||
            cellValue.toUpperCase() === "UPACARA"
          ) {
            return;
          }

          const daySchedule = JAM_SCHEDULE[day];
          if (!daySchedule || !daySchedule[periodNum]) {
            return;
          }

          const timeSlot = daySchedule[periodNum];

          let classId = cellValue;
          if (cellValue.toLowerCase().includes("kelas")) {
            classId = cellValue.replace(/kelas\s*/i, "").trim();
          }

          schedules.push({
            teacher_id: teacherId,
            day: day,
            start_time: timeSlot.start,
            end_time: timeSlot.end,
            class_id: classId,
          });
        });
      });

      if (schedules.length === 0) {
        throw new Error(
          "Tidak ada jadwal yang berhasil dibaca. Pastikan sudah mengisi kelas di template.",
        );
      }

      return {
        success: true,
        schedules: schedules,
        message: `Berhasil import ${schedules.length} jadwal mengajar!`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Gagal import Excel: " + error.message,
      };
    }
  },

  _generateScheduleGrid: (schedules, days) => {
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
          const periods = TeacherScheduleExcel._findPeriodsByTimeRange(
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
  },

  _findPeriodsByTimeRange: (day, startTime, endTime) => {
    const daySchedule = JAM_SCHEDULE[day];
    if (!daySchedule) return [];

    const periods = [];
    const targetStart = TeacherScheduleExcel._timeToMinutes(startTime);
    const targetEnd = TeacherScheduleExcel._timeToMinutes(endTime);

    for (const [period, timeRange] of Object.entries(daySchedule)) {
      const periodStart = TeacherScheduleExcel._timeToMinutes(timeRange.start);
      const periodEnd = TeacherScheduleExcel._timeToMinutes(timeRange.end);

      if (
        Math.abs(periodStart - targetStart) <= 5 &&
        Math.abs(periodEnd - targetEnd) <= 5
      ) {
        periods.push(period);
      }
    }

    return periods;
  },

  _timeToMinutes: (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  },
};

export default TeacherScheduleExcel;
