import express from 'express';
import multer from 'multer';

// Controller se logic import karein
import { 
  addFeaturedBrand, 
  getAllFeaturedBrands 
} from '../controllers/Brandcontroller.js';

const router = express.Router();

// --- Multer Image Upload Middleware ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// --- Routes ---
// Naya field name 'brandImage'
router.post('/add', upload.single('brandImage'), addFeaturedBrand);
router.get('/', getAllFeaturedBrands);

export default router;