import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import IdempotentRecord from "../models/IdempodentRecord.model.js";
import Comment from "../models/Comment.model.js";
import Post from "../models/post.model.js";
import Like from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createComment = asyncHandler(async (req, res) => {
    const { content, postId, parentId, idempotentKey } = req.body;
    const userId = req.user._id;

    if(!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required.");
    }
    if(!postId || !mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID.");
    }
    if(parentId && !mongoose.isValidObjectId(parentId)) {
        throw new ApiError(400, "Invalid parent comment ID.");
    }
    if (!idempotentKey) {
        throw new ApiError(400, "Idempotency key is required");
    }

    let result = await IdempotentRecord.findOneAndUpdate(
        { key: idempotentKey, user_id: req.user._id },
        { $setOnInsert: { status: "PROCESSING"} },
        { upsert: true, new: true, includeResultMetadata: true }
    );
    
    const idempotentRecord = result.value;
    const wasCreated = !result.lastErrorObject.updatedExisting;

    if (!idempotentRecord) {
        throw new ApiError(500, "Failed to initialize idempotency record");
    }

    if (idempotentRecord.status === "SUCCESS") {
        return res
            .status(200)
            .json(new ApiResponse(
                200, "Comment created successfully.", idempotentRecord.response_body
            ));
    }

    if (!wasCreated && idempotentRecord.status === "PROCESSING") {
        throw new ApiError(409, "Request in progress.");
    }

    if (idempotentRecord.status === "FAILED_PERMANENT") {
        throw new ApiError(400, "This request previously failed permanently. Please start a new request.");
    }

    if (idempotentRecord.status === "FAILED_RETRYABLE") {
        const updateResult = await IdempotentRecord.updateOne(
            { _id: idempotentRecord._id, status: "FAILED_RETRYABLE" },
            { $set: { status: "PROCESSING" } }
        );

        if(updateResult.modifiedCount === 0) {
            throw new ApiError(409, "Request in progress.");
        }
    }

    const post = await Post.findById(postId);
    if(!post) throw new ApiError(404, 'Post not found.');

    let parentComment = null;

    if(parentId) {
        parentComment = await Comment.findById(parentId);
        if(!parentComment) throw new ApiError(404, 'Parent comment not found');

        if(!parentComment.postId.equals(postId)) {
            throw new ApiError(400, 'Parent comment postId and current comment postId is different.');
        }
    }

    let createdComment = null;

    try {
        createdComment = await Comment.create({
            content: { text: content.trim() },
            postId,
            author: req.user._id,
            parentId,
        });
        
        await createdComment.populate('author', 'username avatarUrl name');

        post.stats.commentCount += 1;
        await post.save();
        
        if(parentComment) {
            parentComment.stats.replyCount += 1;
            await parentComment.save();
        } 

        await IdempotentRecord.updateOne(
            { _id: idempotentRecord._id },
            {
                $set: {
                status: "SUCCESS",
                response_body: createdComment.toObject()
                }
            }
        );
    
        return res
        .status(201)
        .json(new ApiResponse(201, 'Comment created successfully.', createdComment));
    } catch (error) {
        await IdempotentRecord.updateOne(
            { _id: idempotentRecord._id },
            { $set: { status: "FAILED_RETRYABLE" } }
        );
        throw new ApiError(500, error.message||"Something went wrong while creating comment.");
    }
});
export const getCommentById = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if(!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID.");
    }
    const comment = await Comment.findById(commentId)
    .populate('author', 'username name avatarUrl');

    if(!comment || comment.deletedAt) throw new ApiError(404, 'Comment not found.');

    const result = {
        ...comment.toObject(),
        isEdited: comment.updatedAt.getTime() !== comment.createdAt.getTime()
    };

    return res
    .status(200)
    .json(new ApiResponse(200, 'Comment fetched successfully.', result));
});
export const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { newContent } = req.body;
    const userId = req.user._id;
    
    if(!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is required.");
    }
    if(!newContent || !newContent.trim()) {
        throw new ApiError(400, "content is required to update.");
    }

    const comment = await Comment.findById(commentId)
    .select('author content deletedAt postId parentId');

    if(!comment || comment.deletedAt) throw new ApiError(404, 'Comment not found.');
    if(!comment.author.equals(userId)) throw new ApiError(403, 'Unauthorized request.');

    comment.content.text = newContent.trim();
    await comment.save();
    
    return res
    .status(200)
    .json(new ApiResponse(200, 'Comment updated successfully.', comment));
});
export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    if(!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is required.");
    }
    
    const comment = await Comment.findById(commentId).select('author deletedAt content postId parentId');
    if(!comment || comment.deletedAt) throw new ApiError(404, 'Comment not found.');
    if(!comment.author.equals(userId)) throw new ApiError(403, 'Unauthorized request.');

    comment.deletedAt = new Date();
    comment.content.text = '[deleted]';
    await comment.save();

    await Post.updateOne({ _id: comment.postId }, { $inc: { 'stats.commentCount': -1 } });

    if (comment.parentId) {
        await Comment.updateOne({ _id: comment.parentId }, { $inc: { 'stats.replyCount': -1 } });
    }

    return res
    .status(200)
    .json(new ApiResponse(200, 'Comment deleted successfully.', {
        postId: comment.postId,
        parentId: comment.parentId
    }));
});
export const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if(!postId || !mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID.");
    }

    const post = await Post.findById(postId);
    if(!post) throw new ApiError(404, "Post not found");

    const filter = { 
        postId, 
        parentId: null,
        $or: [
            { deletedAt: null },
            { 'stats.replyCount': { $gt: 0 } }
        ]
    };

    const [comments, total] = await Promise.all([
        Comment.find(filter)
            .populate('author', 'username avatarUrl name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Comment.countDocuments(filter)
    ]);

    const commentIds = comments.map(c => c._id);
    const userLikes = await Like.find({
        user: req.user._id,
        likableId: { $in: commentIds },
        likableType: 'Comment'
    }).select('likableId');

    const likedCommentIds = new Set(userLikes.map(l => l.likableId.toString()));

    const commentsWithLikes = comments.map(c => {
        const obj = c.toObject();
        obj.isLiked = likedCommentIds.has(obj._id.toString());
        obj.isEdited = c.updatedAt.getTime() !== c.createdAt.getTime();
        return obj;
    });

    return res
    .status(200)
    .json(new ApiResponse(200, "Comments fetched successfully.", {
        comments: commentsWithLikes,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
        }
    }));
});
export const getReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if(!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID.");
    }

    const comment = await Comment.findById(commentId);
    if(!comment) throw new ApiError(404, "Comment not found");

    const filter = { 
        parentId: commentId,
        $or: [
            { deletedAt: null },
            { 'stats.replyCount': { $gt: 0 } }
        ]
    };

    const [replies, total] = await Promise.all([
        Comment.find(filter)
            .populate('author', 'username avatarUrl name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Comment.countDocuments(filter)
    ]);

    const replyIds = replies.map(r => r._id);
    const userLikes = await Like.find({
        user: req.user._id,
        likableId: { $in: replyIds },
        likableType: 'Comment'
    }).select('likableId');

    const likedReplyIds = new Set(userLikes.map(l => l.likableId.toString()));

    const repliesWithLikes = replies.map(r => {
        const obj = r.toObject();
        obj.isLiked = likedReplyIds.has(obj._id.toString());
        obj.isEdited = r.updatedAt.getTime() !== r.createdAt.getTime();
        return obj;
    });

    return res
    .status(200)
    .json(new ApiResponse(200, "Replies fetched successfully.", {
        replies: repliesWithLikes,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
        }
    }));
});