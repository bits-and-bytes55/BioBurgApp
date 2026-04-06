import express from 'express';
import { createSection, getSections, updateSection, deleteSection, reorderSections} from '../controllers/sectionsController.js'
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();



router.post("/add", adminProtect, createSection);
router.get("/all", getSections);
router.put("/update/:id",adminProtect, updateSection);
router.delete("/delete/:id",adminProtect, deleteSection);
// ⭐ NEW
router.put("/reorder", reorderSections);



export default router;