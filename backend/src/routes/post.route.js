import { Router } from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { createPost, deletePost, getPostById, getPosts, getUserPosts, updatePost } from "../controllers/post.controller.js";

const router = Router();

router.route("/").post(
    authCheck, upload.fields([{ name: "media", maxCount: 10}]), createPost
);
router.route("/:id").get(authCheck, getPostById);
router.route("/feed").get(authCheck, getPosts);
router.route("/user/:userId").get(authCheck, getUserPosts);
router.route("/:id").patch(authCheck, updatePost);
router.route("/:id").delete(authCheck, deletePost);

export default router;