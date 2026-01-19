import { Router } from 'express';
import { changePassword, getMe, login, logout, refreshAccessToken, register } from '../controllers/auth.controller.js';
import { authCheck, verifyRefreshToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/refresh/access-token').post(verifyRefreshToken, refreshAccessToken);
router.route('/me').get(getMe);

//protected routes
router.route('/logout').post(authCheck, logout);
router.route('/change-password').post(authCheck, changePassword);

export default router;
