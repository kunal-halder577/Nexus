import { Router } from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import { getCurrentUserLikedContent, getLikers, getUserLikedContent, toggleLike } from "../controllers/like.controller.js";
import { normalizeLikableType } from "../middlewares/util.middleware.js";

const router = Router();

// GET /likers/:likableType/:likableId  → getLikers
// GET /liked/:type/me                  → getCurrentUserLikedContent
// GET /liked/:type/:userId             → getUserLikedContent
// POST   /toggle/:likableType/:likableId → toggleLike
// DELETE /toggle/:likableType/:likableId → toggleLike

router.route("/likers/:likableType/:likableId").get(authCheck, normalizeLikableType, getLikers);

router.route("/liked/:type/me").get(authCheck, normalizeLikableType, getCurrentUserLikedContent);
router.route("/liked/:type/:userId").get(authCheck, normalizeLikableType, getUserLikedContent);

router
  .route("/toggle/:likableType/:likableId")
  .post(authCheck, normalizeLikableType, toggleLike)
  .delete(authCheck, normalizeLikableType, toggleLike);

export default router;