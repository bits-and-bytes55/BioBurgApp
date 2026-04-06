import jwt from 'jsonwebtoken';
import Pharmacy from '../../models/Pharmacy.js';

export const protectPharmacy = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'pharmacy') {
      return res.status(401).json({ success: false, message: 'Not authorized as pharmacy' });
    }

    const pharmacy = await Pharmacy.findById(decoded.id);
    if (!pharmacy) {
      return res.status(401).json({ success: false, message: 'Pharmacy not found' });
    }

    if (pharmacy.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval.',
        status: pharmacy.status,
      });
    }

    req.user = { id: decoded.id, type: 'pharmacy' };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};