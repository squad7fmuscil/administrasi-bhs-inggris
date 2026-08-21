// students/StudentBottomNav.js
// ========================================================================
// Bottom navbar khusus portal siswa. PENTING: item nav pake <button onClick
// onPageChange(...)> (state-based, sama kayak BottomNav.js punya admin),
// BUKAN <a href="..."> — soalnya app ini routingnya berbasis currentPage
// state di App.js, bukan react-router. Pake <a href> bakal full page
// reload ke URL yang gak ada, ujungnya blank/404.
// ========================================================================
import { Home, Calendar, ClipboardCheck, Grid3x3 } from "lucide-react";

export default function StudentBottomNav({ currentPage, onPageChange }) {
  const items = [
    { id: "student-dashboard", label: "Home", icon: Home },
    { id: "student-jadwal", label: "Jadwal", icon: Calendar },
    { id: "student-presensi", label: "Presensi", icon: ClipboardCheck },
    { id: "student-lainnya", label: "Lainnya", icon: Grid3x3 },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-stretch justify-around px-1.5 pt-2 pb-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPageChange(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-0.5 min-w-0">
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-blue-600" : "text-gray-400"}
              />
              <span
                className={`text-[11px] font-medium truncate max-w-full ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
