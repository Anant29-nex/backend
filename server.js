// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

/**
 * CORS — allow local dev + your Vercel domain.
 * 👉 Replace the Vercel URL below with your actual one.
 */
const allowedOrigins = [
  "http://localhost:3000",
  "https://frontend-two-fawn-23.vercel.app", // ⬅️ your Vercel URL
];

app.use(
  cors({
    origin(origin, cb) {
      // allow non-browser tools (like curl) with no origin
      if (!origin) return cb(null, true);
      return allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// Health checks (useful for Render)
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "api", ts: Date.now() })
);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`🚀 Server on :${port}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
