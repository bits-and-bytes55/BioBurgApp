import "../config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import Zone from "../models/Zone.js";
import Franchise from "../models/Franchise.js";
import FranchiseAccount from "../models/FranchiseAccount.js";

const DEMO_EMAIL = process.env.DEMO_FRANCHISE_EMAIL || "demo.franchise@bioburg.test";
const DEMO_PASSWORD =
  process.env.DEMO_FRANCHISE_PASSWORD || "Demo@12345";
const DEMO_ZONE_NAME =
  process.env.DEMO_FRANCHISE_ZONE_NAME || "Demo Franchise Zone";
const DEMO_PINCODES = String(
  process.env.DEMO_FRANCHISE_PINCODES || "000001,000002"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const SEED_NOTE = "DEMO_FRANCHISE_SEED";

const pushIfMissing = (collection, entry, predicate) => {
  if (!Array.isArray(collection)) {
    return [entry];
  }

  if (collection.some(predicate)) {
    return collection;
  }

  return [...collection, entry];
};

const upsertZone = async () => {
  const zone = await Zone.findOneAndUpdate(
    { name: DEMO_ZONE_NAME },
    {
      name: DEMO_ZONE_NAME,
      pincodes: DEMO_PINCODES,
      status: "ACTIVE",
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return zone;
};

const upsertApplication = async (zone) => {
  const existingApplication = await Franchise.findOne({
    email: DEMO_EMAIL,
    comments: SEED_NOTE,
  });

  const lifecycleNote = {
    action: "DEMO_SEED",
    note: "Demo franchise profile created for QA login verification.",
    actor: "seed-script",
  };

  const zoneHistoryEntry = {
    zoneId: zone._id,
    zoneName: zone.name,
    action: "ZONE_ASSIGNED",
    note: "Assigned by demo seed script",
    assignedBy: "seed-script",
  };

  const application = existingApplication || new Franchise();

  application.fullName = "Demo Franchise Partner";
  application.gender = "Prefer not to say";
  application.dob = "1995-01-01";
  application.mobile = "9999999999";
  application.email = DEMO_EMAIL;
  application.isDoctor = "No";
  application.pathyExpertise = "";
  application.patientsPerDay = "0";
  application.agreementRating = "5";
  application.additionalSupport = ["Marketing", "Inventory planning"];
  application.otherSupportText = "";
  application.similarBusiness = "Retail and pharmacy operations";
  application.concerns = ["ROI clarity"];
  application.otherConcernText = "";
  application.challenges = ["Hiring staff"];
  application.otherChallengeText = "";
  application.investmentBandwidth = "10-15 Lakhs";
  application.franchiseModel = "Standard retail franchise";
  application.investmentTimeline = "Immediately";
  application.roiExpectation = "12-18 months";
  application.investingCapacity = "Self funded";
  application.multipleFranchises = "No";
  application.numberOfStores = "1";
  application.appealingAspects = ["Brand support", "Healthcare category"];
  application.otherAppealingText = "";
  application.nearbyPharmacy = "2 demo competitor stores nearby";
  application.whyBioburg = "Seeded demo profile for QA verification.";
  application.legalDisputes = "No";
  application.citiesOfInterest = "New Delhi";
  application.locality = "Connaught Place";
  application.marketConnect = "Existing local business network";
  application.locationType = "High street";
  application.comments = SEED_NOTE;
  application.documents = application.documents || {};
  application.kycStatus = "VERIFIED";
  application.kycNotes = "Auto-verified by demo seed script";
  application.rejectionReason = "";
  application.status = "APPROVED";
  application.zoneId = zone._id;
  application.lifecycleNotes = pushIfMissing(
    application.lifecycleNotes,
    lifecycleNote,
    (entry) => entry?.action === lifecycleNote.action && entry?.actor === lifecycleNote.actor
  );
  application.zoneHistory = pushIfMissing(
    application.zoneHistory,
    zoneHistoryEntry,
    (entry) =>
      String(entry?.zoneId || "") === String(zone._id) &&
      entry?.action === zoneHistoryEntry.action &&
      entry?.assignedBy === zoneHistoryEntry.assignedBy
  );

  await application.save();
  return application;
};

const upsertAccount = async (application, zone) => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const account = await FranchiseAccount.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      franchiseApplicationId: application._id,
      email: DEMO_EMAIL,
      password: passwordHash,
      role: "FRANCHISE",
      zoneId: zone._id,
      status: "ACTIVE",
      settlementConfig: {
        commissionRate: 12,
        settlementHoldDays: 7,
        minimumPayoutAmount: 0,
        settlementNotes: "Default demo configuration",
        lastUpdatedAt: new Date(),
      },
      createdAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return account;
};

const main = async () => {
  await connectDB();

  const zone = await upsertZone();
  const application = await upsertApplication(zone);
  const account = await upsertAccount(application, zone);

  console.log("Dummy franchise ready");
  console.log(`Email: ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log(`Zone: ${zone.name}`);
  console.log(`Login URL: /franchise/login`);
  console.log(`Account ID: ${account._id.toString()}`);
  console.log(`Application ID: ${application._id.toString()}`);
};

main()
  .catch((error) => {
    console.error("Failed to seed dummy franchise:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
