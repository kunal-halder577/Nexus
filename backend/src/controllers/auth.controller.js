import bcrypt from "bcrypt";
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { nodeEnv } from '../constants.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadImageOnCloud } from '../utils/cloudinary.js';

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, name, age, gender } = req.body;
  const allowedGenders = ['male', 'female', 'others'];
  const normalizedUsername = username.toLowerCase();
  const normalizedEmail = email.toLowerCase();
  
  if (!username) {
    throw new ApiError(422, 'Username is required.');
  }
  if (!email) {
    throw new ApiError(422, 'Email is required');
  }
  if (!password) {
    throw new ApiError(422, 'Password is required.');
  }
  if (password.length < 8) {
    throw new ApiError(422, 'Password must be at least 8 characters.');
  }
  if (gender && !allowedGenders.includes(gender)) {
    throw new ApiError(400, 'wrong gender is provided.');
  }

  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (existingUser) {
    throw new ApiError(409, 'user already exist.');
  }
  
  const avatarLocalPath = req.files?.['avatar']?.[0].path;

  const { 
    url: avatarCloudPath, 
    publicId: avatarPublicId 
  } = avatarLocalPath? 
    await uploadImageOnCloud(avatarLocalPath, 'avatar', 'avatar') 
    : {url: undefined, publicId: undefined};
  
  if(avatarLocalPath && !avatarCloudPath) {
    throw new ApiError(500, 'Failed to upload image on cloud.');
  }

  let user;

  try {
    user = await User.create({
      gender,
      age: age ?? 18,
      name: name ?? '',
      email: normalizedEmail,
      username: normalizedUsername,
      avatarUrl: avatarCloudPath || "",
      providers: { local: { password } },
      avatarPublicId: avatarPublicId || "",
      lastLoginAt: new Date(),
      passwordChangedAt: new Date(),
      lastLoginIp: req.ip || req.headers['x-forwarded-for'],
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'User already exist.');
    }
    throw error;
  }

  const createdUser = await User.findById(user._id);

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while fetching user data.');
  }

  return res.status(201).json(new ApiResponse(201, 'User registered successfully', createdUser));
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

  const responseUser = {
    _id: user._id,
    age: user.age,
    name: user.name,
    email: user.email,
    gender: user.gender,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
  
  const cookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'strict',
  }

  res
  .status(200)
  .cookie('accessToken', accessToken, cookieOptions)
  .cookie('refreshToken', refreshToken, cookieOptions)
  .json(new ApiResponse(200, 'user logged in successfully.', responseUser))
});
export const logout = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user._id }, 
    { $unset: { refreshToken: 1} },
  )
  
  const cookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'strict'
  };

  return res
  .status(200)
  .clearCookie("accessToken", cookieOptions)
  .clearCookie("refreshToken", cookieOptions)
  .json(new ApiResponse(200, 'user logged out successfully.', {}));
});
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const accessToken = req.user.generateAccessToken();
  const refreshToken = req.user.generateRefreshToken();

  req.user.refreshToken = refreshToken;
  await req.user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'strict',
  }
  return res
  .status(200)
  .cookie("accessToken", accessToken, cookieOptions)
  .cookie("refreshToken", refreshToken, cookieOptions)
  .json(new ApiResponse(200, 'Tokens refreshed successfully.', {}));
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
})