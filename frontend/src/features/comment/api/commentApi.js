import { baseApi } from "@/lib/api/baseApi";
import { postApi } from "@/features/post/api/postApi.js";

export const commentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createComment: builder.mutation({
            query: (data) => ({
                url: '/comments',
                method: 'POST',
                body: data,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;
                    const newComment = result.data;
                    
                    if (arg.postId) {
                        dispatch(
                            postApi.util.updateQueryData('getPostById', arg.postId, (draft) => {
                                const post = draft?.data?.post ?? draft?.data?.data ?? draft?.data;
                                if (post && post.stats) post.stats.commentCount = (post.stats.commentCount || 0) + 1;
                            })
                        );
                    }

                    if (arg.parentId) {
                        dispatch(
                            commentApi.util.updateQueryData('getReplies', { commentId: arg.parentId }, (draft) => {
                                if (draft?.data?.replies) {
                                    draft.data.replies.unshift(newComment);
                                    if (draft.data.pagination) draft.data.pagination.total += 1;
                                }
                            })
                        );
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId: arg.postId }, (draft) => {
                                if (draft?.data?.comments) {
                                    const parent = draft.data.comments.find(c => c._id === arg.parentId);
                                    if (parent && parent.stats) parent.stats.replyCount = (parent.stats.replyCount || 0) + 1;
                                }
                            })
                        );
                    } else {
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId: arg.postId }, (draft) => {
                                if (draft?.data?.comments) {
                                    draft.data.comments.unshift(newComment);
                                    if (draft.data.pagination) draft.data.pagination.total += 1;
                                }
                            })
                        );
                    }
                } catch {}
            }
        }),
        getCommentById: builder.query({
            query: (id) => ({
                url: `/comments/${id}`,
                method: 'GET'
            }),
            providesTags: (result, error, id) => [
                { type: 'Comment', id }
            ]
        }),
        updateComment: builder.mutation({
            query: ({ id, data }) => ({
                url: `/comments/${id}`,
                method: 'PUT',
                body: data,
            }),
            async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;
                    const updatedComment = result.data;
                    const { postId, parentId } = updatedComment;

                    if (parentId) {
                        dispatch(
                            commentApi.util.updateQueryData('getReplies', { commentId: parentId }, (draft) => {
                                if (draft?.data?.replies) {
                                    const index = draft.data.replies.findIndex(c => c._id === id);
                                    if (index !== -1) {
                                        draft.data.replies[index] = { 
                                            ...draft.data.replies[index], 
                                            content: updatedComment.content,
                                            isEdited: true
                                        };
                                    }
                                }
                            })
                        );
                    } else if (postId) {
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId }, (draft) => {
                                if (draft?.data?.comments) {
                                    const index = draft.data.comments.findIndex(c => c._id === id);
                                    if (index !== -1) {
                                        draft.data.comments[index] = { 
                                            ...draft.data.comments[index], 
                                            content: updatedComment.content,
                                            isEdited: true
                                        };
                                    }
                                }
                            })
                        );
                    }
                } catch {}
            }
        }),
        deleteComment: builder.mutation({
            query: (id) => ({
                url: `/comments/${id}`,
                method: 'DELETE'
            }),
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;
                    const { postId, parentId } = result.data;
                    
                    if (postId) {
                        dispatch(
                            postApi.util.updateQueryData('getPostById', postId, (draft) => {
                                const post = draft?.data?.post ?? draft?.data?.data ?? draft?.data;
                                if (post && post.stats) post.stats.commentCount = Math.max((post.stats.commentCount || 0) - 1, 0);
                            })
                        );
                    }

                    if (parentId) {
                        dispatch(
                            commentApi.util.updateQueryData('getReplies', { commentId: parentId }, (draft) => {
                                if (draft?.data?.replies) {
                                    const comment = draft.data.replies.find(c => c._id === id);
                                    if (comment) {
                                        if (comment.stats?.replyCount > 0) {
                                            comment.deletedAt = new Date().toISOString();
                                            comment.content = { text: '[deleted]' };
                                        } else {
                                            draft.data.replies = draft.data.replies.filter(c => c._id !== id);
                                        }
                                    }
                                }
                            })
                        );
                    } else if (postId) {
                        dispatch(
                            commentApi.util.updateQueryData('getPostComments', { postId }, (draft) => {
                                if (draft?.data?.comments) {
                                    const comment = draft.data.comments.find(c => c._id === id);
                                    if (comment) {
                                        if (comment.stats?.replyCount > 0) {
                                            comment.deletedAt = new Date().toISOString();
                                            comment.content = { text: '[deleted]' };
                                        } else {
                                            draft.data.comments = draft.data.comments.filter(c => c._id !== id);
                                        }
                                    }
                                }
                            })
                        );
                    }
                } catch {}
            }
        }),
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