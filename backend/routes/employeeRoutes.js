import express from "express";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getHiredApplications,
  importFromApplication,
} from "../controllers/employeeController.js";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminMiddleware);

router.get("/",                           getAllEmployees);
router.get("/hired-applications",         getHiredApplications);
router.get("/:id",                        getEmployeeById);
router.post("/",                          createEmployee);
router.post("/import/:applicationId",     importFromApplication);
router.patch("/:id",                      updateEmployee);
router.delete("/:id",                     deleteEmployee);

export default router;