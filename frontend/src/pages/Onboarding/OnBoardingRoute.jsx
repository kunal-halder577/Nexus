import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "@/components/Loader.jsx";
import { useGetMeQuery } from "@/features/auth/api/authApi.js";
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from "@/features/auth/authSlice.js";
import { useThemeEffect } from "@/components/theme";

const OnboardingRoute = () => {
  useThemeEffect();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const { isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isLoading || isFetching) return <Loader />;

  // If already onboarded -> go home
  if (user?.isOnboarded) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default OnboardingRoute;
