import jwt from "jsonwebtoken";

const generateToken = (id, role = "marketing_agent") => {
  return jwt.sign(
    {
      id,
      role,
      userType: "marketing_agent",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export default generateToken;
