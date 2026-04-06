import PartnerUser from "../../models/radiology/PartnerUser.model.js";
import { generateToken } from "../../utils/jwt.js";

/**
 * PARTNER LOGIN
 */
export const partnerLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await PartnerUser.findOne({ email });

  if (!user || user.password !== password || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
    partnerId: user.partnerId,
  });

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      email: user.email,
      role: user.role,
    },
  });
};
