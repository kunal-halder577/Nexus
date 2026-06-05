import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { PERMISSIONS, ROLES } from "../utils/roles.js";

const checkRole = (permission) => asyncHandler(async (req, _, next) => {
    const allowedRoles = PERMISSIONS[permission];
    const {role} = req.user;

    if (!allowedRoles?.includes(role)) {
        throw new ApiError(403, "Forbidden: Insufficient permissions");
    }

    req.user.isPrivilaged = [ROLES.ADMIN, ROLES.MODERATOR].includes(role);
    req.user.isAdmin = [ROLES.ADMIN].includes(role);
    req.user.isModerator = [ROLES.MODERATOR].includes(role);

    next();
});

export default checkRole;
