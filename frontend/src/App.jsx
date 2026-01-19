import { useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { useLogoutMutation } from "./features/auth/api/authApi";
import useAuthStore from "./stores/auth.store";
import { useDispatch } from "react-redux";
import { baseApi } from "./lib/api/baseApi";
import AppLayout from "./components/Layout/AppLayout";

function App() {
  const [logout, { error }] = useLogoutMutation();
  const clientLogout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async () => {
    try {
      const response = await logout().unwrap();
      console.log(response);
    } catch (error) {
      console.log(error);
    } finally {
      dispatch(baseApi.util.resetApiState()); // clear RTK Query cache, using the baseApi (main Api slice), so that no protected data stays
      clientLogout(); // clear the Zustand auth state
      navigate('/login');
    }
  }
  return (
    <>
      <AppLayout />
       <Button onClick={onSubmit}>
        logout
       </Button>
    </>
  );
}

export default App;
