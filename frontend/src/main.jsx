import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router';
import router from '@/routes/index.jsx';
import AppProvider from '@/app/providers/AppProvider.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router}/>
    </AppProvider>
  </StrictMode>
);
