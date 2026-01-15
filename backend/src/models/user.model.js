import { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { accessTokenExpiry, accessTokenSecretKey, refreshTokenExpiry, refreshTokenSecretKey } from '../constants.js';

const USER_ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
});
const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: '{VALUE} is not a valid role',
      },
      default: USER_ROLES.USER,
    },
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9_]+$/, 'Invalid username'],
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'others'],
      default: 'male',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isOnboarded: { 
      type: Boolean, 
      default: false 
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
    },
    avatarPublicId: {
      type: String,
    },
    providers: {
      google: {
        id: { type: String },
      },
      facebook: {
        id: { type: String },
      },
      local: {
        password: {
          type: String,
          select: false,
          validate: {
            validator: function (v) {
              return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v);
            },
            message: 'Password is too weak',
          },
          minLength: 8,
        },
      },
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.index({ 'providers.google.id': 1 }, { unique: true, sparse: true });
userSchema.index({ 'providers.facebook.id': 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });

userSchema.pre('validate', async function () {
  const hasOAuth =
    this.providers?.google?.id ||
    this.providers?.facebook?.id;

  const hasLocal = this.providers?.local?.password;

  if (!hasOAuth && !hasLocal) {
    throw new Error('User must have at least one auth provider');
  }
});
userSchema.pre('save', async function () {
  const password = this.providers?.local?.password;
  const refreshToken = this.refreshToken;

  if (password && this.isModified('providers.local.password')) {
    const salt = await bcrypt.genSalt();
    this.providers.local.password = await bcrypt.hash(password, salt);
  }
  if(refreshToken && this.isModified('refreshToken')) {
    const salt = await bcrypt.genSalt();
    this.refreshToken = await bcrypt.hash(refreshToken, salt);
  }
});
userSchema.set('toJSON', {
  transform(doc, ret) {
    return {
      _id: ret._id,
      age: ret.age,
      name: ret.name,
      email: ret.email,
      gender: ret.gender,
      username: ret.username,
      avatarUrl: ret.avatarUrl,
      avatarPublicId: ret.avatarPublicId,
      createdAt: ret.createdAt,
    };
  },
});
userSchema.virtual('profile').get(function () {
  return {
    username: this.username,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
  };
});

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      username: this.username,
    },
    accessTokenSecretKey,
    { expiresIn: accessTokenExpiry }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id }, 
    refreshTokenSecretKey, 
    { expiresIn: refreshTokenExpiry, }
  );
};
const User = model('User', userSchema);

export default User;
