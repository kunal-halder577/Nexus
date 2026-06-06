import express from 'express';
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { allowedOrigins } from './constants.js';

const app = express();

//core parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

//security
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: () => process.env.NODE_ENV === 'development',
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
}))

//utilities
app.use(cookieParser());
app.use(compression());

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import likeRouter from "./routes/like.route.js";
import followRouter from "./routes/follow.route.js";
import commentRouter from "./routes/comment.route.js";
import bookmarkRouter from "./routes/bookmark.route.js";
import adminRouter from "./routes/admin.route.js";

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/likes', likeRouter);
app.use('/api/v1/follow', followRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/bookmarks', bookmarkRouter);
app.use('/api/v1/admin', adminRouter);

export default app;
