import jwt from "jsonwebtoken";

export const protectAgent = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "marketing_agent") {
      return res.status(403).json({ message: "Access denied" });
    }

    // THIS IS THE CRITICAL FIX
    req.user = {
      id: decoded.id,     // controller expects this
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token failed" });
  }
};
