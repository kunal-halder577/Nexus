import bcrypt from "bcrypt";
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { accessTokenExpiry, accessTokenSecretKey, nodeEnv, refreshTokenSecretKey } from '../constants.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import jwt from "jsonwebtoken";

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username) throw new ApiError(422, "Username is required.");
  if (!email) throw new ApiError(422, "Email is required.");
  if (!password) throw new ApiError(422, "Password is required.");
  if (!confirmPassword) throw new ApiError(422, "Confirm password is required.");
  if (password !== confirmPassword) {
    throw new ApiError(409, "Password and Confirm Password must be same.");
  }
  
  const normalizedUsername = username.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();

  if(!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
    throw new ApiError(422, "Invalid username.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new ApiError(422, "Invalid email.");
  }
  if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
    throw new ApiError(422, "Invalid password.");
  }

  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (existingUser) throw new ApiError(409, "User already exists.");

  let user;
  try {
    user = await User.create({
      email: normalizedEmail,
      username: normalizedUsername,
      providers: { local: { password } },
    });
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, "User already exists.");
    throw error;
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  const createdUser = await User.findById(user._id).select(
    "_id username email createdAt isOnboarded"
  );

  const response = {
    user: createdUser.toObject(),
    accessToken
  };

  const baseCookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
  };

  const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(new ApiResponse(201, "User registered successfully", response));

});
export const login = asyncHandler(async (req, res) => {
  let { username, email, password } = req.body;
  
  if(!(username || email)) {
    throw new ApiError(422, 'username or email is required.');
  }
  if(!password) {
    throw new ApiError(422, 'password is required.');
  }
  username = username?.trim().toLowerCase();
  email = email?.trim().toLowerCase();

   const user = await User.findOne({
    $or: [
      username ? { username } : null,
      email ? { email } : null,
    ].filter(Boolean),
  }).select('+providers.local.password');
  
  if(!user) {
    throw new ApiError(404, 'user not found.');
  }
  
  const isPasswordValid = await bcrypt.compare(
    password, 
    user.providers.local.password
  );

  if(!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials.');
  }
  
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  user.lastLoginIP = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  
  await user.save();

  const response = {
    user: {
      _id: user._id,
      age: user.age,
      name: user.name,
      email: user.email,
      gender: user.gender,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    accessToken
  }
  
   const baseCookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
  }

  const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }

  res
  .status(200)
  .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
  .json(new ApiResponse(200, 'user logged in successfully.', response));
  
});
export const logout = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user._id }, 
    { $unset: { refreshToken: 1} },
  )
  
   const baseCookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
  }

  const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }

  return res
  .status(200)
  .clearCookie("refreshToken", refreshTokenCookieOptions)
  .json(new ApiResponse(200, 'user logged out successfully.', {}));
});
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const accessToken = req.user.generateAccessToken();
  const refreshToken = req.user.generateRefreshToken();

  req.user.refreshToken = refreshToken;
  await req.user.save();

   const baseCookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
  }

  const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  const response = {
    accessToken,
  };

  return res
  .status(200)
  .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
  .json(new ApiResponse(200, 'Tokens refreshed successfully.', response));

});
export const getMe = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken =
    req.cookies?.accessToken ||
    (authHeader?.startsWith("Bearer ") && authHeader.split(" ")[1]);

  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    throw new ApiError(401, "Unauthorized request.");
  }

  // 1) Try access token first
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, accessTokenSecretKey);

      const user = await User.findById(decoded._id).select(
        "_id username email role name isActive isBlocked"
      );

      if (!user) throw new ApiError(404, "User not found.");
      if (!user.isActive || user.isBlocked) throw new ApiError(403, "Account is disabled.");

      const response = {
        user,
        accessToken,
      };
      return res
      .status(200)
      .json(new ApiResponse(200, "User fetched successfully.", response));
    } catch (err) {
      // access token invalid/expired → fallback to refresh token
    }
  }

  // 2) Fallback to refresh token
  if (!refreshToken) {
    throw new ApiError(401, "Session expired. Please login again.");
  }

  let decodedRefresh;
  try {
    decodedRefresh = jwt.verify(refreshToken, refreshTokenSecretKey);
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token.");
  }

  const user = await User.findById(decodedRefresh._id).select(
    "_id username email role name isActive isBlocked refreshToken"
  );

  if (!user) throw new ApiError(404, "User not found.");
  if (!user.isActive || user.isBlocked) throw new ApiError(403, "Account is disabled.");
  if (!user.refreshToken) throw new ApiError(401, "Session expired. Please login again.");

  const isRefreshTokenSame = await bcrypt.compare(refreshToken, user.refreshToken);

  if (!isRefreshTokenSame) {
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: nodeEnv === "production",
      sameSite: "lax",
    });

    throw new ApiError(401, "Refresh token revoked.");
  }

  // 3) Issue new access token
  const newAccessToken = jwt.sign(
    { _id: user._id },
    accessTokenSecretKey,
    { expiresIn: accessTokenExpiry }
  );

  const safeUser = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    isActive: user.isActive,
    isBlocked: user.isBlocked,
  };

  const response = { user: safeUser, accessToken: newAccessToken };

  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully.", response));

});
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if(!newPassword || !oldPassword || !confirmPassword) {
    throw new ApiError(422, 'All fields are required.');
  }
  if(newPassword === oldPassword) {
    throw new ApiError(422, 'New password can\'t be same as old password.');
  }
  if(newPassword !== confirmPassword) {
    throw new ApiError(422, 'Passwords do not match.');
  }
  const user = await User.findById(req.user._id)
  .select("+providers.local.password");

  if(!user) {
    throw new ApiError(404, 'User not found.');
  }
  //OAuth users
  if (!user.providers?.local?.password) {
    throw new ApiError(400, "You don't have a local password set.");
  }

  const isPasswordValid = await bcrypt.compare(
    oldPassword, user.providers?.local?.password
  );

  if(!isPasswordValid) {
    throw new ApiError(401, 'Old password is incorrect.');
  }

  user.providers.local.password = newPassword;
  user.passwordChangedAt = new Date();
  user.refreshToken = undefined; //for security, if refreshToken gets leaked, changing 
                                 //password, invalidate the refreshToken
  await user.save();

  return res
  .status(200)
  .json(new ApiResponse(200, 'Password updated successfully.', {}));
});