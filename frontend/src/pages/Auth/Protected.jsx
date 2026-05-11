import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "@/components/Loader.jsx";
import { useGetMeQuery } from "@/features/auth/api/authApi.js";
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from "@/features/auth/authSlice";
import { useThemeEffect } from "@/components/theme.jsx";

const ProtectedRoute = () => {
  useThemeEffect();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const { isLoading, isFetching } = useGetMeQuery();

  // ✅ FIX: Priority 1 - Handling Initial Load
  // If we are currently fetching data AND we don't have a user yet,
  // we MUST show the loader. We cannot redirect yet because we don't know the result.
  if ((isLoading || isFetching) && !user) {
    return <Loader />;
  }

  // ✅ FIX: Priority 2 - Security Check
  // Only now, after the loader has finished (or if we have a user), 
  // do we check authentication.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user exists and not onboarded -> force onboarding
  if (user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;