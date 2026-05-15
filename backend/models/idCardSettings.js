import mongoose from "mongoose";

const idCardSettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "BIOBURG LIFESCIENCES" },
    subtitle: { type: String, default: "PHARMACEUTICALS DISTRIBUTOR" },

    frontLogo: { type: String },
    frontLogoPublicId: { type: String },

    backLogo: { type: String },
    backLogoPublicId: { type: String },

    authorityStamp: { type: String },
    authorityStampPublicId: { type: String },

    cardColors: {
      teal: { type: String, default: "#26bfbf" },
      yellow: { type: String, default: "#f5c012" },
      navy: { type: String, default: "#0d3d5e" },
      nameColor: { type: String, default: "#1a3a6e" },
      designationColor: { type: String, default: "#cc2200" },
    },

    mottoTitle: { type: String, default: "Motto Of Bioburg" },
    mottos: {
      type: [String],
      default: [
        "Nothing Beyond Our Products",
        "Bio Burg Helping Peoples",
        "Our Challenge Is Life Sciences",
        "Biosciences, Research & Development",
      ],
    },

    termsTitle: { type: String, default: "Terms And Conditions:-" },
    termsText: {
      type: String,
      default:
        'This Card is not transferable. It is the property of the "Bioburg Lifesciences" and is to be returned to the issuing authority on cessation of the service.',
    },

    returnTitle: { type: String, default: "If Found Please Return it to" },
    addressLine1: { type: String, default: "B-119, 2nd Floor, Lane No-7, Laxmi Vihar," },
    addressLine2: { type: String, default: "Mohan Garden, Dwarka Mor, New Delhi-110059." },
    email: { type: String, default: "bioburg.lifesciences@yahoo.com" },
    phone: { type: String, default: "9990719273, 9868013337, 6005459761" },
    website: { type: String, default: "https://www.bioburglifesciences.com" },
    footerNote: {
      type: String,
      default: "Display the Security Pass at all times while outside BIOBURG Premises",
    },
  },
  { timestamps: true }
);

const IDCardSettings = mongoose.model("IDCardSettings", idCardSettingsSchema);
export default IDCardSettings;
