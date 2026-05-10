import { Router } from 'express'
import { followUser, getFollowers, getFollowing, getFollowStatus, unfollowUser } from '../controllers/follow.controller.js';
import { authCheck } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/:userId')
.post(authCheck, followUser)
.delete(authCheck, unfollowUser);

router.route('/:userId/followers').get(authCheck, getFollowers);
router.route('/:userId/following').get(authCheck, getFollowing);

router.route('/:userId/status').get(authCheck, getFollowStatus);

export default router;