import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Auth/Login.jsx";
import Register from "@/pages/Auth/Register.jsx";
import Onboarding from "@/pages/Onboarding/OnBoarding.jsx";

import ProtectedRoute from "@/pages/Auth/Protected.jsx";
import OnboardingRoute from "@/pages/Onboarding/OnBoardingRoute.jsx";

import AppLayout from "@/components/Layout/AppLayout.jsx";
import App from "@/App.jsx";
import PublicRoute from "@/pages/Auth/Public.jsx";
import Home from "@/pages/Home/Home.jsx";
import ProfilePage from "@/pages/Profile/MyProfile.jsx";
import ProfileEditPage from "@/pages/Profile/ProfileEdit.jsx";
import SearchPage from "@/pages/Search/SearchPage.jsx";
import OtherUserProfile from "@/pages/Profile/OtherProfile.jsx";
import NexusFullPageCreate from "@/pages/Post/create-post/index.jsx";
import PostDetailPage from "@/pages/Post/post-details/PostDetails.jsx";
import GlobalErrorPage from "@/pages/Error/GlobalErrorPage.jsx";
import NotFoundPage from "@/pages/Error/NotFoundPage.jsx";
import SettingsPage from "@/pages/Settings/Settings.jsx";
import BookmarksPage from "@/pages/Bookmark/BookmarksPage.jsx";

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
        errorElement: <GlobalErrorPage />,
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
                path: "profile/users/:id",
                element: <OtherUserProfile />
              },
              {
                path: "profile/update/me",
                element: <ProfileEditPage />
              },
              {
                path: "explore",
                element: <SearchPage />
              },
              {
                path: "post/create",
                element: <NexusFullPageCreate />
              },
              {
                path: "post/:id",
                element: <PostDetailPage />
              },
              {
                path: "settings",
                element: <SettingsPage />
              },
              {
                path: "bookmarks",
                element: <BookmarksPage />
              },
              {
                path: "*",
                element: <NotFoundPage />
              }
            ]
          }
        ],
      },
    ],
  },
]);

export default router;