const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

let sessions = {};
let attendance = {};

app.get("/", (req, res) => {
  res.send("Smart Attendance Backend Running");
});

// Generate QR session
app.post("/generate", async (req, res) => {
  const sessionId = uuidv4();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  sessions[sessionId] = { expiresAt };
  attendance[sessionId] = [];

  const qr = await QRCode.toDataURL(sessionId);

  res.json({ sessionId, qr });
});

// Student scan
app.post("/scan", (req, res) => {
  const { sessionId, student } = req.body;

  if (!sessions[sessionId])
    return res.status(400).json({ message: "Invalid session" });

  if (Date.now() > sessions[sessionId].expiresAt)
    return res.status(400).json({ message: "Session expired" });

  if (attendance[sessionId].includes(student))
    return res.status(400).json({ message: "Already marked" });

  attendance[sessionId].push(student);

  res.json({ message: "Attendance recorded" });
});

// Get attendance
app.get("/attendance/:sessionId", (req, res) => {
  res.json(attendance[req.params.sessionId] || []);
});

app.listen(3000, () => console.log("Server running on port 3000"));
app.get("/attendance", (req, res) => {
    res.json(attendance);
});
  
