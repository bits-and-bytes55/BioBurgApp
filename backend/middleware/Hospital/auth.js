import jwt from 'jsonwebtoken';
import Hospital from '../../models/Hospital.js';

export const protectHospital = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'hospital') {
      return res.status(401).json({ success: false, message: 'Not authorized as hospital' });
    }

    const hospital = await Hospital.findById(decoded.id);
    if (!hospital) {
      return res.status(401).json({ success: false, message: 'Hospital not found' });
    }

    if (hospital.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval.',
        status: hospital.status,
      });
    }

    req.user = { id: decoded.id, type: 'hospital' };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};