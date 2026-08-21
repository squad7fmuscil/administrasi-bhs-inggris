// students/StudentAccordionItem.js
// Komponen reusable buat 1 baris menu accordion di halaman "Akun".
// Klik header -> toggle expand/collapse body-nya (dikontrol dari luar
// lewat props `open` + `onToggle`, biar parent bisa atur "cuma 1 yang
// boleh kebuka" atau bebas multi-open, terserah kebutuhan).
import React from "react";
import { ChevronDown } from "lucide-react";

export default function StudentAccordionItem({
  icon,
  iconBgClass = "bg-blue-50",
  title,
  titleClass = "text-gray-700",
  open,
  onToggle,
  children,
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left">
        <div
          className={`w-9 h-9 ${iconBgClass} rounded-full flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold flex-1 ${titleClass}`}>
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Body cuma di-render (dan di-mount) pas open === true, jadi kalau
          isinya ada fetch data (piket/pengumuman/dll), fetch-nya baru
          jalan pas section ini diklik, bukan pas halaman kebuka. */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50">{children}</div>
      )}
    </section>
  );
}
