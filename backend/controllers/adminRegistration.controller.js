import UserRegister from "../models/User.js";
import BulkManufacturingRequest from "../models/BulkManufacturingRequest.js";
// import DirectManufacturing from "../models/DirectManufacturing.js";
import OnlineDoctor from "../models/doctors/Doctor.js";
import PathologyLab from "../models/LabTest.js";
// import RadiologyCenter from "../models/RadiologyCenter.js";
import PharmaManufacturer from "../models/Manufacturer.js";
import BioburgFranchise from "../models/Franchise.js";
import BioburgVendor from "../models/Vendor.js";
// import BioburgCF from "../models/BioburgCF.js";
import BioburgJeweler from "../models/bioburgJwelers.model.js";
// import SponsorPharmaBrand from "../models/SponsorPharmaBrand.js";
// import InsurancePartner from "../models/InsurancePartner.js";
// import AboardIndiaCF from "../models/AboardIndiaCF.js";
// import JobApplication from "../models/JobApplication.js";
// import ExServicemenJob from "../models/ExServicemenJob.js";

const modelMap = {
  "d2c-user": UserRegister,
  "bulk-manufacturing": BulkManufacturingRequest,
//   "direct-manufacturing": DirectManufacturing,
  "online-doctor": OnlineDoctor,
  "pathology-lab": PathologyLab,
//   "radiology-center": RadiologyCenter,
  "pharma-manufacturer": PharmaManufacturer,
  "franchise": BioburgFranchise,
  "vendor": BioburgVendor,
//   "cf": BioburgCF,
  "jeweler": BioburgJeweler,
//   "sponsor-brand": SponsorPharmaBrand,
//   "insurance": InsurancePartner,
//   "aboard-cf": AboardIndiaCF,
//   "job": JobApplication,
//   "ex-servicemen": ExServicemenJob
};


export const getRegistrations = async (req, res) => {
  const Model = modelMap[req.params.type];
  if (!Model) {
    return res.status(400).json({ message: "Invalid registration type" });
  }

  const data = await Model.find().sort({ createdAt: -1 });
  res.json({ success: true, data });
};

export const updateRegistrationStatus = async (req, res) => {
  const Model = modelMap[req.params.type];
  const { status } = req.body;

  if (!Model) return res.status(400).json({ message: "Invalid type" });

  await Model.findByIdAndUpdate(req.params.id, { status });
  res.json({ success: true, message: "Status updated" });
};
