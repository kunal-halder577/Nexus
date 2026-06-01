import { Router } from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import { createBookmark, deleteBookmark, getUserBookmarks } from "../controllers/bookmark.controller.js";

const router = Router();

router.route('/').get(authCheck, getUserBookmarks);
router.route('/:postId').post(authCheck, createBookmark).delete(authCheck, deleteBookmark);

export default router;