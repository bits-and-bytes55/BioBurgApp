// routes/geoTrackingRoutes.js
import express from "express";
import {
  getTracking,
  toggleTracking,
  checkIn,
  checkOut,
  addVisit,
  verifyVisit,
  deleteVisit,
  pushLocation,
  getHistory,
} from "../controllers/geoTrackingController.js";
import {
  protectAgent,
  requireAgentPermission,
} from "../middleware/authMiddleware.js";

import { placesAutocomplete, placeDetails } from "../controllers/placesProxyController.js";

const router = express.Router();

router.get("/history", protectAgent, requireAgentPermission("geoTracking"), getHistory);
router.get("/places-autocomplete", protectAgent, requireAgentPermission("geoTracking"), placesAutocomplete);
router.get("/place-details", protectAgent, requireAgentPermission("geoTracking"), placeDetails);
router.get("/:date", protectAgent, requireAgentPermission("geoTracking"), getTracking);
router.patch("/:date/toggle", protectAgent, requireAgentPermission("geoTracking"), toggleTracking);
router.post("/:date/checkin", protectAgent, requireAgentPermission("geoTracking"), checkIn);
router.post("/:date/checkout", protectAgent, requireAgentPermission("geoTracking"), checkOut);
router.post("/:date/visit", protectAgent, requireAgentPermission("geoTracking"), addVisit);
router.patch("/:date/visit/:visitId/verify", protectAgent, requireAgentPermission("geoTracking"), verifyVisit);
router.delete("/:date/visit/:visitId", protectAgent, requireAgentPermission("geoTracking"), deleteVisit);
router.post("/:date/location", protectAgent, requireAgentPermission("geoTracking"), pushLocation);


export default router;