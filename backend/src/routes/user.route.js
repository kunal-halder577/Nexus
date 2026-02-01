import { Router } from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { getMe, getUser, onboarding, updateAvatar, updateMe } from "../controllers/user.controller.js";

const router = Router();

// protected routes
router.route('/me/onboarding').patch(
    authCheck, upload.fields([{ name: 'avatar', maxCount: 1 }]), onboarding
);
router.route('/update-avatar').patch(
    authCheck, upload.single('avatar'), updateAvatar
);
router.route('/me').get(authCheck, getMe);
router.route('/me').patch(authCheck, updateMe);
router.route('/:id').get(authCheck, getUser);

export default router;