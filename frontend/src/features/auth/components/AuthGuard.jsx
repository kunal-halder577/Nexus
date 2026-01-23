import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useGetMeQuery } from "../api/authApi";
import useAuthStore from "@/stores/auth.store";

const AuthGuard = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);

  const { data, isSuccess } = useGetMeQuery(undefined, {
    skip: isAuthenticated, // ✅ stop calling once auth is set
  });

  useEffect(() => {
    if (isSuccess && !isAuthenticated) {
      setAuth(data?.data?.accessToken);
    }
  }, [isSuccess, isAuthenticated, setAuth, data]);

  return <Outlet />;
};

export default AuthGuard;
