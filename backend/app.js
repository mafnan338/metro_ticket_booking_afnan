import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import stationRoutes from "./routes/stationRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { chatbotConfigured } from "./services/chatService.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
if (allowedOrigins.includes("http://localhost:5173"))
  allowedOrigins.push("http://127.0.0.1:5173");

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) =>
      cb(null, !origin || allowedOrigins.includes(origin)),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json({ limit: "20kb" }));
app.use("/api", apiLimiter);

app.use("/api/stations", stationRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected (in-memory fallback)",
    chatbot: chatbotConfigured() ? "configured" : "not configured",
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    timestamp: new Date().toISOString(),
  }),
);

app.use("/api", (req, res) =>
  res
    .status(404)
    .json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    }),
);

app.use((err, req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, error: "Invalid JSON body" });
  }
  console.error("Unhandled error:", err.message);
  res.status(500).json({ success: false, error: "Internal server error" });
});

export default app;
