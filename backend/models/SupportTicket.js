import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FranchiseAccount",
      required: true
    },

    subject: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: ["ORDER", "PAYMENT", "INVENTORY", "TECHNICAL", "OTHER"],
      default: "OTHER"
    },

    message: {
      type: String,
      required: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },

    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN"
    },

    replies: [
      {
        sender: {
          type: String, // ADMIN / FRANCHISE
          enum: ["ADMIN", "FRANCHISE"]
        },
        message: String,
        time: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

/* THIS LINE WAS MISSING */
export default mongoose.model("SupportTicket", supportTicketSchema);
