import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Auth/Login.jsx";
import Register from "@/pages/Auth/Register.jsx";
import Onboarding from "@/pages/Onboarding/OnBoarding.jsx";

import ProtectedRoute from "@/pages/Auth/Protected.jsx";
import OnboardingRoute from "@/pages/Onboarding/OnBoardingRoute.jsx";

import AppLayout from "@/components/Layout/AppLayout.jsx";
import App from "@/App";
import PublicRoute from "@/pages/Auth/Public";
import Home from "@/pages/Home/Home";
import ProfilePage from "@/pages/Profile/MyProfile";
import ProfileEditPage from "@/pages/Profile/ProfileEdit";

const router = createBrowserRouter([
  // Authenticaion
  {
    element: <PublicRoute />,
    children: [
      { 
        path: "/register", 
        element: <Register /> 
      },
      { 
        path: "/login", 
        element: <Login /> 
      },
    ]
  },
  
  // Only onboarding
  {
    element: <OnboardingRoute />,
    children: [
      { 
        path: "/onboarding", 
        element: <Onboarding /> 
      }
    ],
  },

  // Main app (must be logged in + onboarded)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          { 
            path: "/", 
            element: <AppLayout />,
            children: [
              {
                index: true,
                element: <Home />
              },
              {
                path: "profile/me",
                element: <ProfilePage />
              },
              {
                path: "profile/update/me",
                element: <ProfileEditPage />
              }
            ]
          }
        ],
      },
    ],
  },
]);

export default router;