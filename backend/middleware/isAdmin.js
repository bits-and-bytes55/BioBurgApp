const isAdmin = (req, res, next) => {
  // verifyToken middleware ne req.user set kiya hota hai
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only"
    });
  }

  next();
};

export default isAdmin;
