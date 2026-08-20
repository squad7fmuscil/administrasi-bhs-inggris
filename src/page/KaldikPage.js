// page/KaldikPage.jsx
import { useState, useMemo, useEffect } from "react";
import {
  useKaldikEvents,
  createAcademicEvent,
  updateAcademicEvent,
  deleteAcademicEvent,
  fetchKaldikDocument,
} from "./KaldikData";

const ACADEMIC_YEAR = "2026/2027"; // nanti bisa dibikin dropdown kalo mau multi-tahun

export default function KaldikPage({ currentUser, onShowToast }) {
  const [view, setView] = useState("grid"); // 'grid' | 'list' | 'document'
  const [activeCategory, setActiveCategory] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null); // null = form tertutup
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [document, setDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(true);

  const { events, categories, loading, error, refetch } = useKaldikEvents({
    academicYear: ACADEMIC_YEAR,
  });

  useEffect(() => {
    fetchKaldikDocument(ACADEMIC_YEAR)
      .then(setDocument)
      .catch((err) =>
        onShowToast?.(`Gagal memuat dokumen: ${err.message}`, "error"),
      )
      .finally(() => setDocumentLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canEdit =
    currentUser?.role === "admin" || currentUser?.role === "teacher";

  const filteredEvents = useMemo(() => {
    if (!activeCategory) return events;
    return events.filter((e) => e.category_id === activeCategory);
  }, [events, activeCategory]);

  async function handleSave(formData) {
    try {
      if (editingEvent?.id) {
        await updateAcademicEvent(editingEvent.id, formData);
        onShowToast?.("Kegiatan berhasil diperbarui", "success");
      } else {
        await createAcademicEvent(formData, currentUser.id);
        onShowToast?.("Kegiatan berhasil ditambahkan", "success");
      }
      setEditingEvent(null);
      refetch();
    } catch (err) {
      onShowToast?.(`Gagal menyimpan: ${err.message}`, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Hapus kegiatan ini?")) return;
    try {
      await deleteAcademicEvent(id);
      onShowToast?.("Kegiatan berhasil dihapus", "success");
      refetch();
    } catch (err) {
      onShowToast?.(`Gagal menghapus: ${err.message}`, "error");
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Memuat kalender...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">Gagal memuat data: {error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Kalender Pendidikan
          </h1>
          <p className="text-sm text-gray-500">Tahun Ajaran {ACADEMIC_YEAR}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setEditingEvent({})}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Tambah Kegiatan
          </button>
        )}
      </div>

      {/* Toggle view + filter kategori */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "grid"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Grid
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "list"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            List
          </button>
          <button
            onClick={() => setView("document")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "document"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Dokumen Resmi
          </button>
        </div>

        {view !== "document" && (
          <select
            value={activeCategory || ""}
            onChange={(e) => setActiveCategory(e.target.value || null)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white">
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {view === "grid" && (
        <KaldikGrid
          events={filteredEvents}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onEventClick={canEdit ? setEditingEvent : undefined}
        />
      )}

      {view === "list" && (
        <KaldikList
          events={filteredEvents}
          onEdit={canEdit ? setEditingEvent : undefined}
          onDelete={canEdit ? handleDelete : undefined}
        />
      )}

      {view === "document" && (
        <KaldikDocumentView document={document} loading={documentLoading} />
      )}

      {editingEvent && (
        <KaldikEventForm
          event={editingEvent}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}

// --- Sub-komponen internal (bukan file terpisah) ---

function KaldikGrid({ events, currentMonth, onMonthChange, onEventClick }) {
  function changeMonth(delta) {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + delta);
    onMonthChange(next);
  }

  const monthLabel = currentMonth.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // Filter event yang overlap ke bulan ini (perbandingan string YYYY-MM-DD aman)
  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const eventsThisMonth = events.filter((e) => {
    const start = new Date(e.start_date);
    const end = new Date(e.end_date || e.start_date);
    return start <= monthEnd && end >= monthStart;
  });

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => changeMonth(-1)}
          className="text-sm text-gray-500 hover:text-gray-900 px-2">
          &larr;
        </button>
        <span className="text-sm font-medium text-gray-900 capitalize">
          {monthLabel}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="text-sm text-gray-500 hover:text-gray-900 px-2">
          &rarr;
        </button>
      </div>

      {/* TODO: grid 7 kolom per tanggal - untuk sekarang tampil sebagai list ringkas per bulan */}
      <div className="p-4 space-y-2">
        {eventsThisMonth.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            Tidak ada kegiatan bulan ini.
          </p>
        )}
        {eventsThisMonth.map((event) => (
          <button
            key={event.id}
            onClick={() => onEventClick?.(event)}
            disabled={!onEventClick}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left disabled:hover:bg-transparent">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.event_categories?.color }}
            />
            <span className="text-sm text-gray-700">{event.title}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {event.start_date}
              {event.end_date !== event.start_date
                ? ` – ${event.end_date}`
                : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function KaldikDocumentView({ document, loading }) {
  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white p-10 text-center text-sm text-gray-400">
        Memuat dokumen...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white p-10 text-center">
        <p className="text-sm text-gray-500">
          Belum ada dokumen resmi yang di-upload untuk tahun ajaran ini.
        </p>
      </div>
    );
  }

  // Supabase Storage kadang ngirim Content-Disposition: attachment buat PDF,
  // jadi browser maksa download alih-alih render inline. Google Docs Viewer
  // dipake sebagai perantara supaya PDF-nya tetap bisa di-embed.
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    document.file_url,
  )}&embedded=true`;

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">{document.title}</p>
        <a
          href={document.file_url}
          download
          className="text-xs text-blue-600 hover:underline">
          Download PDF
        </a>
      </div>
      <iframe
        src={viewerUrl}
        title={document.title}
        className="w-full"
        style={{ height: "80vh", border: "none" }}
      />
    </div>
  );
}

function KaldikList({ events, onEdit, onDelete }) {
  return (
    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
      {events.length === 0 && (
        <div className="p-6 text-sm text-gray-500 text-center">
          Belum ada kegiatan.
        </div>
      )}
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.event_categories?.color }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{event.title}</p>
              <p className="text-xs text-gray-500">
                {event.start_date}
                {event.end_date !== event.start_date
                  ? ` – ${event.end_date}`
                  : ""}
              </p>
            </div>
          </div>
          {onEdit && (
            <div className="flex gap-3">
              <button
                onClick={() => onEdit(event)}
                className="text-xs text-blue-600 hover:underline">
                Edit
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="text-xs text-red-600 hover:underline">
                Hapus
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function KaldikEventForm({ event, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    title: event.title || "",
    category_id: event.category_id || categories[0]?.id || "",
    start_date: event.start_date || "",
    end_date: event.end_date || "",
    description: event.description || "",
    academic_year: event.academic_year || ACADEMIC_YEAR,
    semester: event.semester || "ganjil",
  });

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <h2 className="text-base font-semibold text-gray-900">
          {event.id ? "Edit Kegiatan" : "Tambah Kegiatan"}
        </h2>

        <input
          type="text"
          placeholder="Nama kegiatan"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          required
        />

        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">
              Tanggal mulai
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">
              Tanggal selesai (opsional)
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <select
          value={form.semester}
          onChange={(e) => setForm({ ...form, semester: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="ganjil">Semester Ganjil</option>
          <option value="genap">Semester Genap</option>
        </select>

        <textarea
          placeholder="Deskripsi (opsional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
