// src/pages/Auth/Protected.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/features/auth/authSlice.js";
import { useThemeEffect } from "@/components/theme"; // Assuming this is your theme hook

const ProtectedRoute = () => {
  // 1. Sync Theme (Keep this from your original code)
  useThemeEffect();

  // 2. Final Security Check
  // AuthGuard usually handles this, but this is a fail-safe.
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Render the Page
  return <Outlet />;
};

export default ProtectedRoute;