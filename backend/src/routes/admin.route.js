import { Router } from "express";
import { authCheck } from "../middlewares/auth.middleware.js";
import checkRole from "../middlewares/role.middleware.js";
import { assignRole, deleteUser, editUserProfile, getAllUsers, getAuditLogs, getDashboard, userBanOrUnban } from "../controllers/admin.controller.js";

const router = Router();

//admin
router.route("/dashboard").get(authCheck, checkRole("admin:dashboard"), getDashboard);
router.route("/audit-logs").get(authCheck, checkRole("admin:audit-logs"), getAuditLogs);

//user management
router.route("/users").get(authCheck, checkRole("user:view-all"), getAllUsers);
router.route("/users/:id").delete(authCheck, checkRole("user:delete"), deleteUser)
router.route("/users/assign-role/:id").patch(authCheck, checkRole("user:role-assign"), assignRole);

//moderation
router.route("/users/ban/:id").patch(authCheck, checkRole("user:ban"), userBanOrUnban);
router.route("/users/unban/:id").patch(authCheck, checkRole("user:unban"), userBanOrUnban);

//profile
router.route("/users/edit/:id").patch(authCheck, checkRole("profile:edit-any"), editUserProfile);

export default router;