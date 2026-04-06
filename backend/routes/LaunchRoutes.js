import express from 'express';
import multer from 'multer';
// 🆕 Controller functions ko import karein
import { addLaunch, getAllLaunches, deleteLaunch } from '../controllers/launchController.js'; 

const router = express.Router();

// Multer file storage (Same as before)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// --- Routes ---

// Add launch product
router.post('/add', upload.single('launchImage'), addLaunch);

// Get all launches
router.get('/', getAllLaunches);

// Delete a launch (Naya Route)
router.delete('/delete/:id', deleteLaunch);

export default router;