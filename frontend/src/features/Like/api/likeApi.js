// ─── likeApi.js ──────────────────────────────────────────────────────────────
// Updated patchPostLikeState to use the correct infinite query structure

import { baseApi } from "@/lib/api/baseApi.js";

const POST_LIKERS    = "PostLikers";
const COMMENT_LIKERS = "CommentLikers";
const LIKED_CONTENT  = "LikedContent";

// ─── Patch: likers list pagination ───────────────────────────────────────────

const patchLikersCount = (api, endpoint, id, action) =>
  api.dispatch(
    baseApi.util.updateQueryData(endpoint, id, (draft) => {
      const p = draft.data?.pagination;
      if (!p) return;
      p.total       = action === "add" ? p.total + 1 : Math.max(p.total - 1, 0);
      p.totalPages  = Math.ceil(p.total / p.limit);
      p.hasNextPage = p.page * p.limit < p.total;
    })
  );

// ─── Patch: post isLiked + likeCount ─────────────────────────────────────────
// ✅ Fixed: getFeedPosts is an infiniteQuery → must loop draft.pages
// ✅ Fixed: endpoint is getPostById, not getPost

const patchPostLikeState = (api, postId, action) => {
  const isLiked    = action === "add";
  const countDelta = action === "add" ? 1 : -1;

  const applyToPost = (post) => {
    post.isLiked         = isLiked;
    post.stats           = post.stats ?? {};
    post.stats.likeCount = Math.max((post.stats.likeCount ?? 0) + countDelta, 0);
  };

  const feedPatch = api.dispatch(
    baseApi.util.updateQueryData("getFeedPosts", undefined, (draft) => {
      for (const page of draft.pages) {
        const post = page.data?.data?.find((p) => p._id === postId);
        if (post) { applyToPost(post); break; }
      }
    })
  );

  // ✅ Scan ALL cached getUserPosts entries — no userId needed from caller
  const state = api.getState();
  const queries = state[baseApi.reducerPath].queries;

  const userFeedPatches = Object.values(queries)
    .filter(
      (entry) =>
        entry?.endpointName === "getUserPosts" &&
        entry?.status === "fulfilled"
    )
    .map((entry) => {
      const userId = entry.originalArgs; // the userId the query was called with
      return api.dispatch(
        baseApi.util.updateQueryData("getUserPosts", userId, (draft) => {
          for (const page of draft.pages) {
            const post = page.data?.data?.find((p) => p._id === postId);
            if (post) { applyToPost(post); break; }
          }
        })
      );
    });

  const detailPatch = api.dispatch(
    baseApi.util.updateQueryData("getPostById", postId, (draft) => {
      const post = draft.data?.post ?? draft.data?.data ?? draft.data;
      if (post) applyToPost(post);
    })
  );

  return [feedPatch, ...userFeedPatches, detailPatch];
};

// ─── Combined optimistic handler ─────────────────────────────────────────────

const applyOptimisticLike = async (api, { likersEndpoint, postId, action }) => {
  const likersCountPatch = patchLikersCount(api, likersEndpoint, postId, action);
  const postStatePatches = patchPostLikeState(api, postId, action);

  try {
    await api.queryFulfilled;
  } catch {
    likersCountPatch.undo();
    postStatePatches.forEach((p) => p.undo());
  }
};

// ─── API Slice ────────────────────────────────────────────────────────────────

export const likeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    likePost: builder.mutation({
      query: (id) => ({ url: `likes/toggle/post/${id}`, method: "POST" }),
      invalidatesTags: (result, error, id) => [
        { type: POST_LIKERS,   id },
        { type: LIKED_CONTENT, id: "POSTS" },
      ],
      onQueryStarted: (id, api) =>
        applyOptimisticLike(api, { likersEndpoint: "getPostLikers", postId: id, action: "add" }),
    }),

    dislikePost: builder.mutation({
      query: (id) => ({ url: `likes/toggle/post/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [
        { type: POST_LIKERS,   id },
        { type: LIKED_CONTENT, id: "POSTS" },
      ],
      onQueryStarted: (id, api) =>
        applyOptimisticLike(api, { likersEndpoint: "getPostLikers", postId: id, action: "remove" }),
    }),

    likeComment: builder.mutation({
      query: (id) => ({ url: `likes/toggle/comment/${id}`, method: "POST" }),
      invalidatesTags: (result, error, id) => [
        { type: COMMENT_LIKERS, id },
        { type: LIKED_CONTENT,  id: "COMMENTS" },
      ],
      onQueryStarted: (id, api) =>
        applyOptimisticLike(api, { likersEndpoint: "getCommentLikers", postId: id, action: "add" }),
    }),

    dislikeComment: builder.mutation({
      query: (id) => ({ url: `likes/toggle/comment/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [
        { type: COMMENT_LIKERS, id },
        { type: LIKED_CONTENT,  id: "COMMENTS" },
      ],
      onQueryStarted: (id, api) =>
        applyOptimisticLike(api, { likersEndpoint: "getCommentLikers", postId: id, action: "remove" }),
    }),

    getCurrentUserLikedContent: builder.query({
      query: (type) => ({ url: `likes/${type}/me` }),
      providesTags: (result, error, type) => [
        { type: LIKED_CONTENT, id: type.toUpperCase() },
      ],
    }),

    getUserLikedContent: builder.query({
      query: ({ type, userId }) => ({ url: `likes/${type}/${userId}` }),
      providesTags: (result, error, { type, userId }) => [
        { type: LIKED_CONTENT, id: `${type.toUpperCase()}_${userId}` },
      ],
    }),

    getPostLikers: builder.query({
      query: ({id, page = 1, limit = 20}) => ({ 
        url: `likes/likers/post/${id}`,
        params: { page, limit }
      }),
      providesTags: (result, error, {id}) => [{ type: POST_LIKERS, id }],
    }),

    getCommentLikers: builder.query({
      query: (id) => ({ url: `likes/likers/comment/${id}` }),
      providesTags: (result, error, id) => [{ type: COMMENT_LIKERS, id }],
    }),
  }),
});

export const {
  useLikePostMutation,
  useDislikePostMutation,
  useLikeCommentMutation,
  useDislikeCommentMutation,
  useGetCurrentUserLikedContentQuery,
  useGetUserLikedContentQuery,
  useGetPostLikersQuery,
  useGetCommentLikersQuery,
} = likeApi;