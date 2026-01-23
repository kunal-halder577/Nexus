import { createSlice } from '@reduxjs/toolkit';
import { userApi } from '@/features/user/api/userApi.js';
import { authApi } from './api/authApi.js';
import { logout, tokenReceived } from './authAction.js';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
       state.user = action.payload.user;
       state.token = action.payload.accessToken;
       state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(tokenReceived, (state, action) => {
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      // --- 1. THE SESSION CHECK (Crucial for App Start) ---
      // When AuthGuard calls GET /auth/me
      .addMatcher(
        authApi.endpoints.getMe.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.data?.user;
          state.token = payload.data?.accessToken;
          state.isAuthenticated = true; 
        }
      )

      // --- 2. THE LOGIN ACTION ---
      .addMatcher(
        authApi.endpoints.login.matchFulfilled, 
        (state, { payload }) => {
          state.token = payload.data?.accessToken;
          state.user = payload.data?.user;
          state.isAuthenticated = true;
        }
      )

      // --- THE REGISTER ACTION --- 
      .addMatcher(
        authApi.endpoints.register.matchFulfilled, 
        (state, { payload }) => {
          state.token = payload.data?.accessToken;
          state.user = payload.data?.user;
          state.isAuthenticated = true;
        }
      )

      // --- 3. THE DATA SYNC (Optional but recommended) ---
      // If you fetch GET /users/me later, update the Redux state 
      // so the data stays fresh (e.g. if name changed).
      .addMatcher(
        userApi.endpoints.getUserProfile.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.data; 
          // No need to set isAuthenticated, it's already true
        }
      )
      
      // --- 4. THE ONBOARDING UPDATE ---
      .addMatcher(
        userApi.endpoints.onboarding.matchFulfilled,
        (state, { payload }) => {
          state.user = payload.data; 
        }
      );
  },
});

export const { setCredentials } = authSlice.actions;
export default authSlice.reducer;
export const selectCurrentUser = (state) => state.auth.user;

// 2. The Access Token (Needed for API Headers or manual checks)
export const selectCurrentToken = (state) => state.auth.token;

// 3. The Auth Status (Boolean)
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;