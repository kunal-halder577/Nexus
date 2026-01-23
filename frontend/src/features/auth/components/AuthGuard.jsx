import { Outlet, Navigate } from "react-router-dom";
import { useGetMeQuery } from "../api/authApi";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectCurrentToken } from "../authSlice.js"; 

const AuthGuard = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectCurrentToken);

  // Skip if logged out OR if we already have a session
  const shouldSkip = !isAuthenticated || !!token;

  // Checks the session with the backend if we don't have user data yet
  const { isError } = useGetMeQuery(undefined, {
    skip: shouldSkip, 
  });

  // If absolutely not authenticated, boot to login
  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;