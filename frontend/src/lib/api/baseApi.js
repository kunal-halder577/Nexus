import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseURL } from "../constants.js";
import { logout, tokenReceived } from "@/features/auth/authAction.js";

const baseQuery = fetchBaseQuery({
  baseUrl: baseURL,
  credentials: "include", // Send the httpOnly cookies with request
  prepareHeaders: (headers, { getState }) => {
    // Access state directly to avoid importing authSlice
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReAuth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // --- FIX 1: Handle HTML/Parsing Errors (e.g., Backend sends HTML 401) ---
  if (result.error && result.error.status === 'PARSING_ERROR') {
    console.warn("Server returned non-JSON response. forcing logout.");
    api.dispatch(logout());
    return result;
  }

  // --- FIX 2: Standard 401 (Unauthorized) Handling ---
  if (result?.error?.status === 401) {
    
    // A. Don't try to refresh if we are already trying to LOGOUT
    // (If logout fails with 401, we are effectively logged out anyway)
    const url = typeof args === 'string' ? args : args.url;
    if (url.includes('logout')) {
      return result;
    }

    // B. Don't try to refresh if the failed request WAS the refresh endpoint
    // (Prevent infinite loops)
    if (url.includes('refresh/access-token')) {
      api.dispatch(logout());
      return result;
    }

    // C. Attempt to Refresh the Token
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh/access-token',
        method: 'POST',
      },
      api,
      extraOptions
    );

    if (refreshResult?.data?.accessToken) {
      const newToken = refreshResult.data.accessToken;
      
      // Update the store with the new token
      api.dispatch(tokenReceived(newToken));

      // Retry the original request with the new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed (Session expired) -> Logout user
      api.dispatch(logout());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReAuth,
  // Define tags for caching invalidation
  tagTypes: ["User", "Post", "Comment", "Notification"],
  endpoints: () => ({}),
});