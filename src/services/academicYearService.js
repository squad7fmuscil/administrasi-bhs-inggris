import { supabase } from "../supabaseClient";

// ✅ Ambil info tahun ajaran & semester yang sedang aktif
export const getActiveAcademicInfo = async () => {
  try {
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    return data || null;
  } catch (error) {
    console.error("Error fetching active academic info:", error);
    return null;
  }
};

// ✅ Ambil semua semester (buat dropdown pilihan)
export const getAllSemesters = async () => {
  try {
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .order("year", { ascending: false })
      .order("semester", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching semesters:", error);
    return [];
  }
};

// ✅ Filter array data berdasarkan semester (rentang tanggal semester tsb)
// data: array of object yang punya field 'date' (format YYYY-MM-DD)
export const filterBySemester = (data, semesterInfo) => {
  if (!semesterInfo || !data) return data;

  const start = new Date(semesterInfo.start_date);
  const end = new Date(semesterInfo.end_date);

  return data.filter((item) => {
    if (!item.date) return false;
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
};

// ✅ Nama tampilan semester, contoh: "2026/2027 - Semester Ganjil"
export const getSemesterDisplayName = (semesterInfo) => {
  if (!semesterInfo) return "";
  const semesterLabel =
    Number(semesterInfo.semester) === 1 ? "Ganjil" : "Genap";
  return `${semesterInfo.year} - Semester ${semesterLabel}`;
};

// ✅ Cek apakah suatu tanggal valid berada dalam rentang semester tertentu
export const isDateInSemester = (dateString, semesterInfo) => {
  if (!dateString || !semesterInfo) return true;

  const inputDate = new Date(dateString);
  const start = new Date(semesterInfo.start_date);
  const end = new Date(semesterInfo.end_date);

  return inputDate >= start && inputDate <= end;
};

// ✅ Ambil tahun ajaran aktif beserta semua semester di tahun itu
// Return: { year, semesters: [{ id, year, semester, is_active, start_date, end_date }, ...] } atau null
export const getActiveAcademicYear = async () => {
  try {
    const activeInfo = await getActiveAcademicInfo();
    if (!activeInfo) return null;

    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .eq("year", activeInfo.year)
      .order("semester", { ascending: true });

    if (error) throw error;

    return {
      year: activeInfo.year,
      semesters: data || [],
    };
  } catch (error) {
    console.error("Error fetching active academic year:", error);
    return null;
  }
};

// ✅ Fallback tahun ajaran kalau data DB kosong (berdasarkan tanggal hari ini)
// Juli-Desember dianggap awal tahun ajaran baru
export const getCurrentAcademicYearFallback = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  if (month >= 7) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

// ✅ Fallback semester kalau data DB kosong (1 = Ganjil, 2 = Genap)
export const getCurrentSemesterFallback = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  return month >= 7 ? 1 : 2;
};

// ✅ Ubah angka semester jadi teks tampilan ("Ganjil" / "Genap")
export const formatSemesterDisplay = (semester) => {
  return Number(semester) === 1 ? "Ganjil" : "Genap";
};

// ✅ Ambil objek semester yang sedang aktif (alias dari getActiveAcademicInfo)
export const getActiveSemester = async () => {
  return await getActiveAcademicInfo();
};

// ✅ Ambil string tahun ajaran aktif, contoh: "2026/2027"
export const getActiveYearString = async () => {
  const activeInfo = await getActiveAcademicInfo();
  return activeInfo?.year || getCurrentAcademicYearFallback();
};

// ✅ Ambil ID dari record academic_years yang sedang aktif
export const getActiveAcademicYearId = async () => {
  const activeInfo = await getActiveAcademicInfo();
  return activeInfo?.id || null;
};

// ✅ Terapkan filter tahun ajaran/semester/subject/class ke query builder Supabase
// query: query builder supabase (misal supabase.from("grades").select())
// filters: { academicYearId, semester, subject, classId }
export const applyAcademicFilters = (query, filters = {}) => {
  let filteredQuery = query;

  if (filters.academicYearId) {
    filteredQuery = filteredQuery.eq(
      "academic_year_id",
      filters.academicYearId,
    );
  }
  if (filters.semester) {
    filteredQuery = filteredQuery.eq("semester", filters.semester);
  }
  if (filters.subject) {
    filteredQuery = filteredQuery.eq("subject", filters.subject);
  }
  if (filters.classId) {
    filteredQuery = filteredQuery.eq("class_id", filters.classId);
  }

  return filteredQuery;
};
