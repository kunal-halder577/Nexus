import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "@/components/Loader.jsx";
import { useGetMeQuery } from "@/features/auth/api/authApi.js";
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from "@/features/auth/authSlice";
import { useThemeEffect } from "@/components/theme.jsx";

const PublicRoute = () => {
  useThemeEffect();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const { isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  // If not logged in -> allow login/register
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center">
        <Outlet />
      </div>
    );
  }

  // Logged in but user data is loading -> show loader
  if (isLoading || isFetching) {
    return <Loader />;
  }

  // Logged in but not onboarded -> onboarding only
  if (user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // Logged in and onboarded -> go home
  return <Navigate to="/" replace />;
};

export default PublicRoute;
