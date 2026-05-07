// backend/models/calendarEvent.js
import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, "Title is required"],
      trim:      true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    type: {
      type:    String,
      // Open-ended: allows "meeting","launch","training","event","deadline","follow_up"
      // and any custom string saved by the admin
      trim:    true,
      default: "event",
    },
    date: {
      type:     String,
      required: [true, "Date is required"],
      match:    [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default:   "",
    },
    isAdminCreated: {
      type:    Boolean,
      default: false,
    },
    isPinned: {
      type:    Boolean,
      default: false,
    },
    followUpId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "FollowUp",
      default: null,
    },
    createdBy: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

calendarEventSchema.index({ date: 1 });
calendarEventSchema.index({ isAdminCreated: 1 });

const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);
export default CalendarEvent;