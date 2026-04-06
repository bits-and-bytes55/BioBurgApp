import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPT_KEY || "01234567890123456789012345678901";

function encryptField(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptField(data) {
  if (!data) return "";
  try {
    const parts = data.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedText = parts.join(":");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

const vendorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  altPhone: { type: String },
  gender: { type: String},

  registrationType: { type: String },

  businessName: { type: String, required: true },
  businessType: { type: String},
  gstNumber: { type: String },
  panNumber: { type: String, set: encryptField, get: decryptField },

  drugLicenseNumber1: String,
  drugLicenseNumber2: String,
  drugLicenseNumber3: String,
  drugLicenseNumber4: String,
  

  address: String,
  city: String,
  state: String,
  pincode: String,

  // BANK ENCRYPTED
  accountHolderName: { type: String, set: encryptField, get: decryptField },
  accountNumber: { type: String, set: encryptField, get: decryptField },
  ifscCode: { type: String, set: encryptField, get: decryptField },
  branchName: { type: String, set: encryptField, get: decryptField },

  // DOCUMENTS
  gstCertificate: String,
  drugLicense1: String,
  drugLicense2: String,
  drugLicense3: String,
  drugLicense4: String,
  businessLogo: String,
  ownerPhoto:         String,
  ownerPhotoPublicId: { type: String, default: "" }, 
  pancard: String,
  additionalDocument: String,

  // NEW DOCUMENTS (MISSING EARLIER)
  aadharCard: String,
  voterId: String,
  educationCertificate: String,

  // SHOP PHOTOS
  shopPhoto1: String,
  shopPhoto2: String,
  shopPhoto3: String,
  shopPhoto4: String,
  shopPhoto5: String,
  shopVideo: String,

  isApproved: { type: Boolean, default: false },
  role: { type: String, default: "vendor" },

  createdAt: { type: Date, default: Date.now },
});


vendorSchema.set("toJSON", { getters: true });
vendorSchema.set("toObject", { getters: true });

vendorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

vendorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Vendor", vendorSchema);