import { Router } from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { createPost, deletePost, getPostById, getPosts, getUserPosts, updatePost, viewPost } from "../controllers/post.controller.js";
import checkRole from "../middlewares/role.middleware.js";

const router = Router();

// 1. Static/Specific routes go FIRST
router.route("/").post(
  authCheck, upload.fields([{ name: "media", maxCount: 10}]), createPost
);
router.route("/feed").get(authCheck, getPosts);

// 2. Specific dynamic routes go NEXT
router.route("/user/:userId").get(authCheck, getUserPosts);
router.route("/:id/view").post(authCheck, viewPost);

// 3. Catch-all/Wildcard dynamic routes go LAST
router.route("/:id").get(authCheck, getPostById);
router.route("/:id").patch(authCheck, checkRole("post:edit-own"), updatePost);
router.route("/:id").delete(authCheck, checkRole("post:delete-own"), deletePost);

export default router;