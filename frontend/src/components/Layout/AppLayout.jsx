import { Outlet, Navigate } from "react-router-dom";
import Header from "./Header.jsx";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "@/features/auth/authSlice.js";
import Loader from "@/components/Loader.jsx"
import { useGetMeQuery } from "@/features/auth/api/authApi.js";

const AppLayout = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  // Only fetch the session if the user is authenticated to prevent 401 spam
  const { isLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated
  });

  // 1. Show loader only if the API is actually running
  if (isLoading) {
    return <Loader />
  }

  // 2. Redirect incomplete profiles to onboarding
  if (isAuthenticated && user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default AppLayout;