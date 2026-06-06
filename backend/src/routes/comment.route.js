import { Router } from "express";
import { createComment, deleteComment, getCommentById, getPostComments, getReplies, updateComment } from "../controllers/comment.controller.js";
import { authCheck } from "../middlewares/auth.middleware.js";
import checkRole from "../middlewares/role.middleware.js";

const router = Router();



router.route('/').post(authCheck, createComment);

router.route('/:commentId/replies').get(authCheck, getReplies);

router.route('/post/:postId').get(authCheck, getPostComments);

router.route('/:commentId')
    .get(authCheck, getCommentById)
    .put(authCheck, checkRole("comment:edit-own"), updateComment)
    .delete(authCheck, checkRole("comment:delete-own"), deleteComment);

export default router;