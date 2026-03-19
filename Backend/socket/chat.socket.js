import { createMessage } from "../Controllers/message.controller.js";
import { logger } from "../utils/logger.js";

const normalizeRoomId = (roomId = "") => roomId.trim().toUpperCase();

export const registerChatSocket = (io, socket) => {
  socket.on("SEND_MESSAGE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");
      const senderId = payload.senderId || socket.user?.id || socket.id;
      const senderName = payload.senderName || socket.user?.name || "Collaborator";
      const text = (payload.text || "").trim();

      if (!roomId || !senderId || !text) {
        return;
      }

      const message = await createMessage({
        roomId,
        senderId,
        senderName,
        text,
      });

      io.to(roomId).emit("NEW_MESSAGE", {
        ...message,
        clientTempId: payload.clientTempId,
      });
    } catch (error) {
      logger.error("SEND_MESSAGE failed", error);
    }
  });

  socket.on("USER_TYPING", (payload = {}) => {
    const roomId = normalizeRoomId(payload.roomId || "");
    const userId = payload.userId || socket.user?.id || socket.id;

    if (!roomId || !userId) {
      return;
    }

    socket.to(roomId).emit("USER_TYPING", {
      roomId,
      userId,
      userName: payload.userName || socket.user?.name || "Collaborator",
      isTyping: Boolean(payload.isTyping),
      timestamp: new Date().toISOString(),
    });
  });
};
