import { RoomModel } from "../Models/room.js";
import { logger } from "../utils/logger.js";

const normalizeRoomId = (roomId = "") => roomId.trim().toUpperCase();

export const registerCodeSyncSocket = (socket) => {
  socket.on("CODE_CHANGE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        return;
      }

      const update = {};

      if (typeof payload.code === "string") {
        update.code = payload.code;
      }

      if (payload.language) {
        update.language = String(payload.language).toLowerCase();
      }

      if (Object.keys(update).length > 0) {
        await RoomModel.findOneAndUpdate(
          { roomId },
          { $set: update },
          { new: true }
        );
      }

      socket.to(roomId).emit("CODE_UPDATE", {
        roomId,
        code: payload.code,
        language: payload.language,
        userId: payload.userId,
        userName: payload.userName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("CODE_CHANGE failed", error);
    }
  });
};
