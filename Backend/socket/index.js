import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { corsOriginHandler } from "../utils/cors.js";
import { registerRoomSocket } from "./room.socket.js";
import { registerCodeSyncSocket } from "./codeSync.socket.js";
import { registerCursorSocket } from "./cursor.socket.js";
import { registerChatSocket } from "./chat.socket.js";

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    socket.user = decoded;
    return next();
  } catch (_error) {
    return next(new Error("Unauthorized socket connection"));
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

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    registerRoomSocket(io, socket);
    registerCodeSyncSocket(socket);
    registerCursorSocket(socket);
    registerChatSocket(io, socket);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
