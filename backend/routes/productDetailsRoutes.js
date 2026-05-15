import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductByTitle,
  updateProductByTitle,
  deleteProductByTitle,
  filterProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  getProductByQrToken,
  getProductQrCodeImage,
  addReview,
  voteProduct,
  getProductsForTargets,
} from "../controllers/productDetailsController.js";
import { adminProtect } from "../middleware/adminAuth.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", adminProtect, createProduct);

router.get("/filter", optionalAuth, filterProducts);
router.get("/all", optionalAuth, getAllProducts);

router.get("/for-targets", adminProtect, getProductsForTargets);

router.get("/qr/:token", getProductByQrToken);
router.get("/qr-image/:token", getProductQrCodeImage);

router.get("/get/:id", optionalAuth, getProductById);
router.put("/update/:id", adminProtect, updateProductById);
router.delete("/delete/:id", adminProtect, deleteProductById);

router.post("/:id/reviews", optionalAuth, addReview);
router.post("/:id/vote", optionalAuth, voteProduct);

router.get("/get-by-title/:title", optionalAuth, getProductByTitle);
router.put("/update-by-title/:title", adminProtect, updateProductByTitle);
router.delete("/delete-by-title/:title", adminProtect, deleteProductByTitle);


export default router;
