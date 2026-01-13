import express from 'express';
import dotenv from "dotenv";
dotenv.config();
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cors from "cors";

const app = express();

//core parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

//security
app.use(cors());
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
}))

//utilities
app.use(cookieParser());
app.use(compression());

import authRouter from "./routes/auth.route.js";

app.use('/api/v1/auth', authRouter);

export default app;
