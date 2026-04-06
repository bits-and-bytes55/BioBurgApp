import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  pincode: String,
  state: String,
  city: String,
  house: String,
  landmark: String,
});

const prescriptionSchema = new mongoose.Schema({
  url: String,
  createdAt: { type: Date, default: Date.now },
});


const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    name: { type: String, required: true },
    lastname: { type: String },
    gender: { type: String, required: true, enum: ["male", "female", "other"] },
    address: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isBlocked:  { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    role: {
      type: String,
      enum: [
        "customer",      
        "b2b",        
        "hospital",    
        "pharmacy",      
        "wholesale",    
        "vendor",       
        "franchise",     
        "manufacturer", 
      ],
      default: "customer",
    },

    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    prescriptions: [prescriptionSchema],
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Compare password
UserSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", UserSchema);