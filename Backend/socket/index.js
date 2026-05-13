import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { corsOriginHandler } from "../utils/cors.js";
import { registerRoomSocket } from "./room.socket.js";
import { registerCodeSyncSocket } from "./codeSync.socket.js";
import { registerCursorSocket } from "./cursor.socket.js";
import { registerChatSocket } from "./chat.socket.js";
import { setSocketIo } from "./ioInstance.js";

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required. No token provided."));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    socket.user = decoded;
    return next();
  } catch (_error) {
    return next(new Error("Unauthorized: Invalid or expired token"));
  }
};

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOriginHandler,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  setSocketIo(io);

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    registerRoomSocket(io, socket);
    registerCodeSyncSocket(io, socket);
    registerCursorSocket(socket);
    registerChatSocket(io, socket);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
