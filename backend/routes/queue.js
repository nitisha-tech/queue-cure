// backend/routes/queue.js
const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const QueueState = require("../models/QueueState");
const ActivityLog = require("../models/ActivityLog");
const { protect, requireRole, requireApproved } = require("../middleware/authMiddleware");

const emitQueueUpdate = async (io) => {
  const queueState = await QueueState.getInstance();
  const waitingPatients = await Patient.find({ status: "waiting" }).sort("tokenNumber");
  const pendingPatients = await Patient.find({ status: "pending" }).sort("createdAt");
  const activityLog = await ActivityLog.find().sort({ createdAt: -1 }).limit(50);

  const waitingWithAhead = waitingPatients.map((p, i) => ({
    _id: p._id,
    name: p.name,
    tokenNumber: p.tokenNumber,
    status: p.status,
    tokensAhead: i,
  }));

  io.emit("queue:update", {
    queueState: {
      currentToken: queueState.currentToken,
      avgConsultTime: queueState.avgConsultTime,
    },
    waitingPatients: waitingWithAhead,
    pendingPatients: pendingPatients.map((p) => ({
      _id: p._id,
      name: p.name,
      reason: p.reason,
      createdAt: p.createdAt,
    })),
    activityLog,
  });
};

// POST /api/queue/join
router.post("/join", protect, requireRole("patient"), async (req, res) => {
  try {
    const { name, reason } = req.body;

    const existing = await Patient.findOne({
      userId: req.user._id,
      status: { $in: ["pending", "waiting", "serving"] },
    });

    if (existing) {
      return res.status(400).json({ message: "You already have an active queue request" });
    }

    const patient = await Patient.create({
      userId: req.user._id,
      name,
      reason,
      status: "pending",
    });

    const io = req.app.get("io");
    await emitQueueUpdate(io);

    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/queue/pending
router.get("/pending", protect, requireRole("receptionist"), requireApproved, async (req, res) => {
  try {
    const pending = await Patient.find({ status: "pending" }).sort("createdAt");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/queue/state
router.get("/state", protect, async (req, res) => {
  try {
    const queueState = await QueueState.getInstance();
    const waitingPatients = await Patient.find({ status: "waiting" }).sort("tokenNumber");

    const waitingWithAhead = waitingPatients.map((p, i) => ({
      _id: p._id,
      name: p.name,
      tokenNumber: p.tokenNumber,
      status: p.status,
      tokensAhead: i,
    }));

    res.json({
      currentToken: queueState.currentToken,
      avgConsultTime: queueState.avgConsultTime,
      waitingPatients: waitingWithAhead,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/queue/my-status
router.get("/my-status", protect, requireRole("patient"), async (req, res) => {
  try {
    const patient = await Patient.findOne({
      userId: req.user._id,
      status: { $in: ["pending", "waiting", "serving"] },
    });

    if (!patient) {
      return res.status(404).json({ message: "No active queue entry found" });
    }

    const queueState = await QueueState.getInstance();
    const waitingPatients = await Patient.find({ status: "waiting" }).sort("tokenNumber");

    const myIndex = waitingPatients.findIndex(
      (p) => p._id.toString() === patient._id.toString()
    );

    res.json({
      _id: patient._id,
      name: patient.name,
      reason: patient.reason,
      tokenNumber: patient.tokenNumber,
      status: patient.status,
      tokensAhead: myIndex >= 0 ? myIndex : 0,
      currentToken: queueState.currentToken,
      avgConsultTime: queueState.avgConsultTime,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/queue/accept/:id
router.patch("/accept/:id", protect, requireRole("receptionist"), requireApproved, async (req, res) => {
  try {
    const queueState = await QueueState.getInstance();
    queueState.lastTokenNumber += 1;
    await queueState.save();

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: "waiting", tokenNumber: queueState.lastTokenNumber },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Log the action
    await ActivityLog.create({
      receptionistId: req.user._id,
      receptionistName: req.user.name,
      action: "accepted",
      patientName: patient.name,
      tokenNumber: patient.tokenNumber,
    });

    const io = req.app.get("io");
    await emitQueueUpdate(io);

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/queue/reject/:id
router.patch("/reject/:id", protect, requireRole("receptionist"), requireApproved, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Log the action
    await ActivityLog.create({
      receptionistId: req.user._id,
      receptionistName: req.user.name,
      action: "rejected",
      patientName: patient.name,
    });

    const io = req.app.get("io");
    await emitQueueUpdate(io);

    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/queue/call-next
router.patch("/call-next", protect, requireRole("receptionist"), requireApproved, async (req, res) => {
  try {
    const queueState = await QueueState.getInstance();

    if (queueState.currentToken) {
      await Patient.findOneAndUpdate(
        { tokenNumber: queueState.currentToken, status: "serving" },
        { status: "done" }
      );
    }

    const nextPatient = await Patient.findOne({ status: "waiting" }).sort("tokenNumber");

    if (!nextPatient) {
      queueState.currentToken = null;
      await queueState.save();

      await ActivityLog.create({
        receptionistId: req.user._id,
        receptionistName: req.user.name,
        action: "called_next",
        tokenNumber: null,
      });

      const io = req.app.get("io");
      await emitQueueUpdate(io);
      return res.json({ message: "Queue is empty", currentToken: null });
    }

    nextPatient.status = "serving";
    await nextPatient.save();

    queueState.currentToken = nextPatient.tokenNumber;
    await queueState.save();

    // Log the action
    await ActivityLog.create({
      receptionistId: req.user._id,
      receptionistName: req.user.name,
      action: "called_next",
      tokenNumber: nextPatient.tokenNumber,
    });

    const io = req.app.get("io");
    await emitQueueUpdate(io);

    res.json({ message: "Next token called", currentToken: nextPatient.tokenNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/queue/avg-time
router.patch("/avg-time", protect, requireRole("receptionist"), requireApproved, async (req, res) => {
  try {
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({ message: "Invalid time value" });
    }

    const queueState = await QueueState.getInstance();
    queueState.avgConsultTime = minutes;
    await queueState.save();

    // Log the action
    await ActivityLog.create({
      receptionistId: req.user._id,
      receptionistName: req.user.name,
      action: "set_avg_time",
      value: String(minutes),
    });

    const io = req.app.get("io");
    await emitQueueUpdate(io);

    res.json({ message: "Average time updated", avgConsultTime: minutes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;