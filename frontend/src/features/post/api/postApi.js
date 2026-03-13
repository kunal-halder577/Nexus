import { baseApi } from "@/lib/api/baseApi";
import { current } from "@reduxjs/toolkit";

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createPost: builder.mutation({
      query: (data) => ({
        url: '/posts',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    getFeedPosts: builder.infiniteQuery({
      query: ({ pageParam }) => {
        const params = { limit: 10 };
        if (pageParam) {
          params.cursorId = pageParam.cursorId;
          params.cursorCreatedAt = pageParam.cursorCreatedAt;
        }
        return {
          url: '/posts/feed',
          method: 'GET',
          params: params,
        };
      },
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.data?.nextCursor || undefined,
      },
      providesTags: (result) =>
        result?.pages
            ? [
                // Note: Double check if this should be page.data.data or page.data.posts based on your backend!
                ...result.pages.flatMap(page =>
                  page.data.data.map(post => ({ type: 'Post', id: post._id }))
                ),
                { type: 'Post', id: 'LIST' }
              ]
            : [{ type: 'Post', id: 'LIST' }]
    }),
    getUserPosts: builder.infiniteQuery({
      query: ({ pageParam, queryArg: userId }) => {
        const params = { limit: 10 };
        if (pageParam) {
          params.cursorId = pageParam.cursorId;
          params.cursorCreatedAt = pageParam.cursorCreatedAt;
        }
        return {
          url: `/posts/user/${userId}`,
          method: 'GET',
          params: params,
        };
      },
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.data?.nextCursor || undefined,
      },
      providesTags: (result) =>
        result?.pages
            ? [
                ...result.pages.flatMap(page =>
                  page.data.data.map(post => ({ type: 'Post', id: post._id }))
                ),
                { type: 'Post', id: 'LIST' }
            ]
            : [{ type: 'Post', id: 'LIST' }]
    }),
    getPostById: builder.query({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Post', id }] 
    }),
    updatePost: builder.mutation({
      query: ({id, ...patch}) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch
      }),
      // FIX: Only invalidate the specific post so the infinite feed doesn't reset to page 1
      invalidatesTags: (result, error, { id }) => [
        { type: 'Post', id }
      ],
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        
        // 1. Dispatch an action to manually update the 'getFeedPosts' cache instantly
        const patchResult = dispatch(
          // updateQueryData takes 3 args: (EndpointName, QueryArgument, DraftCallback)
          // The argument for getFeedPosts is 'undefined' because we didn't pass anything to the hook
          postApi.util.updateQueryData('getFeedPosts', undefined, (draft) => {
            
            // 'draft' is your cached Infinite Query object: { pages: [...] }
            // We need to loop through the pages to find the post we want to update
            for (const page of draft.pages) {
              const postToUpdate = page.data.data.find((post) => post._id === id);
              
              if (postToUpdate) {
                // If we found the post, merge the new changes (like a new title or likes count)
                // directly into the cached object. The UI will update instantly!
                Object.assign(postToUpdate, patch);
                break; // Stop looping once we found it
              }
            }
          })
        );

        // 2. Wait for the actual backend request to finish
        try {
          await queryFulfilled;
        } catch (err) {
          // 3. If the backend throws an error (e.g., network failure), 
          // undo the optimistic update so the UI snaps back to reality.
          patchResult.undo();
        }
      }
    }),
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE'
      }),
      // ─── THE FIX: OPTIMISTIC UPDATE ─────────────────────────────────────────
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // 1. Instantly remove the post from the cached feed list.
        // Replace 'getPosts' with whatever your feed query is actually named!
        const patchResult = dispatch(
          postApi.util.updateQueryData('getFeedPosts', undefined, (draft) => {
            // 1. Loop through every page of data you've fetched so far
            draft.pages.forEach((page) => {
              // 2. Safely check if the posts array exists on this page
              if (page?.data?.data) {
                // 3. Filter out the deleted post from this specific page's array
                page.data.data = page.data.data.filter((post) => post._id !== id);
              }
            });
          })
        );

        try {
          // 2. Wait for the server to confirm the delete was successful
          await queryFulfilled;
        } catch {
          // 3. If the server throws an error (e.g. network failure), undo the UI change
          patchResult.undo();
        }
      },
      // ──────────────────────────────────────────────────────────────────────
      
      // We ONLY invalidate the LIST now, just to keep pagination/sync clean in the background.
      // We DO NOT invalidate the specific `{ type: 'Post', id }` anymore!
      invalidatesTags: [{ type: 'Post', id: 'LIST' }] 
    }),
  }),
})

export const {
  useCreatePostMutation,
  useGetPostByIdQuery,
  useDeletePostMutation,
  useUpdatePostMutation,
  useGetFeedPostsInfiniteQuery,
  useGetUserPostsInfiniteQuery,
} = postApi;