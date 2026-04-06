import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import BulkManufacturingAccount from "../models/BulkManufacturingAccount.js";
import BulkManufacturingRequest from "../models/BulkManufacturingRequest.js";
import Franchise from "../models/Franchise.js";
import FranchiseAccount from "../models/FranchiseAccount.js";
import Manufacturer from "../models/Manufacturer.js";
import Zone from "../models/Zone.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DEMO_PASSWORD = "Demo@12345";
const FRANCHISE_EMAIL = "demo.franchise@bioburg.test";
const BULK_EMAIL = "demo.bulk@bioburg.test";
const BULK_USERNAME = "demo.bulk";
const MANUFACTURER_EMAIL = "demo.manufacturer@bioburg.test";
const MANUFACTURER_USERNAME = "demo.manufacturer";
const DEMO_ZONE_NAME = "Demo Franchise Zone";

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
};

const ensureZone = async () =>
  Zone.findOneAndUpdate(
    { name: DEMO_ZONE_NAME },
    {
      $set: {
        name: DEMO_ZONE_NAME,
        status: "ACTIVE",
      },
      $setOnInsert: {
        pincodes: ["000000"],
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

const ensureFranchiseDemo = async (passwordHash, zone) => {
  const franchiseApplication = await Franchise.findOneAndUpdate(
    { email: FRANCHISE_EMAIL },
    {
      $set: {
        fullName: "Demo Franchise Partner",
        email: FRANCHISE_EMAIL,
        mobile: "9999999991",
        citiesOfInterest: "Demo City",
        locality: "Demo Market",
        whyBioburg: "Demo franchise testing account",
        marketConnect: "Yes",
        locationType: "In My Own Space",
        investmentBandwidth: "INR 25-50 Lakhs",
        franchiseModel: "FOFO",
        status: "APPROVED",
        zoneId: zone._id,
        kycStatus: "VERIFIED",
      },
      $push: {
        zoneHistory: {
          zoneId: zone._id,
          zoneName: zone.name,
          action: "SEEDED",
          note: "Demo franchise account seeded",
          assignedBy: "Seed Script",
        },
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

  const franchiseAccount = await FranchiseAccount.findOneAndUpdate(
    { email: FRANCHISE_EMAIL },
    {
      $set: {
        franchiseApplicationId: franchiseApplication._id,
        email: FRANCHISE_EMAIL,
        password: passwordHash,
        role: "FRANCHISE",
        zoneId: zone._id,
        status: "ACTIVE",
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

  return { franchiseApplication, franchiseAccount };
};

const ensureBulkDemo = async (passwordHash) => {
  const request = await BulkManufacturingRequest.findOneAndUpdate(
    { email: BULK_EMAIL },
    {
      $set: {
        fullName: "Demo Bulk Manufacturing Partner",
        mobile: "9999999992",
        designation: "Procurement Head",
        email: BULK_EMAIL,
        whatsapp: "9999999992",
        companyName: "Demo Bulk Manufacturing Co",
        country: "India",
        orgType: "Pharmaceutical Manufacturer",
        yearEst: "2020",
        website: "https://example.com",
        importLicenseNum: "DEMO-IMPORT-001",
        taxId: "DEMO-TAX-001",
        products: "Vitamin C 500mg Tablets",
        quantity: "10000",
        destinationCountry: "India",
        port: "Delhi",
        purpose: "Commercial Trade",
        storageReq: "Room temperature",
        shippingMethod: "Air Freight",
        customsBroker: "Demo Broker",
        customsAssist: "No",
        paymentMethod: "SWIFT Transfer",
        currency: "INR",
        requestedUsername: BULK_USERNAME,
        status: "APPROVED",
        documentReviewStatus: "VERIFIED",
        approvedAt: new Date(),
        approvedBy: "Seed Script",
      },
      $setOnInsert: {
        statusHistory: [
          {
            status: "APPROVED",
            note: "Demo bulk account seeded",
            actor: "Seed Script",
          },
        ],
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

  const account = await BulkManufacturingAccount.findOneAndUpdate(
    { email: BULK_EMAIL },
    {
      $set: {
        requestId: request._id,
        username: BULK_USERNAME,
        email: BULK_EMAIL,
        password: passwordHash,
        role: "BULK_MANUFACTURER",
        status: "ACTIVE",
        companyName: "Demo Bulk Manufacturing Co",
        contactName: "Demo Bulk Manufacturing Partner",
        designation: "Procurement Head",
        mobile: "9999999992",
        whatsapp: "9999999992",
        country: "India",
        website: "https://example.com",
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

  request.accountId = account._id;
  await request.save();

  return { request, account };
};

const ensureManufacturerDemo = async (passwordHash) =>
  Manufacturer.findOneAndUpdate(
    { officialEmail: MANUFACTURER_EMAIL },
    {
      $set: {
        fullName: "Demo Manufacturer Partner",
        gender: "Male",
        dob: "1990-01-01",
        personalMobile: "9999999993",
        companyName: "Demo Manufacturer Labs",
        companyType: "Pharmaceutical Manufacturer",
        yearEst: "2018",
        corpRegNum: "DEMO-MFG-001",
        headOfficeAddress: "Demo Head Office, India",
        factoryAddress: "Demo Factory Address, India",
        officialEmail: MANUFACTURER_EMAIL,
        officialContact: "9999999993",
        username: MANUFACTURER_USERNAME,
        authName: "Demo Manufacturer Partner",
        authDesignation: "Director",
        authMobile: "9999999993",
        authEmail: MANUFACTURER_EMAIL,
        password: passwordHash,
        productTypes: ["Tablets", "Capsules"],
        productionCapacity: "50000 units / month",
        licenseNumber: "MFG-LIC-001",
        qualityCerts: ["GMP", "WHO-GMP"],
        mfgAccepted: ["Third Party Manufacturing", "Bulk Manufacturing Supply"],
        moq: "1000",
        businessTerms: "Standard payment cycle",
        bankName: "Demo Bank",
        accountHolder: "Demo Manufacturer Labs",
        accountNumber: "1234567890",
        ifscCode: "DEMO0001234",
        paymentMethod: "Bank Transfer",
        isVerified: true,
        applicationStatus: "APPROVED",
        documentReviewStatus: "VERIFIED",
        accountStatus: "ACTIVE",
        reviewNotes: "Demo manufacturer account seeded",
        rejectionReason: "",
      },
      $setOnInsert: {
        documents: {},
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

const main = async () => {
  await connect();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const zone = await ensureZone();
  const franchise = await ensureFranchiseDemo(passwordHash, zone);
  const bulk = await ensureBulkDemo(passwordHash);
  const manufacturer = await ensureManufacturerDemo(passwordHash);

  console.log(
    JSON.stringify(
      {
        franchise: {
          email: FRANCHISE_EMAIL,
          password: DEMO_PASSWORD,
          zone: zone.name,
          accountId: franchise.franchiseAccount._id.toString(),
        },
        bulkManufacturing: {
          email: BULK_EMAIL,
          username: BULK_USERNAME,
          password: DEMO_PASSWORD,
          accountId: bulk.account._id.toString(),
        },
        manufacturer: {
          email: MANUFACTURER_EMAIL,
          username: MANUFACTURER_USERNAME,
          password: DEMO_PASSWORD,
          accountId: manufacturer._id.toString(),
        },
      },
      null,
      2,
    ),
  );
};

main()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error("Failed to ensure demo partner accounts:", error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
