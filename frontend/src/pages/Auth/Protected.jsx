import { useGetMeQuery } from "@/features/auth/api/authApi.js";
import Loader from "@/components/Loader.jsx"
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { isLoading, isFetching ,isError } = useGetMeQuery();
  
  if(isLoading || isFetching) {
    return <Loader />
  }
  if(isError) {
    return <Navigate to={'/login'} replace/>
  }
  return <Outlet />
}
export default ProtectedRoute;