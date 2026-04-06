import express from "express";
import {
  addSlider,
  getSliders,
  getAllSliders,
  deleteSlider,
  toggleSlider,
  updateDimensions,
  cropSlider,
} from "../controllers/homeSliderController.js";

const router = express.Router();

router.post("/add",                  addSlider);
router.get("/",                      getSliders);
router.get("/admin",                 getAllSliders);
router.delete("/:id",                deleteSlider);
router.patch("/:id/toggle",          toggleSlider);     
router.patch("/:id/dimensions",      updateDimensions);  
router.patch("/:id/crop",            cropSlider);       

export default router;