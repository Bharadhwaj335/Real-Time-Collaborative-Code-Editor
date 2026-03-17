import express from "express";
import cors from "cors";
import { createServer } from "node:http";

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

const app = express();
const httpServer = createServer(app);

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
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

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