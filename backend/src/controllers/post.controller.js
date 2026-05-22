import mongoose from "mongoose";
import IdempotentRecord from "../models/IdempodentRecord.model.js";
import Post from "../models/post.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js"
import { deleteMultipleMedia, uploadMultipleMedia } from "../utils/cloudinary.js";
import User from "../models/user.model.js";
import redis from "../cache/redisConfig.js";

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
  const userId = req.user._id;

  if (!id) {
    throw new ApiError(400, "Post id is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid post id.");
  }

  const post = await Post.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: 'likes',
        let: { targetPostId: "$_id"},
        pipeline: [
          {
            $match: { 
              $expr: {
                $and: [
                  { $eq: ["$likableId", "$$targetPostId"] },
                  { $eq: ["$user", new mongoose.Types.ObjectId(userId)] }
                ]
              }
            }
          }
        ],
        as: "userLikeStatus"   
      }
    },
    {
      $addFields: {
        isLiked: { $gt: [{ $size: "$userLikeStatus"}, 0] }
      }
    },
    {
      $project: {
        userLikeStatus: 0
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              name: 1, 
              avatarUrl: 1, 
              username: 1
            }
          }
        ],
        as: 'author'
      }
    },
    { 
      $addFields: {
        author: { 
          $first: '$author' 
        } 
      } 
    }
  ]);

  if(!post?.length) throw new ApiError(404, "Post not found.");

  const currentPost = post[0];
  try {
    const count = await redis.pfcount(`uniques:${currentPost._id.toString()}`);
    const uniqueView = count != null ? Number(count) : 0;
    currentPost.stats.viewCount = (currentPost.stats.viewCount || 0) + uniqueView;
  } catch (error) {
    console.error(`Can't get views from redis for post: ${currentPost._id}`, error);
  }

  return res
  .status(200)
  .json(new ApiResponse(200, "Post fetched successfully.", currentPost));
});
export const getPosts = asyncHandler(async (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 10, 50));
  const { cursorId, cursorCreatedAt } = req.query;
  
  const currentUserId = req.user._id ? new mongoose.Types.ObjectId(req.user._id) : null;

  if (cursorId && !mongoose.Types.ObjectId.isValid(cursorId)) {
    throw new ApiError(400, "Invalid cursorId");
  }
  if (cursorCreatedAt && isNaN(new Date(cursorCreatedAt).getTime())) {
    throw new ApiError(400, "Invalid cursorCreatedAt date format.");
  }

  let query = {};

  if (cursorId && cursorCreatedAt) {
    const cursorDate = new Date(cursorCreatedAt);
    const cursorObjectId = new mongoose.Types.ObjectId(cursorId);

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

  // Build the pipeline array dynamically
  const pipeline = [
    { $match: query },
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: limit },
    
    // 1. Join Author details (Replacing .populate)
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              name: 1, 
              avatarUrl: 1, 
              username: 1
            }
          }
        ],
        as: 'author'
      }
    },
    { $addFields: { author: { $first: '$author' } } },
  ];

  if (currentUserId) {
    pipeline.push(
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$likableId', '$$postId'] },
                    { $eq: ['$user', currentUserId] }
                  ]
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'userLike'
        }
      },
      {
        $addFields: {
          isLiked: { $gt: [{ $size: '$userLike' }, 0] }
        }
      },
      { $project: { userLike: 0 } }
    );
  } else {
    pipeline.push({
      $addFields: { isLiked: false }
    });
  }

  const posts = await Post.aggregate(pipeline);

  const hasMore = posts.length === limit;
  const lastPost = posts[posts.length - 1];
  const nextCursor = hasMore ? {
    cursorCreatedAt: lastPost.createdAt.toISOString(),
    cursorId: lastPost._id.toString()
  } : null;

  const redisPipeline = redis.pipeline();

  posts.forEach(post => {
    redisPipeline.pfcount(`uniques:${post._id.toString()}`)
  });

  let redisPipelineResult = null;
  try {
    redisPipelineResult = await redisPipeline.exec();
  } catch (error) {
    console.error("Redis pipeline execution failed:", error);
  }

  if (!redisPipelineResult) {
    console.error("Redis pipeline returned null — Redis may be down. Skipping view counts.");
  } else {
    posts.forEach((post, index) => {
      const [error, count] = redisPipelineResult[index];

      if (error) {
        console.error(`Can't get views from redis for post: ${post._id}`, error);
        return;
      }

      const uniqueView = count != null ? Number(count) : 0;
      post.stats.viewCount = (post.stats.viewCount || 0) + uniqueView;
    });
  }

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
  const currentUserId = req.user._id;

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

  let matchQuery = { author: new mongoose.Types.ObjectId(userId) };

  if (cursorId && cursorCreatedAt) {
    matchQuery.$or = [
      { createdAt: { $lt: new Date(cursorCreatedAt) } },
      { 
        createdAt: new Date(cursorCreatedAt), 
        _id: { $lt: new mongoose.Types.ObjectId(cursorId) } 
      }
    ];
  }

  const posts = await Post.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: limit },
    
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name: 1, 
              avatarUrl: 1, 
              username: 1
            }
          }
        ],
        as: "author"
      }
    },
    { $addFields: { author: { $first: "$author" } } },
    {
      $lookup: {
        from: "likes",
        let: { postId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$likableId", "$$postId"] },
                  { $eq: ["$user", new mongoose.Types.ObjectId(currentUserId)] }
                ]
              }
            }
          }
        ],
        as: "userLike"
      }
    },

    {
      $addFields: {
        isLiked: { $gt: [{ $size: "$userLike" }, 0] },
      }
    },
    { 
      $project: { 
        userLike: 0 
      } 
    }
  ]);

  const hasMore = posts.length === limit;
  const lastPost = posts[posts.length - 1];
  
  const nextCursor = hasMore? {
    cursorCreatedAt: lastPost.createdAt.toISOString(),
    cursorId: lastPost._id.toString()
  } : null;

  const redisPipeline = redis.pipeline();

  posts.forEach(post => {
    redisPipeline.pfcount(`uniques:${post._id.toString()}`)
  });

  let redisPipelineResult = null;
  try {
    redisPipelineResult = await redisPipeline.exec();
  } catch (error) {
    console.error("Redis pipeline execution failed:", error);
  }

  if (!redisPipelineResult) {
    console.error("Redis pipeline returned null — Redis may be down. Skipping view counts.");
  } else {
    posts.forEach((post, index) => {
      const [error, count] = redisPipelineResult[index];

      if (error) {
        console.error(`Can't get views from redis for post: ${post._id}`, error);
        return;
      }

      const uniqueView = count != null ? Number(count) : 0;
      post.stats.viewCount = (post.stats.viewCount || 0) + uniqueView;
    });
  }

  const response = {
    data: posts,
    nextCursor,
  };

  if (!cursorId && !cursorCreatedAt) {
    response.totalPosts = await Post.countDocuments({ author: new mongoose.Types.ObjectId(userId) });
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
export const viewPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid post id.");
  }

  try {
    await redis.pfadd(`uniques:${id}`, userId.toString());
  } catch (err) {
    console.error(`Failed to log view in Redis for post ${id}:`, err.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'View updated successfully.', { success: true }));
});