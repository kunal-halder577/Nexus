import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js'
import { uploadImageOnCloud } from '../utils/cloudinary.js'

export const onboarding = asyncHandler(async (req, res) => {
    const { name, avatar, avatarType } = req.body;
    const avatarLocalPath = req.files?.avatar?.[0].path;
    let avatarCloudUrl;
    let avatarPublicId;
    
    if (name && name.trim().length < 2) {
        throw new ApiError(400, "Name must be at least 2 characters.");
    }
    if (avatarType && !["file", "url"].includes(avatarType)) {
        throw new ApiError(400, "Invalid avatarType. Must be 'file' or 'url'.");
    }
    if(avatarType === 'file' && avatarLocalPath) {
        try {
            const response = await uploadImageOnCloud(avatarLocalPath, 'avatar');
            avatarCloudUrl = response.url;
            avatarPublicId = response.publicId;
        } catch (error) {
            throw new ApiError(500, error.message);
        }
    } else if(avatarType === 'url' && avatar) {
        avatarCloudUrl = avatar; // if dicebear url instead of Actual file
    }

    const userId = req.user._id;
    const updateFields = {};

    if(name) updateFields.name = name.trim();
    if(avatarCloudUrl) updateFields.avatarUrl = avatarCloudUrl;
    if(avatarPublicId) updateFields.avatarPublicId = avatarPublicId;

    updateFields.isOnboarded = true;
    
    const user = await User.findByIdAndUpdate(userId, 
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    if(!user) throw new ApiError(404, 'User not found.');

    return res
    .status(200)
    .json(new ApiResponse(200, 'User onboarded successfully.', user));
});
export const getMe = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if(!user) throw new ApiError(404, 'User not found.');

    return res
    .status(200)
    .json(new ApiResponse(200, 'User fetched successfully.', user));
});