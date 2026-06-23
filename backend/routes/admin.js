// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { protect, requireRole } = require("../middleware/authMiddleware");

// GET /api/admin/pending
router.get("/pending", protect, requireRole("admin"), async (req, res) => {
  try {
    const pending = await User.find({
      role: "receptionist",
      status: "pending",
    }).select("-password");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/approve/:id
router.patch("/approve/:id", protect, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Receptionist approved", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/reject/:id
router.delete("/reject/:id", protect, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Receptionist rejected and removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/activity-log
router.get("/activity-log", protect, requireRole("admin"), async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;