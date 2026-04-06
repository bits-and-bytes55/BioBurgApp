import express from 'express';
import multer from 'multer';

// Logic ko controller se import karein
import { 
  addTrending, 
  getAllTrending,
  deleteTrending // 🆕 Delete function import karein
} from '../controllers/TrendController.js';

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
router.post('/add', upload.single('trendingImage'), addTrending);
router.get('/', getAllTrending);
router.delete('/delete/:id', deleteTrending); // 🆕 Naya delete route

export default router;