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
    updateUserAvatar: builder.mutation({
      query: (data) => ({
        url: '/users/update-avatar',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    getUserById: builder.query({
      query: (id) => ({
        url: `users/${id}`,
        method: 'GET'
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    searchUsers: builder.query({
      query: (searchArgs) => ({
        url: '/users/search',
        params: {
          username: searchArgs.username,
          email: searchArgs.email,
        }
      })
    })
  }),
  overrideExisting: false,
});

export const {
  useOnboardingMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUpdateUserAvatarMutation,
  useSearchUsersQuery,
  useLazySearchUsersQuery,
  useGetUserByIdQuery,
} = userApi;