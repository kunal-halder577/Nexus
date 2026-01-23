import { baseApi } from "@/lib/api/baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => ({
        url: "/auth/register",
        method: 'POST',
        body: data
      })
    }),
    login: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: 'POST',
        body: data,
      })
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: 'POST',
      })
    }),
    getMe: builder.query({
      query: () => ({
        url: "/auth/me",
        method: 'GET',
      })
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