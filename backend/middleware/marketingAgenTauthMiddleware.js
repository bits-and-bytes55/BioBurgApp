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

    console.log("DECODED JWT =>", decoded); // 👈 Add this temporarily to see what's in your token

    if (decoded.role !== "marketing_agent") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Normalize: support any field name your login route used when signing the token
    const agentId =
      decoded.id ||
      decoded._id ||
      decoded.agentId ||
      decoded.userId;

    if (!agentId) {
      return res
        .status(401)
        .json({ message: "Token payload missing agent ID" });
    }

    req.user = {
      id: agentId.toString(), // always available as req.user.id
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.log("JWT VERIFY ERROR =>", error.message);
    return res.status(401).json({ message: "Token failed" });
  }
};