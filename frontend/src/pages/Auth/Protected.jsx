import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "@/components/Loader.jsx";
import { useGetMeQuery } from "@/features/auth/api/authApi";
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from "@/features/auth/authSlice";
import { useThemeEffect } from "@/components/theme";

const ProtectedRoute = () => {
  useThemeEffect();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const { isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if ((isLoading || isFetching) && !user) return <Loader />;

  // If user exists and not onboarded -> force onboarding
  if (user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
