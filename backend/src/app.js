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
}))

//utilities
app.use(cookieParser());
app.use(compression());

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);

export default app;
