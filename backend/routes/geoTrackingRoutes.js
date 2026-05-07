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
import { protectAgent } from "../middleware/marketingAgenTauthMiddleware.js";
import { placesAutocomplete, placeDetails } from "../controllers/placesProxyController.js";

const router = express.Router();

router.get("/history",             protectAgent, getHistory);
router.get("/:date",               protectAgent, getTracking);
router.patch("/:date/toggle",      protectAgent, toggleTracking);
router.post("/:date/checkin",      protectAgent, checkIn);
router.post("/:date/checkout",     protectAgent, checkOut);
router.post("/:date/visit",        protectAgent, addVisit);
router.patch("/:date/visit/:visitId/verify", protectAgent, verifyVisit);
router.delete("/:date/visit/:visitId",       protectAgent, deleteVisit);
router.post("/:date/location",     protectAgent, pushLocation);
router.get("/places-autocomplete", protectAgent, placesAutocomplete);
router.get("/place-details",       protectAgent, placeDetails);

export default router;