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
export const updateMe = asyncHandler(async (req, res) => {
    
    const userId = req.user._id;
    const { name, email, username, age, gender } = req.body;

    if (!name && !email && !username && !age && !gender) {
        throw new ApiError(400, "At least one field is required.");
    }

    const updateFields = {};

    if (name && name.trim().length >= 2) {
        updateFields.name = name.trim();
    } else if (name) { 
        throw new ApiError(422, "Name must consist of at least 2 characters.");
    }

    if (username) {
        const normalizedUsername = username.toLowerCase().trim();
        if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
            throw new ApiError(422, "Invalid username format.");
        }
        updateFields.username = normalizedUsername;
    }

    if (email) {
        const normalizedEmail = email.toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            throw new ApiError(422, "Invalid email format.");
        }
        updateFields.email = normalizedEmail;
    }

    if (age) {
        if (isNaN(age) || Number(age) <= 0) { 
            throw new ApiError(422, "Invalid age.");
        }
        updateFields.age = Number(age);
    }

    if (gender) {
        if (!['male', 'female', 'others'].includes(gender.trim())) {
            throw new ApiError(422, "Invalid gender.");
        }
        updateFields.gender = gender.trim();
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        {
            new: true,
            runValidators: true,
            context: 'query' // Important for custom validators to work properly
        }
    );

    if (!user) throw new ApiError(404, "User not found or failed to update.");

    return res
    .status(200)
    .json(new ApiResponse(200, "User updated successfully.", user));

});
export const getUser = asyncHandler(async (req, res) => {
    const { id, username, email } = req.body;

    if(!id && !username && !email) {
        throw new ApiError(400, "At least one identifier (id, username, or email) is required.");
    }
    
    let user;

    if(id) {
        user = await User.findById(id);
    } else {
        const queryCriteria = [];
        
        if(username) queryCriteria.push({ username });
        if(email) queryCriteria.push({ email });
        
        user = await User.findOne({
            $or: queryCriteria
        });
    }
    if(!user) throw new ApiError(404, "User not found.");

    return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully.", user));
});