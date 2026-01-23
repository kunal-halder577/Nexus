import App from "@/App.jsx";
import AuthGuard from "@/features/auth/components/AuthGuard.jsx";
import Login from "@/pages/Auth/Login.jsx";
import ProtectedRoute from "@/pages/Auth/Protected.jsx";
import Register from "@/pages/Auth/Register.jsx";
import OnboardingContainer from "@/pages/Onboarding/OnBoarding";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: '/register',
    element: <Register />,
  }, 
  {
    path: '/login',
    element: <Login />
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/onboarding',
            element: <OnboardingContainer />
          },
          {
            path: '/',
            element: <App />,
            children: []
          }
        ]
      }
    ]
  }
]);

export default router;