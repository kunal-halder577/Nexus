import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { useGetMeQuery } from "@/features/auth/api/authApi.js";
import Loader from "@/components/Loader.jsx";

const AdminRoute = () => {
  const user = useSelector(selectCurrentUser);
  const { isLoading, isFetching } = useGetMeQuery();

  // Wait for the fresh user data to avoid kicking admins due to stale persisted state
  if (isLoading || isFetching) {
    return <Loader />;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
