import { accessTokenSecretKey, refreshTokenSecretKey } from "../constants";
import User from "../models/user.model";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken"

export const authCheck = asyncHandler(async(req, _, next) => {
    const authHeader = req.headers.authorization;
    const accessToken = req.cookies?.accessToken ||
    (authHeader?.startsWith('Bearer ') && authHeader.split(' ')[1]);

    if(!accessToken) {
        throw new ApiError(401, 'unauthorized request.');
    }
    if (!refreshTokenSecretKey) {
        throw new Error('JWT secrets are not defined');
    }

    let decodedData;
    try {
        decodedData = jwt.verify(accessToken, accessTokenSecretKey);
    } catch (error) {
        throw new ApiError(401, error.message || 'Invalid session token.');
    }
    const user = await User.findById(decodedData._id)
    .select('_id username role isActive isBlocked');

    if(!user) {
        throw new ApiError(404, 'user not found.');
    }
    if (!user.isActive || user.isBlocked) {
        throw new ApiError(403, 'Account is disabled.');
    }

    req.user = user;

    next();
});
export const verifyRefreshToken = asyncHandler(async(req, _, next) => {
    const refreshToken = req.cookies?.refreshToken;

    if(!refreshToken) {
        throw new ApiError(401, 'Refreshtoken is required.');
    }
    if (!refreshTokenSecretKey) {
        throw new Error('JWT secrets are not defined');
    }

    let decodedData;

    try {
        decodedData = jwt.verify(refreshToken, refreshTokenSecretKey);
    } catch (error) {
        throw new ApiError(401, error.message || 'Invalid session token.');
    }
    const user = await User.findById(decodedData._id)
    .select('+refreshToken isActive isBlocked');

    if(!user) {
        throw new ApiError(404, 'user not found.');
    }
    if (!user.isActive || user.isBlocked) {
        throw new ApiError(403, 'Account is disabled.');
    }
    if(refreshToken !== user.refreshToken)  {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(401, 'Refresh token revoked.');
    }
    req.user = user;
    next();
});