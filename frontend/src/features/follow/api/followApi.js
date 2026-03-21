import { baseApi } from "@/lib/api/baseApi.js";
import { selectCurrentUser } from "@/features/auth/authSlice.js";

export const followApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // --- FOLLOW USER ---
    followUser: builder.mutation({
      query: (id) => ({
        url: `/follow/${id}`,
        method: 'POST',
      }),
      // FollowStatus intentionally excluded — onQueryStarted owns that patch
      invalidatesTags: (result, error, id) =>
        error ? [] : [{ type: 'Followers', id }],

      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const currentUser = selectCurrentUser(getState());

        // 1. Patch follow status
        const statusPatch = dispatch(
          followApi.util.updateQueryData('getFollowStatus', id, (draft) => {
            if (draft?.data) {
              draft.data.isFollowing = true;
              draft.data.status = 'following';
            }
          })
        );

        // 2. Patch user profile follower count (+1)
        const userPatch = dispatch(
          baseApi.util.updateQueryData('getUserById', id, (draft) => {
            if (draft?.stats) {
              draft.stats.followerCount = (draft.stats.followerCount || 0) + 1;
            }
          })
        );

        // 3. Patch followers list — add current user to top
        const followersListPatch = dispatch(
          followApi.util.updateQueryData('getFollowers', id, (draft) => {
            if (draft?.data && currentUser) {
              draft.data.unshift(currentUser);
            }
          })
        );

        try {
          await queryFulfilled;
          // Invalidate current user's Following list so it stays fresh
          if (currentUser?._id) {
            dispatch(
              followApi.util.invalidateTags([
                { type: 'Following', id: currentUser._id },
              ])
            );
          }
        } catch {
          statusPatch.undo();
          userPatch.undo();
          followersListPatch.undo();
        }
      },
    }),

    // --- UNFOLLOW USER ---
    unfollowUser: builder.mutation({
      query: (id) => ({
        url: `/follow/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) =>
        error ? [] : [{ type: 'Followers', id }],

      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const currentUser = selectCurrentUser(getState());

        // 1. Patch follow status
        const statusPatch = dispatch(
          followApi.util.updateQueryData('getFollowStatus', id, (draft) => {
            if (draft?.data) {
              draft.data.isFollowing = false;
              draft.data.status = 'not_following';
            }
          })
        );

        const userPatch = dispatch(
          baseApi.util.updateQueryData('getUserById', id, (draft) => {
            if (draft?.stats?.followerCount !== undefined) {
              draft.stats.followerCount = Math.max(0, draft.stats.followerCount - 1);
            }
          })
        );
        const followersListPatch = dispatch(
          followApi.util.updateQueryData('getFollowers', id, (draft) => {
            if (draft?.data && currentUser?._id) {
              const index = draft.data.findIndex(
                (user) => user._id === currentUser._id
              );
              if (index !== -1) draft.data.splice(index, 1);
            }
          })
        );

        try {
          await queryFulfilled;
          if (currentUser?._id) {
            dispatch(
              followApi.util.invalidateTags([
                { type: 'Following', id: currentUser._id },
              ])
            );
          }
        } catch {
          statusPatch.undo();
          userPatch.undo();
          followersListPatch.undo();
        }
      },
    }),

    // --- QUERIES ---
    getFollowers: builder.query({
      query: (id) => `/follow/${id}/followers`,
      providesTags: (result, error, id) => [{ type: 'Followers', id }],
    }),

    getFollowing: builder.query({
      query: (id) => `/follow/${id}/following`,
      providesTags: (result, error, id) => [{ type: 'Following', id }],
    }),

    getFollowStatus: builder.query({
      query: (id) => `/follow/${id}/status`,
      providesTags: (result, error, id) => [{ type: 'FollowStatus', id }],
    }),
  }),
});

export const {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowingQuery,
  useGetFollowersQuery,
  useGetFollowStatusQuery,
} = followApi;