import { baseApi } from "@/lib/api/baseApi.js";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    onboarding: builder.mutation({
      query: (data) => ({
        url: '/users/me/onboarding',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    getUserProfile: builder.query({
      query: () => ({
        url: '/users/me',
        method: 'GET'
      }),
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useOnboardingMutation,
  useGetUserProfileQuery,
} = userApi;