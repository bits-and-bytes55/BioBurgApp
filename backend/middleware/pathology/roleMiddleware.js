export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // role authMiddleware se aati hai
      const userRole = req.role;

      if (!userRole) {
        return res.status(403).json({
          message: "Role not found in request",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "You are not authorized to access this resource",
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        message: "Role authorization failed",
      });
    }
  };
};
