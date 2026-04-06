import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    patientAge: String,
    patientGender: String,

    diagnosis: String,

    medicines: [
      {
        name: String,
        dosage: String,
        duration: String,
      },
    ],

    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", prescriptionSchema);
