import { Router } from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { createPost, deletePost, getPostById, getPosts, getUserPosts, updatePost } from "../controllers/post.controller.js";

const router = Router();

// 1. Static/Specific routes go FIRST
router.route("/").post(
  authCheck, upload.fields([{ name: "media", maxCount: 10}]), createPost
);
router.route("/feed").get(authCheck, getPosts);

// 2. Specific dynamic routes go NEXT
router.route("/user/:userId").get(authCheck, getUserPosts);

// 3. Catch-all/Wildcard dynamic routes go LAST
router.route("/:id").get(authCheck, getPostById);
router.route("/:id").patch(authCheck, updatePost);
router.route("/:id").delete(authCheck, deletePost);

export default router;