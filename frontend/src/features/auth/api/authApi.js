import { baseApi } from "@/lib/api/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => ({
        url: "/auth/register",
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['User'],
    }),
    login: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: 'POST',
        // Safety net in case backend returns plain text instead of JSON
        responseHandler: (response) => response.text(), 
      }),
      // Clearing the User tag on logout instantly wipes the Redux Cache
      invalidatesTags: ['User'], 
    }),
    getMe: builder.query({
      query: () => ({
        url: "/auth/me",
        method: 'GET',
      }),
      // CRITICAL FIX: Queries PROVIDE tags. They do not invalidate them.
      providesTags: ['User'], 
    }),
    refresh: builder.mutation({
      query: () => ({
        url: "/auth/refresh/access-token",
        method: 'POST',
      })
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;