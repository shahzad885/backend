import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import promBundle from "express-prom-bundle";
import { register } from "prom-client";

// Import new routes
import urlRoutes from "./routes/urls.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Prometheus metrics middleware
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { app: "url-shortener-backend" },
  promClient: { collectDefaultMetrics: {} },
});

app.use(metricsMiddleware);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Routes
// We mount this at /api/urls
app.use("/api/urls", urlRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "DevOps URL Shortener API is running" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});