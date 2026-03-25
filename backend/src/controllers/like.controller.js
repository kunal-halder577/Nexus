import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Like from "../models/like.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";

const likableTypes = ['Post', 'Comment'];
const collectionMap = { Post: 'posts', Comment: 'comments' }

export const toggleLike = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { likableId, likableType } = req.params;

    if (!mongoose.isValidObjectId(likableId)) {
        throw new ApiError(400, 'Invalid Likable Id.');
    }
    if (!likableTypes.includes(likableType)) {
        throw new ApiError(400, 'Invalid Likable Type.');
    }

    let targetModel;
    try {
        targetModel = mongoose.model(likableType);
    } catch {
        throw new ApiError(400, 'Invalid Likable Type Model.');
    }

    const [existingLike, target] = await Promise.all([
        Like.findOne({ likableId, likableType, user: userId }).select('_id').lean(),
        targetModel.findById(likableId).select('_id').lean(),
    ]);

    if (!target) {
        throw new ApiError(404, `${likableType} not found.`);
    }

    // --- Unlike ---
    if (existingLike) {
        const { deletedCount } = await Like.deleteOne({ _id: existingLike._id });

        if (deletedCount === 0) {
            throw new ApiError(500, 'Something went wrong while deleting like.');
        }

        try {
            await targetModel.findByIdAndUpdate(likableId,
                { $inc: { 'stats.likeCount': -1 } }
            );
        } catch (error) {
            console.error(`[toggleLike] Failed to decrement likeCount for ${likableType} ${likableId}:`, error);
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Like removed successfully.", {}));
    }

    // --- Like ---
    let newLike;
    try {
        newLike = await Like.create({ likableId, likableType, user: userId });
    } catch (error) {
        if (error.code === 11000) {
            return res
                .status(409)
                .json(new ApiResponse(409, "You have already liked this item.", {}));
        }
        throw new ApiError(500, 'Something went wrong while liking.');
    }

    try {
        await targetModel.findByIdAndUpdate(likableId,
            { $inc: { 'stats.likeCount': 1 } }
        );
    } catch (error) {
        console.error(`[toggleLike] Failed to increment likeCount for ${likableType} ${likableId}:`, error);
    }

    return res
        .status(201)
        .json(new ApiResponse(201, "Liked successfully.", newLike));
});
export const getLikers = asyncHandler(async (req, res) => {
    const { likableId, likableType } = req.params;
    const currentUserId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    if (!mongoose.isValidObjectId(likableId)) {
        throw new ApiError(400, 'Invalid Likable Id.');
    }
    if (!likableTypes.includes(likableType)) {
        throw new ApiError(400, 'Invalid Likable Type.');
    }

    let targetModel;
    try {
        targetModel = mongoose.model(likableType);
    } catch {
        throw new ApiError(400, 'Invalid Likable Type Model.');
    }

    const target = await targetModel.findById(likableId).select('_id').lean();
    
    if (!target) {
        throw new ApiError(404, `${likableType} not found.`);
    }

    const [likes, total] = await Promise.all([
        Like.aggregate([
            { 
                $match: { 
                    likableId: new mongoose.Types.ObjectId(likableId),
                    likableType 
                } 
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
                $lookup: {
                    from:'users',
                    foreignField: '_id',
                    localField: 'user',
                    pipeline: [
                        {
                            $lookup: {
                                from: 'follows',
                                let: { targetUserId: '$_id'},
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { 
                                                        $eq: [
                                                            "$followingId", 
                                                            "$$targetUserId"
                                                        ]   
                                                    },
                                                    {
                                                        $eq: [
                                                            "$followerId",
                                                            new mongoose.Types.ObjectId(currentUserId)
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    { $limit: 1}
                                ],
                                as: 'currentUserFollowingStatus'
                            }
                        },
                        {
                            $addFields: {
                                isFollowing: {
                                    $cond: [
                                        { $eq: ['$_id', new mongoose.Types.ObjectId(currentUserId)] },
                                        '$$REMOVE',
                                        { $gt: [{ $size: '$currentUserFollowingStatus' }, 0] },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                name: 1,
                                username: 1,
                                avatarUrl: 1,
                                isFollowing: 1,
                            }
                        }
                    ],
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    user: 1
                }
            }
        ]),
        Like.countDocuments({ likableId, likableType }),
    ]);

    const likers = likes.map(like => like.user).filter(Boolean);

    return res
    .status(200)
    .json(new ApiResponse(200, 'Fetched likers successfully.', {
            likers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
            }
        })
    );
});
const getLikedContentAggregate = async (userId, type, page, limit) => {
    const result = await Like.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                likableType: type
            }
        },
        {
            $sort: { createdAt: -1 }  // moved up, uses index before any joins
        },
        {
            $lookup: {
                from: collectionMap[type],
                foreignField: '_id',
                localField: 'likableId',
                as: 'likableId'
            }
        },
        {
            $match: {
                "likableId.0": { $exists: true }
            }
        },
        {
            $facet: {
                data: [
                    { $addFields: { likableId: { $first: '$likableId' } } },
                    { $skip: (page - 1) * limit },
                    { $limit: limit }
                ],
                total: [{ $count: 'count' }]
            }
        }
    ]);

    const { data: likes, total } = result[0];
    const totalLikes = total[0]?.count || 0;
    return { likes, totalLikes };
};
export const getCurrentUserLikedContent = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { type } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    if (!likableTypes.includes(type)) {
        throw new ApiError(400, '[getCurrentUserLikedContent] Invalid content type.');
    }

    const [{ likes, totalLikes }, user] = await Promise.all([
        getLikedContentAggregate(userId, type, page, limit),
        User.findById(userId).select('_id name username avatarUrl').lean()
    ]);

    return res.status(200).json(
        new ApiResponse(200, "Fetched successfully", {
            likes,
            user,
            pagination: {
                total: totalLikes,
                page,
                limit,
                pages: Math.ceil(totalLikes / limit)
            }
        })
    );
});
export const getUserLikedContent = asyncHandler(async (req, res) => {
    const { type, userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    if (!likableTypes.includes(type)) {
        throw new ApiError(400, '[getUserLikedContent] Invalid content type.');
    }
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, '[getUserLikedContent] Invalid user id.');
    }

    const user = await User.findById(userId).select('_id name username avatarUrl').lean();
    if (!user) {
        throw new ApiError(404, '[getUserLikedContent] User not found.');
    }

    const { likes, totalLikes } = await getLikedContentAggregate(userId, type, page, limit);

    return res.status(200).json(
        new ApiResponse(200, "Fetched successfully", {
            likes,
            user,
            pagination: {
                total: totalLikes,
                page,
                limit,
                pages: Math.ceil(totalLikes / limit)
            }
        })
    );
});