
// backend/models/Patient.js
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    tokenNumber: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "waiting", "serving", "done", "rejected"],
      default: "pending",
    },
    tokensAhead: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);