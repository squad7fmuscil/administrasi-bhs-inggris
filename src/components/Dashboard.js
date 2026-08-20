// components/Dashboard.js
import React, { useEffect } from "react";
import DashboardAdmin from "./DashboardAdmin";
import DashboardHomeTeacher from "./DashboardHomeTeacher";

const Dashboard = ({ currentUser, onPageChange }) => {
  useEffect(() => {
    // Log untuk debugging
    console.log("Dashboard Router - Current User:", currentUser);
  }, [currentUser]);

  // Safety check
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Role-based routing
  if (currentUser.role === "admin") {
    return (
      <DashboardAdmin currentUser={currentUser} onPageChange={onPageChange} />
    );
  }

  if (currentUser.role === "teacher") {
    return (
      <DashboardHomeTeacher
        currentUser={currentUser}
        onPageChange={onPageChange}
      />
    );
  }

  // Fallback untuk role yang tidak dikenali
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Role Tidak Dikenali
        </h3>
        <p className="text-gray-600 mb-4">
          Role: <span className="font-semibold">{currentUser.role}</span>
        </p>
        <p className="text-sm text-gray-500">
          Silakan hubungi administrator untuk bantuan.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
