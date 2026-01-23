import { Router } from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { getMe, onboarding } from "../controllers/user.controller.js";

const router = Router();

// protected routes
router.route('/me/onboarding').patch(
    authCheck, upload.fields([{ name: 'avatar', maxCount: 1 }]), onboarding
);
router.route('/me').get(authCheck, getMe);

export default router;