import jwt from "jsonwebtoken";
import Doctor from "../../models/doctors/Doctor.js";

const protectDoctor = async (req, res, next) => {
  try {
    let token;

    // 🔹 Token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, token missing",
      });
    }

    // 🔹 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Attach doctor to request
    const doctor = await Doctor.findById(decoded.id).select("-password");

    if (!doctor) {
      return res.status(401).json({
        message: "Doctor not found",
      });
    }
    if (doctor.status === "blocked") {
  return res.status(403).json({
    message: "Your account has been blocked by admin"
  });
}

if (doctor.status === "pending") {
  return res.status(403).json({
    message: "Your account is pending approval"
  });
}
console.log(token)

    req.doctor = doctor;
    next();

  } catch (error) {
    console.error("Doctor Auth Error:", error);
    res.status(401).json({
      message: "Not authorized, invalid token",
    });
  }
};

export default protectDoctor;
