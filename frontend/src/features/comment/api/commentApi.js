import { baseApi } from "@/lib/api/baseApi";
import { postApi } from "@/features/post/api/postApi.js";

export const commentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        // ─── CREATE COMMENT ──────────────────────────────────────────────────────
        // True optimistic: inserts a pending comment into cache immediately,
        // replaces it with the server result on success, or removes it on failure.
        createComment: builder.mutation({
            query: (data) => ({
                url: '/comments',
                method: 'POST',
                body: data,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
                const currentUser = getState().auth.user;
                const tempId = `optimistic-${Date.now()}-${Math.random()}`;

                // Build a realistic-looking pending comment from local info
                const pendingComment = {
                    _id: tempId,
                    content: { text: arg.content },
                    postId: arg.postId,
                    parentId: arg.parentId ?? null,
                    author: {
                        _id: currentUser?._id,
                        name: currentUser?.name,
                        username: currentUser?.username,
                        avatarUrl: currentUser?.avatarUrl,
                    },
                    stats: { likeCount: 0, replyCount: 0 },
                    isLiked: false,
                    isEdited: false,
                    deletedAt: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isPending: true,   // ← drives faint/pending UI
                };

                const patches = [];

                if (arg.parentId) {
                    // ── Inserting a REPLY (depth 1 or depth 2) ──────────────────
                    // 1. Push pending reply into the parent's reply list
                    patches.push(
                        dispatch(
                            commentApi.util.updateQueryData('getReplies', { commentId: arg.parentId }, (draft) => {
                                if (draft?.data?.replies) {
                                    draft.data.replies.unshift(pendingComment);
                                    if (draft.data.pagination) draft.data.pagination.total += 1;
                                }
                            })
                        )
                    );

                    // 2. Increment replyCount on the parent comment wherever it lives.
                    //    The parent could be in getPostComments (depth-0 parent) or in
                    //    another getReplies cache (depth-1 parent).
                    //    Strategy: scan ALL cached getReplies entries for the parent.
                    //    RTK Query exposes getState().api.queries so we read every
                    //    getReplies-* entry and patch any that contain the parent.
                    const state = getState();
                    const allQueries = state[baseApi.reducerPath]?.queries ?? {};

                    // Update the parent's replyCount in getPostComments cache
                    patches.push(
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId: arg.postId }, (draft) => {
                                if (!draft?.data?.comments) return;
                                const parent = draft.data.comments.find(c => c._id === arg.parentId);
                                if (parent?.stats) parent.stats.replyCount = (parent.stats.replyCount || 0) + 1;
                            })
                        )
                    );

                    // Update the parent's replyCount in any getReplies cache
                    // (handles depth-2: parent is depth-1 living inside getReplies-{depth0Id})
                    Object.values(allQueries).forEach((entry) => {
                        if (
                            entry?.endpointName === 'getReplies' &&
                            entry?.data?.data?.replies
                        ) {
                            const parentInEntry = entry.data.data.replies.find(
                                (r) => r._id === arg.parentId
                            );
                            if (parentInEntry) {
                                const grandparentId = entry.originalArgs?.commentId;
                                patches.push(
                                    dispatch(
                                        commentApi.util.updateQueryData('getReplies', { commentId: grandparentId }, (draft) => {
                                            if (!draft?.data?.replies) return;
                                            const p = draft.data.replies.find(r => r._id === arg.parentId);
                                            if (p?.stats) p.stats.replyCount = (p.stats.replyCount || 0) + 1;
                                        })
                                    )
                                );
                            }
                        }
                    });
                } else {
                    // ── Inserting a ROOT comment ────────────────────────────────
                    patches.push(
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId: arg.postId }, (draft) => {
                                if (draft?.data?.comments) {
                                    draft.data.comments.unshift(pendingComment);
                                    if (draft.data.pagination) draft.data.pagination.total += 1;
                                }
                            })
                        )
                    );
                }

                // ── Post comment count optimistic update (all caches) ──────────
                // Patch getPostById (detail page)
                patches.push(
                    dispatch(
                        postApi.util.updateQueryData('getPostById', arg.postId, (draft) => {
                            const post = draft?.data?.post ?? draft?.data?.data ?? draft?.data;
                            if (post?.stats) post.stats.commentCount = (post.stats.commentCount || 0) + 1;
                        })
                    )
                );

                // Patch getFeedPosts (home feed — infinite query)
                patches.push(
                    dispatch(
                        postApi.util.updateQueryData('getFeedPosts', undefined, (draft) => {
                            for (const page of (draft?.pages ?? [])) {
                                const post = page.data?.data?.find((p) => p._id === arg.postId);
                                if (post) { if (post.stats) post.stats.commentCount = (post.stats.commentCount || 0) + 1; break; }
                            }
                        })
                    )
                );

                // Patch every loaded getUserPosts cache (profile feeds)
                const stateForFeed = getState();
                const feedQueries = stateForFeed[baseApi.reducerPath]?.queries ?? {};
                Object.values(feedQueries).forEach((entry) => {
                    if (entry?.endpointName === 'getUserPosts' && entry?.status === 'fulfilled') {
                        patches.push(
                            dispatch(
                                postApi.util.updateQueryData('getUserPosts', entry.originalArgs, (draft) => {
                                    for (const page of (draft?.pages ?? [])) {
                                        const post = page.data?.data?.find((p) => p._id === arg.postId);
                                        if (post) { if (post.stats) post.stats.commentCount = (post.stats.commentCount || 0) + 1; break; }
                                    }
                                })
                            )
                        );
                    }
                });

                try {
                    const { data: result } = await queryFulfilled;
                    const newComment = result.data;

                    // Replace the pending stub with the real comment from the server
                    if (arg.parentId) {
                        dispatch(
                            commentApi.util.updateQueryData('getReplies', { commentId: arg.parentId }, (draft) => {
                                if (!draft?.data?.replies) return;
                                const idx = draft.data.replies.findIndex(c => c._id === tempId);
                                if (idx !== -1) draft.data.replies[idx] = newComment;
                            })
                        );
                    } else {
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId: arg.postId }, (draft) => {
                                if (!draft?.data?.comments) return;
                                const idx = draft.data.comments.findIndex(c => c._id === tempId);
                                if (idx !== -1) draft.data.comments[idx] = newComment;
                            })
                        );
                    }
                } catch {
                    // Rollback all optimistic patches
                    patches.forEach(p => p.undo());
                }
            }
        }),

        // ─── GET COMMENT BY ID ───────────────────────────────────────────────────
        getCommentById: builder.query({
            query: (id) => ({
                url: `/comments/${id}`,
                method: 'GET'
            }),
            providesTags: (result, error, id) => [
                { type: 'Comment', id }
            ]
        }),

        // ─── UPDATE COMMENT ───────────────────────────────────────────────────────
        // Optimistic: immediately shows the edited text in a pending state.
        updateComment: builder.mutation({
            query: ({ id, data }) => ({
                url: `/comments/${id}`,
                method: 'PUT',
                body: data,
            }),
            async onQueryStarted({ id, data }, { dispatch, queryFulfilled, getState }) {
                const state = getState();
                const allQueries = state[baseApi.reducerPath]?.queries ?? {};
                const patches = [];

                // Helper: apply pending edit to a comment in place
                const applyPending = (comment) => {
                    if (comment._id !== id) return;
                    comment.content = { text: data.newContent };
                    comment.isPending = true;
                };

                // Scan getPostComments caches
                Object.values(allQueries).forEach((entry) => {
                    if (entry?.endpointName === 'getPostComments' && entry?.data?.data?.comments) {
                        const postId = entry.originalArgs?.postId;
                        patches.push(
                            dispatch(
                                commentApi.util.updateQueryData('getPostComments', { postId }, (draft) => {
                                    draft?.data?.comments?.forEach(applyPending);
                                })
                            )
                        );
                    }
                    if (entry?.endpointName === 'getReplies' && entry?.data?.data?.replies) {
                        const commentId = entry.originalArgs?.commentId;
                        patches.push(
                            dispatch(
                                commentApi.util.updateQueryData('getReplies', { commentId }, (draft) => {
                                    draft?.data?.replies?.forEach(applyPending);
                                })
                            )
                        );
                    }
                });

                try {
                    const { data: result } = await queryFulfilled;
                    const updatedComment = result.data;
                    const { postId, parentId } = updatedComment;

                    // Settle: clear pending flag, set isEdited
                    const settle = (comment) => {
                        if (comment._id !== id) return;
                        comment.content = updatedComment.content;
                        comment.isEdited = true;
                        delete comment.isPending;
                    };

                    if (parentId) {
                        dispatch(
                            commentApi.util.updateQueryData('getReplies', { commentId: parentId }, (draft) => {
                                draft?.data?.replies?.forEach(settle);
                            })
                        );
                    } else if (postId) {
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId }, (draft) => {
                                draft?.data?.comments?.forEach(settle);
                            })
                        );
                    }
                } catch {
                    patches.forEach(p => p.undo());
                }
            }
        }),

        // ─── DELETE COMMENT ───────────────────────────────────────────────────────
        // Arg shape: { id, postId, parentId, replyCount }
        // Optimistic: immediately tombstones or removes from cache.
        //
        // Key invariant: if the comment has replies (replyCount > 0) it must remain
        // as a tombstone — we do NOT decrement the grandparent's replyCount in cache,
        // because the tombstone still occupies the reply slot (and the backend filter
        // `$or: [deletedAt: null, replyCount > 0]` keeps it visible on refresh).
        //
        // If the comment has NO replies, we remove it fully and decrement the parent's
        // replyCount in cache.
        deleteComment: builder.mutation({
            query: ({ id }) => ({
                url: `/comments/${id}`,
                method: 'DELETE'
            }),
            async onQueryStarted({ id, postId, parentId, replyCount = 0 }, { dispatch, queryFulfilled }) {
                const hasPendingReplies = replyCount > 0;
                const patches = [];

                const tombstone = (comment) => {
                    comment.deletedAt = new Date().toISOString();
                    comment.content = { text: '[deleted]' };
                    delete comment.isPending;
                };

                if (parentId) {
                    // ── Deleting a REPLY (depth 1 or 2) ────────────────────────
                    patches.push(
                        dispatch(
                            commentApi.util.updateQueryData('getReplies', { commentId: parentId }, (draft) => {
                                if (!draft?.data?.replies) return;
                                if (hasPendingReplies) {
                                    // Tombstone — keep the slot, don't touch parent replyCount
                                    const c = draft.data.replies.find(r => r._id === id);
                                    if (c) tombstone(c);
                                } else {
                                    // Fully remove + adjust list count
                                    draft.data.replies = draft.data.replies.filter(r => r._id !== id);
                                    if (draft.data.pagination) draft.data.pagination.total = Math.max((draft.data.pagination.total || 0) - 1, 0);
                                }
                            })
                        )
                    );

                    // Only decrement the grandparent's replyCount if we're fully removing
                    // (not tombstoning). If tombstoning, the grandparent must still see > 0
                    // replies so it stays visible after a refresh.
                    if (!hasPendingReplies) {
                        // Decrement replyCount in getPostComments (handles depth-1 parent = root)
                        patches.push(
                            dispatch(
                                commentApi.util.updateQueryData('getPostComments', { postId }, (draft) => {
                                    if (!draft?.data?.comments) return;
                                    const grandparent = draft.data.comments.find(c => c._id === parentId);
                                    if (grandparent?.stats) {
                                        grandparent.stats.replyCount = Math.max((grandparent.stats.replyCount || 0) - 1, 0);
                                    }
                                })
                            )
                        );

                        // Also handle depth-2 case: the parent is in a getReplies cache
                        // We don't have the grandparent's ID here, but we can scan caches
                        // The grandparent's replyCount decrement was already handled via
                        // the getPostComments patch above (for depth 1). For depth-2,
                        // the immediate parent (depth-1) lives in a getReplies cache
                        // but we only know parentId, not grandparentId. The backend
                        // correctly handles this so we don't over-patch here.
                    }
                } else {
                    // ── Deleting a ROOT comment ─────────────────────────────────
                    patches.push(
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId }, (draft) => {
                                if (!draft?.data?.comments) return;
                                if (hasPendingReplies) {
                                    const c = draft.data.comments.find(r => r._id === id);
                                    if (c) tombstone(c);
                                } else {
                                    draft.data.comments = draft.data.comments.filter(c => c._id !== id);
                                    if (draft.data.pagination) draft.data.pagination.total = Math.max((draft.data.pagination.total || 0) - 1, 0);
                                }
                            })
                        )
                    );
                }

                // Decrement post-level comment count (all caches)
                // Patch getPostById (detail page)
                patches.push(
                    dispatch(
                        postApi.util.updateQueryData('getPostById', postId, (draft) => {
                            const post = draft?.data?.post ?? draft?.data?.data ?? draft?.data;
                            if (post?.stats) post.stats.commentCount = Math.max((post.stats.commentCount || 0) - 1, 0);
                        })
                    )
                );

                // Patch getFeedPosts (home feed — infinite query)
                patches.push(
                    dispatch(
                        postApi.util.updateQueryData('getFeedPosts', undefined, (draft) => {
                            for (const page of (draft?.pages ?? [])) {
                                const post = page.data?.data?.find((p) => p._id === postId);
                                if (post) { if (post.stats) post.stats.commentCount = Math.max((post.stats.commentCount || 0) - 1, 0); break; }
                            }
                        })
                    )
                );

                // Patch every loaded getUserPosts cache (profile feeds)
                const stateForFeedDel = getState();
                const feedQueriesDel = stateForFeedDel[baseApi.reducerPath]?.queries ?? {};
                Object.values(feedQueriesDel).forEach((entry) => {
                    if (entry?.endpointName === 'getUserPosts' && entry?.status === 'fulfilled') {
                        patches.push(
                            dispatch(
                                postApi.util.updateQueryData('getUserPosts', entry.originalArgs, (draft) => {
                                    for (const page of (draft?.pages ?? [])) {
                                        const post = page.data?.data?.find((p) => p._id === postId);
                                        if (post) { if (post.stats) post.stats.commentCount = Math.max((post.stats.commentCount || 0) - 1, 0); break; }
                                    }
                                })
                            )
                        );
                    }
                });

                try {
                    await queryFulfilled;
                    // Patches stay — server confirmed
                } catch {
                    patches.forEach(p => p.undo());
                }
            }
        }),

        // ─── GET POST COMMENTS ───────────────────────────────────────────────────
        getPostComments: builder.query({
            query: ({ postId, page = 1, limit = 20 }) => ({
                url: `/comments/post/${postId}`,
                method: 'GET',
                params: { page, limit }
            }),
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}-${queryArgs.postId}`;
            },
            merge: (currentCache, newItems, { arg }) => {
                if (arg.page === 1) {
                    return newItems;
                }
                if (currentCache?.data && newItems?.data) {
                    currentCache.data.comments.push(...newItems.data.comments);
                    currentCache.data.pagination = newItems.data.pagination;
                }
            },
            forceRefetch({ currentArg, previousArg }) {
                return currentArg?.page !== previousArg?.page;
            },
            providesTags: (result, error, { postId }) => 
                result?.data?.comments
                    ? [
                        { type: 'Comment', id: `POST_${postId}` },
                        ...result.data.comments.map(({ _id }) => ({ type: 'Comment', id: _id }))
                      ]
                    : [{ type: 'Comment', id: `POST_${postId}` }]
        }),

        // ─── GET REPLIES ─────────────────────────────────────────────────────────
        getReplies: builder.query({
            query: ({ commentId, page = 1, limit = 20 }) => ({
                url: `/comments/${commentId}/replies`,
                method: 'GET',
                params: { page, limit }
            }),
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}-${queryArgs.commentId}`;
            },
            merge: (currentCache, newItems, { arg }) => {
                if (arg.page === 1) {
                    return newItems;
                }
                if (currentCache?.data && newItems?.data) {
                    currentCache.data.replies.push(...newItems.data.replies);
                    currentCache.data.pagination = newItems.data.pagination;
                }
            },
            forceRefetch({ currentArg, previousArg }) {
                return currentArg?.page !== previousArg?.page;
            },
            providesTags: (result, error, { commentId }) => 
                result?.data?.replies
                    ? [
                        { type: 'Comment', id: `REPLIES_${commentId}` },
                        ...result.data.replies.map(({ _id }) => ({ type: 'Comment', id: _id }))
                      ]
                    : [{ type: 'Comment', id: `REPLIES_${commentId}` }]
        }),
    })
})

export const { 
    useCreateCommentMutation, useGetCommentByIdQuery, useUpdateCommentMutation, useDeleteCommentMutation, useGetPostCommentsQuery, 
    useGetRepliesQuery 
} = commentApi;