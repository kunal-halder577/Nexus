import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { ROLES } from "../utils/roles.js";
import AuditLog from "../models/AuditLog.model.js";
import Post from "../models/post.model.js";

//profile
export const editUserProfile = asyncHandler(async (req, res) => {
    const { name, email, username, age, gender } = req.body;
    const { id } = req.params;
    const userId = req.user._id;

    if(!id || !mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
        throw new ApiError(404, "User not found.");
    }
    if (targetUser.role === 'admin') {
        throw new ApiError(403, "Unauthorized.");
    }

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
        id,
        { $set: updateFields },
        {
            new: true,
            runValidators: true,
            context: 'query' // Important for custom validators to work properly
        }
    );

    if (!user) throw new ApiError(404, "Failed to update user.");

    await AuditLog.create({
        actor: userId,
        action: "EDIT_USER",
        target: user._id,
        targetModel: 'User',
        details: {
            log: `${req.user.username} updated ${user.username}'s profile.`
        }
    });

    return res
    .status(200)
    .json(new ApiResponse(200, "User updated successfully.", user));
});

//user
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if(!id || !mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid user id.");
    }

    const user = await User.findById(id);

    if(!user) {
        throw new ApiError(404, "User not found.");
    }
    if(user.role === 'admin') {
        throw new ApiError(403, "Unauthorized.");
    }
    
    await User.deleteOne({ _id: id });

    await AuditLog.create({
        actor: req.user._id,
        action: "DELETE_USER",
        target: id,
        targetModel: 'User',
        details: {
            log: `${req.user.username} deleted ${user.username}'s account.`
        }
    });

    return res
    .status(200)
    .json(new ApiResponse(200, "User deleted successfully."));
});
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    isBlocked,
    isActive,
  } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, parseInt(limit, 10) || 20);

  const query = {};

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { username: { $regex: escapedSearch, $options: 'i' } },
      { email:    { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  if (role)      query.role      = role;
  if (isBlocked) query.isBlocked = isBlocked === 'true';
  if (isActive)  query.isActive  = isActive  === 'true';

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('username email role isActive isBlocked createdAt lastLoginAt lastLoginIP avatarUrl')
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)
    .lean();

  return res
  .status(200)
  .json(new ApiResponse(200, 'User fetched successfully', {
            users,
            pagination: {
                total,
                page:       pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                hasMore:    pageNumber * limitNumber < total,
            }
        }
    ));
});
export const assignRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const { id } = req.params;
    const userId = req.user._id;
    const assignableRoles = [ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER];
    
    if(!id || !mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid user id.");
    }
    if(id === userId.toString()) {
        throw new ApiError(400, "Cannot change your own role.");
    }
    if(!role) {
        throw new ApiError(400, "Role is required.");
    }
    
    if(!assignableRoles.includes(role)) {
        throw new ApiError(400, "Invalid role.");
    }

    const existing = await User.findById(id).select('role username').lean();

    if (!existing) {
        throw new ApiError(404, "User not found.");
    }
    if (existing.role === ROLES.ADMIN) {
        throw new ApiError(403, "Can't change another admin's role.");
    }
    if (existing.role === role) {
        return res
            .status(200)
            .json(new ApiResponse(200, "Role is already same.", {
                user: existing,
                roleChanged: false
            }));
    }

    const user = await User.findByIdAndUpdate(
        id,
        { $set: { role } },
        { new: true }
    );

    await AuditLog.create({
        actor: userId,
        action: "ASSIGN_ROLE",
        target: user._id,
        targetModel: 'User',
        details: { 
            log: `${req.user.username} assigned ${role} role to ${user.username}.`    
        }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, "Role assigned successfully.", {
            user,
            roleChanged: true
        }));
});
export const userBanOrUnban = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    
    if(!id || !mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid user id.");
    }
    if(id === userId.toString()) {
        throw new ApiError(400, "Cannot ban or unban yourself.");
    }
    const existing = await User.findById(id).select('role isBlocked username').lean();
    if (!existing) {
        throw new ApiError(404, "User not found.");
    }
    if (existing.role === ROLES.ADMIN ||
        (existing.role === ROLES.MODERATOR && req.user.role === ROLES.MODERATOR)) {
        throw new ApiError(403, "Insufficient permissions.");
    }

    const isBanned = existing.isBlocked;

    const user = await User.findByIdAndUpdate(
        id,
        { $set: { isBlocked: !isBanned } },
        { new: true }
    );

    await AuditLog.create({
        actor: userId,
        action: isBanned ? "UNBAN_USER" : "BAN_USER",
        target: user._id,
        targetModel: 'User',
        details: { 
            log: `${req.user.username} ${isBanned ? 'unbanned' : 'banned'} ${user.username}'s account.`    
        }    
    });

    return res
        .status(200)
        .json(new ApiResponse(200, `User ${isBanned ? 'unbanned' : 'banned'} successfully.`, {
        user,
        banned: !isBanned
    }));
});

//admin
export const getDashboard = asyncHandler(async (req, res) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const [totalUsers, totalPosts, newUsersToday] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        User.countDocuments({ createdAt: { $gte: startOfToday } })
    ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Dashboard fetched successfully.", {
        totalUsers,
        totalPosts,
        newUsersToday
    }));
});
export const getAuditLogs = asyncHandler(async (req, res) => {
    const { action, search, target, page=1, limit=20 } = req.query;
    
    const pageNumber  = Math.max(1, parseInt(page, 10)  || 1);
    const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const query = {};
    let users = [];

    if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        users = await User.find({
            $or: [
            { username: { $regex: escapedSearch, $options: 'i' } },
            { email:    { $regex: escapedSearch, $options: 'i' } },
            ]
        }).select('_id');
    }

    if(users.length > 0) {
        query.actor = { $in: users.map(u => u._id) }
    }

    if (action) query.action = action;
    if (target) query.target = target;
    
    const totalLogs = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
        .populate('actor', 'username email name avatarUrl _id')
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);
    
    return res
        .status(200)
        .json(new ApiResponse(200, "Audit logs fetched successfully.", {
            logs,
            pagination: {
                total: totalLogs,
                page: pageNumber,
                totalPages: Math.ceil(totalLogs / limitNumber),
                hasMore: pageNumber * limitNumber < totalLogs,
            }
        }));
});