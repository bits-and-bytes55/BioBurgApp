import express from "express";
import {
  registerAgent, loginAgent, getAgentProfile, getJobRequirements,
  startJob, getJobStatus, updateLiveLocation, closeJob, saveJobDetails,
  getAgentProfileWithJob, getCompletedLeads, getAgentProducts, getJobHistory,
  saveResponse, getResponses, getWorkPerformance, getAllMRPerformance,
  getAgentVisualAds, createLead, getLeads, updateLead, deleteLead,
  updateLeadStage, getAllStaff, createStaff, updateStaff, deleteStaff,
  createSupportTicket, getSupportTickets, updateTicketStatus,
  createWorkflow, getWorkflows, updateWorkflowStage,getMyIdCard,
  getMyLeaves,applyLeave,getMySalarySlips,updateAgentProfile,
} from "../controllers/marketingAgentController.js";


import { protectAgent, requireAgentPermission,} from "../middleware/authMiddleware.js";


const router = express.Router();

// Public
router.post("/register", registerAgent);
router.post("/login",    loginAgent);

// Protected
router.use(protectAgent);

router.get("/profile", requireAgentPermission("profile"), getAgentProfile);
router.patch("/profile", requireAgentPermission("profile"), updateAgentProfile);
 
router.get("/profile-with-job",  getAgentProfileWithJob);
router.get("/job-requirements", requireAgentPermission("jobActivity"), getJobRequirements);
router.post("/start-job", requireAgentPermission("jobActivity"), startJob);
router.get("/job-status", requireAgentPermission("jobActivity"), getJobStatus);
router.post("/location/update", requireAgentPermission("geoTracking"), updateLiveLocation);
router.post("/close-job", requireAgentPermission("jobActivity"), closeJob);
router.post("/job/save", requireAgentPermission("jobActivity"), saveJobDetails);
router.get("/job-history", requireAgentPermission("jobActivity"), getJobHistory);


router.post("/leads-crm", requireAgentPermission("leads"), createLead);
router.get("/leads-crm", requireAgentPermission("leads"), getLeads);
router.put("/leads-crm/:id", requireAgentPermission("leads"), updateLead);
router.delete("/leads-crm/:id", requireAgentPermission("leads"), deleteLead);
router.patch("/leads-crm/:id/stage", requireAgentPermission("leads"), updateLeadStage);
router.get("/leads", requireAgentPermission("leads"), getCompletedLeads);
router.get("/products", requireAgentPermission("products"), getAgentProducts);

router.post("/responses", requireAgentPermission("responses"), saveResponse);
router.get("/responses", requireAgentPermission("responses"), getResponses);

router.get("/work-performance", requireAgentPermission("workPerformance"), getWorkPerformance);
router.get("/all-mr-performance", requireAgentPermission("reports"), getAllMRPerformance);
router.get("/visual-ads", requireAgentPermission("visualAds"), getAgentVisualAds);

router.get("/staff", requireAgentPermission("staff"), getAllStaff);
router.post("/staff", requireAgentPermission("staff"), createStaff);
router.put("/staff/:id", requireAgentPermission("staff"), updateStaff);
router.delete("/staff/:id", requireAgentPermission("staff"), deleteStaff);


router.post("/support/tickets", requireAgentPermission("support"), createSupportTicket);
router.get("/support/tickets", requireAgentPermission("support"), getSupportTickets);
router.patch("/support/tickets/:id/status", requireAgentPermission("support"), updateTicketStatus);

router.post("/support/workflows", requireAgentPermission("support"), createWorkflow);
router.get("/support/workflows", requireAgentPermission("support"), getWorkflows);
router.patch("/support/workflows/:id/stage", requireAgentPermission("support"), updateWorkflowStage);


router.get("/my-id-card",     getMyIdCard);       
router.get("/leaves",         getMyLeaves);        
router.post("/leaves",        applyLeave);       
router.get("/salary-slips",   getMySalarySlips);  

export default router;