import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import Follow from "../models/Follow.model.js";
import ApiResponse from "../utils/ApiResponse.js"
import User from "../models/user.model.js";

export const followUser = asyncHandler(async (req, res) => {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new ApiError(400, '[followUser] Invalid user id.');
    }

    if (targetUserId === currentUserId.toString()) {
        throw new ApiError(400, '[followUser] Users cannot follow themselves.');
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
        throw new ApiError(404, '[followUser] Target user not found.');
    }

    try {
        const result = await Follow.findOneAndUpdate(
            { followerId: currentUserId, followingId: targetUserId },
            { 
                $setOnInsert: { 
                    followerId: currentUserId, 
                    followingId: targetUserId 
                } 
            },
            { upsert: true, new: true, runValidators: true, rawResult: true }
        );

        if (result.lastErrorObject.updatedExisting) {
            throw new ApiError(409, '[followUser] Already following.');
        }

        await Promise.all([
            User.findByIdAndUpdate(targetUserId, { $inc: { "stats.followerCount": 1 } }),
            User.findByIdAndUpdate(currentUserId, { $inc: { "stats.followingCount": 1 } })
        ]);

        return res
            .status(201)
            .json(new ApiResponse(201, 'Successfully followed user.', result.value));

    } catch (err) {
        if (err.code === 11000) {
            throw new ApiError(409, '[followUser] Already following.');
        }
        throw err;
    }
});
export const unfollowUser = asyncHandler(async (req, res) => {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new ApiError(400, '[unfollowUser] Invalid user id.');
    }

    if (targetUserId === currentUserId.toString()) {
        throw new ApiError(400, '[unfollowUser] Users cannot unfollow themselves.');
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
        throw new ApiError(404, '[unfollowUser] Target user not found.');
    }

    const follow = await Follow.findOneAndDelete({ 
        followingId: targetUserId, 
        followerId: currentUserId
    });

     if (!follow) {
        throw new ApiError(404, '[unfollowUser] You are not following this user.');
    }

    await Promise.all([
        User.findByIdAndUpdate(targetUserId, { $inc: { "stats.followerCount": -1 } }),
        User.findByIdAndUpdate(currentUserId, { $inc: { "stats.followingCount": -1 } })
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, 'Unfollowed successfully.', {}));
});
export const getFollowers = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    if(!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user id.');
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
        throw new ApiError(404, '[getFollowers] Target user not found.');
    }

    const followers = await Follow.aggregate([
        {
            $match: { followingId: new mongoose.Types.ObjectId(userId) }
        },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'followerId',
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            username: 1,
                            avatarUrl: 1
                        }
                    }
                ],
                as: 'followerId'
            }
        },
        {
            $unwind: '$followerId' 
        },
        {
            $project: {
                followerId: 1
            }
        },
    ]);

    const response = {
        page,
        limit,
        followers,
        totalFollowerCount: targetUser.stats.followerCount
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, 'Followers fetched successfully.', response));
});
export const getFollowing = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    if(!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user id.');
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
        throw new ApiError(404, '[getFollowing] Target user not found.');
    }

    const following = await Follow.aggregate([
        {
            $match: { followerId: new mongoose.Types.ObjectId(userId) }
        },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'followingId',
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            username: 1,
                            avatarUrl: 1
                        }
                    }
                ],
                as: 'followingId'
            }
        },
        {
            $unwind: '$followingId' 
        },
        {
            $project: {
                followingId: 1
            }
        },
    ]);

    const response = {
        page,
        limit,
        following,
        totalFollowingCount: targetUser.stats.followingCount
    }

    return res
    .status(200)
    .json(new ApiResponse(200, 'Following fetched successfully.', response));
});
export const getFollowStatus = asyncHandler(async (req, res) => {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    if(!mongoose.isValidObjectId(targetUserId)) {
        throw new ApiError(400, 'Invalid user id.');
    }
    
    const follow = await Follow.findOne({
        followerId: currentUserId, 
        followingId: targetUserId 
    }).select('status').lean();

    const response = {};
    
    if(!follow) {
        response.isFollowing = false;
        response.status = null;
    } else {
        response.isFollowing = true;
        response.status = follow.status;
    }

    return res
    .status(200)
    .json(new ApiResponse(200, 'Follow status fetched successfully', response));

});