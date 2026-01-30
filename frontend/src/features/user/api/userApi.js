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
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: '/users/me',
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useOnboardingMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = userApi;