import { baseApi } from "@/lib/api/baseApi.js";
import { selectCurrentUser } from "@/features/auth/authSlice.js";

// The first page arg used by the modal — must match exactly so RTK can
// locate the correct cache entry when patching optimistically.
const FIRST_PAGE = { page: 1, limit: 20 };

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

      async onQueryStarted(rawId, { dispatch, queryFulfilled, getState }) {
        // Coerce to string — ObjectIds serialized from Redux state can be objects,
        // which would produce [object Object] in cache keys and URLs.
        const id = String(rawId);
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

        // 3. Patch followers list — prepend current user as a follower doc.
        //    The arg must match the exact shape the modal uses on first fetch
        //    so RTK can find the right cache entry. The data shape mirrors what
        //    the backend returns: an array of { followerId: <user> } docs.
        const followersListPatch = dispatch(
          followApi.util.updateQueryData(
            'getFollowers',
            { id, ...FIRST_PAGE },
            (draft) => {
              if (draft?.data?.followers && currentUser) {
                draft.data.followers.unshift({ followerId: currentUser });
              }
            }
          )
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

      async onQueryStarted(rawId, { dispatch, queryFulfilled, getState }) {
        // Coerce to string — ObjectIds serialized from Redux state can be objects,
        // which would produce [object Object] in cache keys and URLs.
        const id = String(rawId);
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

        // 2. Patch user profile follower count (-1)
        const userPatch = dispatch(
          baseApi.util.updateQueryData('getUserById', id, (draft) => {
            if (draft?.stats?.followerCount !== undefined) {
              draft.stats.followerCount = Math.max(0, draft.stats.followerCount - 1);
            }
          })
        );

        // 3. Patch followers list — remove the doc whose followerId matches
        //    the current user. Must search by doc.followerId._id, not doc._id,
        //    because the array holds relationship docs not bare user objects.
        const followersListPatch = dispatch(
          followApi.util.updateQueryData(
            'getFollowers',
            { id, ...FIRST_PAGE },
            (draft) => {
              if (draft?.data?.followers && currentUser?._id) {
                const index = draft.data.followers.findIndex(
                  (doc) => doc.followerId?._id === currentUser._id
                );
                if (index !== -1) draft.data.followers.splice(index, 1);
              }
            }
          )
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
      query: ({ id, page = 1, limit = 20 }) =>
        `/follow/${id}/followers?page=${page}&limit=${limit}`,
      providesTags: (result, error, { id }) => [{ type: 'Followers', id }],
    }),

    getFollowing: builder.query({
      query: ({ id, page = 1, limit = 20 }) =>
        `/follow/${id}/following?page=${page}&limit=${limit}`,
      providesTags: (result, error, { id }) => [{ type: 'Following', id }],
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