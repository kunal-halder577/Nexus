import { Router } from "express";
import { createComment, deleteComment, getCommentById, getPostComments, getReplies, updateComment } from "../controllers/comment.controller.js";
import { authCheck } from "../middlewares/auth.middleware.js";

const router = Router();



router.route('/').post(authCheck, createComment);

router.route('/:commentId/replies').get(authCheck, getReplies);

router.route('/post/:postId').get(authCheck, getPostComments);

router.route('/:commentId')
    .get(authCheck, getCommentById)
    .put(authCheck, updateComment)
    .delete(authCheck, deleteComment);

export default router;