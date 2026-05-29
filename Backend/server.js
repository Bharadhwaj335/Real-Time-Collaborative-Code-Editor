import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { connectDB } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import roomRoutes from "./routes/room.routes.js";
import messageRoutes from "./routes/message.routes.js";
import codeRoutes from "./routes/code.routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";
import { initializeSocket } from "./socket/index.js";
import { logger } from "./utils/logger.js";
import { corsOriginHandler } from "./utils/cors.js";
import { globalRateLimiter } from "./middlewares/rateLimiter.js";


const app = express();
const httpServer = createServer(app);

// Enable trust proxy for safe IP detection behind reverse proxies
app.set("trust proxy", 1);

// Mount helmet for essential security headers and mount cookieParser
app.use(helmet());
app.use(cookieParser());

// Apply global rate limiting
app.use(globalRateLimiter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

httpServer.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    logger.error(
      `Port ${env.port} is already in use. Stop the existing process or change PORT in Backend/.env.`
    );
    process.exit(1);
    return;
  }

  logger.error("HTTP server error", error);
  process.exit(1);
});

app.use(
  cors({
    origin: corsOriginHandler,
    credentials: true,
  })
);

// Request size limits to prevent abuse
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ limit: "500kb", extended: true }));

// Add request timeout
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  next();
});

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "Real-Time Collaborative Code Editor API is running." });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

// Secure static uploads serving with sandboxing and extension whitelisting
app.use(
  "/uploads",
  (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
    if (!allowedExtensions.has(ext)) {
      return res.status(403).json({ success: false, message: "Forbidden: Invalid file extension." });
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/code", codeRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

initializeSocket(httpServer);

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    httpServer.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();