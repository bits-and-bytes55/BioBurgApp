import express from "express";
import {
  createPage, 
  getAllPages,
  getPageBySlug,
  savePage,
  publishPage,
  rollbackVersion,
  createCMS,
  updateCMS,
  deleteCMS,
  getAllCMS,
  getCMSBySection
} from "../controllers/cmsController.js";
import { adminProtect } from "../middleware/adminAuth.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

// 🔒 ADMIN CMS ROUTES
router.post("/admin/pages", adminProtect, createPage); 
router.get("/admin/pages", adminProtect, getAllPages);
router.get("/admin/pages/:slug", adminProtect, getPageBySlug);
router.put("/admin/pages/:slug", adminProtect, savePage);
router.post("/admin/pages/:slug/publish", adminProtect, publishPage);
router.post("/admin/pages/:slug/rollback", adminProtect, rollbackVersion);

// 🌐 PUBLIC CMS ROUTE
router.get("/pages/:slug", getPageBySlug);

/* ADMIN */
router.post("/admin/cms", adminProtect, isAdmin, createCMS);
router.put("/admin/cms/:id", adminProtect, isAdmin, updateCMS);
router.delete("/admin/cms/:id", adminProtect, isAdmin, deleteCMS);
router.get("/admin/cms", adminProtect, isAdmin, getAllCMS);

/* PUBLIC */
router.get("/cms/:sectionKey", getCMSBySection);

export default router;
