import mongoose from "mongoose";
import IdempotentRecord from "../models/IdempodentRecord.model.js";
import Post from "../models/post.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js"
import { deleteMultipleMedia, uploadMultipleMedia } from "../utils/cloudinary.js";
import User from "../models/user.model.js";

export const createPost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { caption, idempotentKey } = req.body;
  const filePaths = req.files?.media?.map(img => img.path) || [];

  if (!caption && filePaths.length === 0) {
    throw new ApiError(400, "Caption or media is required");
  }
  if (!idempotentKey) {
    throw new ApiError(400, "Idempotency key is required");
  }

  let result = await IdempotentRecord.findOneAndUpdate(
    { key: idempotentKey, user_id: userId },
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
        200, "Post fetched successfully.", idempotentRecord.response_body
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
  
  let cloudResponse = [];

  try {
    if (filePaths.length > 0) {
      cloudResponse = await uploadMultipleMedia(filePaths);
    }
  
    const createdPost = await Post.create({
      author: userId,
      content: { caption: caption || null },
      media: cloudResponse.map(res => ({
        type: res.resourceType === 'video' ? 'Video' : 'Image',
        url: res.url,
        publicId: res.publicId,
        aspectRatio: res.aspectRatio,
        thumbnailUrl: res.thumbnailUrl
      }))
    });
  
    await IdempotentRecord.updateOne(
      { _id: idempotentRecord._id },
      {
        $set: {
          status: "SUCCESS",
          response_body: createdPost.toObject()
        }
      }
    );
  
    return res
      .status(201)
      .json(new ApiResponse(201, 'Post created successfully.', createdPost));
  } catch (error) {

    if (cloudResponse.length > 0) {
      await deleteMultipleMedia(cloudResponse).catch(err =>
        console.error('Failed to rollback cloud media:', err)
      );
    }

    await IdempotentRecord.updateOne(
      { _id: idempotentRecord._id },
      { $set: { status: "FAILED_RETRYABLE" } }
    );
   
    throw new ApiError(500, error.message||"Something went wrong while creating post.");
  }
});
export const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Post id is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid post id.");
  }

  const post  = await Post.findById(id);

  if(!post) throw new ApiError(404, "Post not found.");

  return res
  .status(200)
  .json(new ApiResponse(200, "Post fetched successfully.", post));
});
export const getPosts = asyncHandler(async (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 10, 50));
  const { cursorId, cursorCreatedAt }= req.query;

  if (cursorId && !mongoose.Types.ObjectId.isValid(cursorId)) {
    throw new ApiError(400, "Invalid cursorId");
  }
  if (cursorCreatedAt && isNaN(new Date(cursorCreatedAt).getTime())) {
    throw new ApiError(400, "Invalid cursorCreatedAt date format.");
  }

  let query = {};

  let cursorDate;
  let cursorObjectId;

  if (cursorId && cursorCreatedAt) {
    cursorDate = new Date(cursorCreatedAt);
    cursorObjectId = new mongoose.Types.ObjectId(cursorId);

    query = {
      $or: [
        { createdAt: { $lt: cursorDate } },
        {
          createdAt: cursorDate,
          _id: { $lt: cursorObjectId }
        }
      ]
    };
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const hasMore = posts.length === limit;
  const lastPost = posts[posts.length - 1];
  const nextCursor = hasMore? {
    cursorCreatedAt: lastPost.createdAt.toISOString(),
    cursorId: lastPost._id.toString()
  } : null;

  const response = {
    data: posts,
    nextCursor
  };

  return res
    .status(200)
    .json(new ApiResponse(200, "Posts fetched successfully.", response));

});
export const getUserPosts = asyncHandler(async (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 10, 50));
  const { cursorId, cursorCreatedAt } = req.query;
  const { userId } = req.params;

  if (!userId) throw new ApiError(400, "User id is required.");
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid userId");
  }
  
  if (cursorId && !mongoose.Types.ObjectId.isValid(cursorId)) {
    throw new ApiError(400, "Invalid cursorId");
  }
  
  if (cursorCreatedAt && isNaN(new Date(cursorCreatedAt).getTime())) {
    throw new ApiError(400, "Invalid cursorCreatedAt date format.");
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw new ApiError(404, "User not found.");

  let query = { author: userId };

  if (cursorId && cursorCreatedAt) {
    const cursorDate = new Date(cursorCreatedAt);
    const cursorObjectId = new mongoose.Types.ObjectId(cursorId);

    query.$or = [
      { createdAt: { $lt: cursorDate } },
      {
        createdAt: cursorDate,
        _id: { $lt: cursorObjectId }
      }
    ];
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const hasMore = posts.length === limit;
  const lastPost = posts[posts.length - 1];
  
  const nextCursor = hasMore? {
    cursorCreatedAt: lastPost.createdAt.toISOString(),
    cursorId: lastPost._id.toString()
  } : null;

  const response = {
    data: posts,
    nextCursor,
  };

  if (!cursorId && !cursorCreatedAt) {
    response.totalPosts = await Post.countDocuments({ author: userId });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Posts fetched successfully.", response));
});
export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { caption } = req.body;
  const userId = req.user._id;

  if(!id) throw new ApiError(400, "Post id is required.");
  
  if(!caption || !caption.trim()) {
    throw new ApiError(400, "Caption is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid post id.");
  }

  const post = await Post.findById(id).select("author caption");

  if(!post) throw new ApiError(404, "Post not found.");

  if(userId.toString() !== post.author.toString()) {
    throw new ApiError(403, "You're not allowed to update the post.");
  }

  post.content = { caption: caption.trim() };
  await post.save();

  const response = {
    _id: post._id,
    content: {
      caption: post.caption
    }
  };

  return res
  .status(200)
  .json(new ApiResponse(200, "Post updated Successfully", response));
});
export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!id) throw new ApiError(400, "Post id is required.");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid post id.");

  const post = await Post.findById(id);

  if (!post) throw new ApiError(404, "Post not found.");
  if (post.author.toString() !== userId.toString()) {
    throw new ApiError(403, "You're not allowed to delete this post.");
  }

  // ✅ 1. Delete from DB first — if this fails, cloud media is still intact
  await post.deleteOne();

  // ✅ 2. Clean up Cloudinary after — pass full objects so resourceType is respected
  if (post.media?.length > 0) {
    await deleteMultipleMedia(post.media).catch(err =>
      // Don't throw — post is already deleted, just log for manual cleanup
      console.error("Failed to delete post media from cloud:", err)
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Post deleted successfully.", {}));
});