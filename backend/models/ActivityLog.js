
// backend/models/ActivityLog.js
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    receptionistId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receptionistName: { type: String },
    action: {
      type: String,
      enum: ["accepted", "rejected", "called_next", "set_avg_time"],
    },
    patientName: { type: String, default: null },
    tokenNumber: { type: Number, default: null },
    value: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);