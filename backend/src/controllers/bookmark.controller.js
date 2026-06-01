import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import Post from "../models/post.model.js";
import Bookmark from "../models/Bookmark.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createBookmark = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { postId } = req.params; 

    if(!postId || !mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post id.");
    }

    const post = await Post.findById(postId);
    if(!post) throw new ApiError(404, "Post not found.");

    const existedBookmark = await Bookmark.findOne({
        owner: userId,
        post: postId
    });

    if(existedBookmark) {
        throw new ApiError(400, "Already bookmarked.");
    }

    const bookmark = await Bookmark.create({
        owner: userId,
        post: postId
    });

    if(!bookmark) {
        throw new ApiError(500, 'Something went wrong while creating bookmark.');
    }

    return res
        .status(201)
        .json(new ApiResponse(201, 'Bookmark created successfully.', bookmark));
});
export const deleteBookmark = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;

    if(!postId || !mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, 'Invalid post id.');
    }
    
    const bookmark = await Bookmark.findOne({ post: postId, owner: userId });
    if(!bookmark) throw new ApiError(404, "Bookmark doesn't exist");

    await bookmark.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, 'Bookmark deleted successfully.'));
});
export const getUserBookmarks = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 10, 50));
    const { cursorId, cursorCreatedAt } = req.query;

    if (cursorId && !mongoose.Types.ObjectId.isValid(cursorId)) {
        throw new ApiError(400, "Invalid cursorId");
    }
    if (cursorCreatedAt && isNaN(new Date(cursorCreatedAt).getTime())) {
        throw new ApiError(400, "Invalid cursorCreatedAt date format.");
    }

    let matchQuery = { owner: new mongoose.Types.ObjectId(userId) };

    if (cursorId && cursorCreatedAt) {
        matchQuery.$or = [
            { createdAt: { $lt: new Date(cursorCreatedAt) } },
            {
                createdAt: new Date(cursorCreatedAt),
                _id: { $lt: new mongoose.Types.ObjectId(cursorId) }
            }
        ];
    }

    const bookmarks = await Bookmark.aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'posts',
                foreignField: '_id',
                localField: 'post',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            foreignField: '_id',
                            localField: 'author',
                            pipeline: [
                                {
                                    $project: {
                                        name: 1,
                                        username: 1,
                                        avatarUrl: 1,
                                    }
                                }
                            ],
                            as: 'author'
                        }
                    },
                    {
                        $addFields: {
                            author: { $first: '$author' }
                        }
                    },
                    {
                        $lookup: {
                            from: 'likes',
                            let: { postId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$likableId", "$$postId"] },
                                                { $eq: ["$user", new mongoose.Types.ObjectId(userId)] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1
                                    }
                                }
                            ],
                            as: 'userLikeStatus'
                        }
                    },
                    {
                        $addFields: {
                            isLiked: { $gt: [{ $size: "$userLikeStatus" }, 0] },
                            isBookmarked: true
                        }
                    },
                    {
                        $project: {
                            userLikeStatus: 0
                        }
                    }
                ],
                as: 'post'
            }
        },
        {
            $unwind: "$post"
        }
    ]);

    const hasMore = bookmarks.length === limit;
    const lastBookmark = bookmarks[bookmarks.length - 1];
    const nextCursor = hasMore ? {
        cursorCreatedAt: lastBookmark.createdAt.toISOString(),
        cursorId: lastBookmark._id.toString()
    } : null;

    const response = {
        data: bookmarks.map(b => b.post), // Unpack the posts directly so it fits the standard feed UI
        nextCursor
    };

    return res
    .status(200)
    .json(new ApiResponse(200, 'User bookmarks fetched successfully.', response));
});