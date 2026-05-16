import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router';
import router from '@/routes/index.jsx';
import AppProvider from '@/app/providers/AppProvider.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { googleClientId } from './lib/constants';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppProvider>
        <RouterProvider router={router}/>
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
