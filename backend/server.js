const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// Store sessions and attendance
let sessions = {};      // { sessionId: { expiresAt: timestamp } }
let attendance = {};    // { sessionId: [{ student, time }] }

// Test endpoint
app.get("/", (req, res) => {
  res.send("Smart Attendance Backend Running");
});

// Generate new QR session
app.post("/generate", async (req, res) => {
  const sessionId = uuidv4();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  // Save session and empty attendance array
  sessions[sessionId] = { expiresAt };
  attendance[sessionId] = [];

  // Generate QR code for session ID
  const qr = await QRCode.toDataURL(sessionId);

  res.json({ sessionId, qr });
});

// Student scans QR
app.post("/scan", (req, res) => {
  const { sessionId, student } = req.body;

  if (!sessions[sessionId]) {
    return res.status(400).json({ message: "Invalid session" });
  }

  if (Date.now() > sessions[sessionId].expiresAt) {
    return res.status(400).json({ message: "Session expired" });
  }

  // Prevent duplicate entries for this session
  const alreadyMarked = attendance[sessionId].find(
    (s) => s.student === student
  );

  if (alreadyMarked) {
    return res.status(400).json({ message: "Already marked" });
  }

  // Record attendance with timestamp
  const time = new Date().toLocaleTimeString();
  attendance[sessionId].push({ student, time });

  res.json({ message: "Attendance recorded" });
});

// Get attendance for a specific session
app.get("/attendance/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  res.json(attendance[sessionId] || []);
});

// Optional: get all sessions attendance (for debugging)
app.get("/attendance", (req, res) => {
  res.json(attendance);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
