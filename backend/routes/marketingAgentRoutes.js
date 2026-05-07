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


import { protectAgent } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.post("/register", registerAgent);
router.post("/login",    loginAgent);

// Protected
router.use(protectAgent);

router.get("/profile",           getAgentProfile);
router.patch("/profile",         updateAgentProfile);      
router.get("/profile-with-job",  getAgentProfileWithJob);
router.get("/job-requirements",  getJobRequirements);

router.post("/start-job",        startJob);
router.get("/job-status",        getJobStatus);
router.post("/location/update",  updateLiveLocation);
router.post("/close-job",        closeJob);
router.post("/job/save",         saveJobDetails);
router.get("/job-history",       getJobHistory);

router.post("/leads-crm",              createLead);
router.get("/leads-crm",               getLeads);
router.put("/leads-crm/:id",           updateLead);
router.delete("/leads-crm/:id",        deleteLead);
router.patch("/leads-crm/:id/stage",   updateLeadStage);
router.get("/leads",                   getCompletedLeads);
router.get("/products",                getAgentProducts);

router.post("/responses",   saveResponse);
router.get("/responses",    getResponses);

router.get("/work-performance",    getWorkPerformance);
router.get("/all-mr-performance",  getAllMRPerformance);
router.get("/visual-ads",          getAgentVisualAds);

router.get("/staff",        getAllStaff);
router.post("/staff",       createStaff);
router.put("/staff/:id",    updateStaff);
router.delete("/staff/:id", deleteStaff);

router.post("/support/tickets",              createSupportTicket);
router.get("/support/tickets",               getSupportTickets);
router.patch("/support/tickets/:id/status",  updateTicketStatus);

router.post("/support/workflows",             createWorkflow);
router.get("/support/workflows",              getWorkflows);
router.patch("/support/workflows/:id/stage",  updateWorkflowStage);

router.get("/my-id-card",     getMyIdCard);       
router.get("/leaves",         getMyLeaves);        
router.post("/leaves",        applyLeave);       
router.get("/salary-slips",   getMySalarySlips);  

export default router;