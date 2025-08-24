import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import sequelize from "./src/config/database.js";
import redis from "./src/config/redis.js";
import routes from "./src/routes/index.js";
import {
  errorHandler,
  notFoundHandler,
  handleUnhandledRejections,
  handleUncaughtExceptions,
} from "./src/utils/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Handle unhandled rejections and exceptions
handleUnhandledRejections();
handleUncaughtExceptions();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set("trust proxy", 1);

// Routes
app.use("/api", routes);

// 404 handler for non-API routes
// app.use('*', notFoundHandler);

// Global error handling
app.use(errorHandler);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    await sequelize.sync();
    console.log("✅ Tables synchronized succesfully");

    // Connect Redis
    await redis.connect();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
