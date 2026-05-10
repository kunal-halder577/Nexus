// middlewares/normalizeLikableType.middleware.js
export const normalizeLikableType = (req, res, next) => {
    if (req.params.likableType) {
        req.params.likableType =
            req.params.likableType.charAt(0).toUpperCase() +
            req.params.likableType.slice(1).toLowerCase();
    }
    if (req.params.type) {
        req.params.type =
            req.params.type.charAt(0).toUpperCase() +
            req.params.type.slice(1).toLowerCase();
    }
    next();
};