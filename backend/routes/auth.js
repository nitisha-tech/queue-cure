const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (role === "admin") {
      return res.status(403).json({ message: "Cannot register as admin" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const status = role === "receptionist" ? "pending" : "approved";
    const user = await User.create({ name, email, password, role, status });

    if (role === "receptionist") {
      return res.status(201).json({ message: "Account created. Awaiting admin approval." });
    }

    return res.status(201).json({
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials or role" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role === "receptionist" && user.status !== "approved") {
      return res.status(403).json({ message: "Your account is pending admin approval" });
    }

    return res.json({
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;