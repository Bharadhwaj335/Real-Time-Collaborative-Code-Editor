import { RoomModel } from "../Models/room.js";
import { logger } from "../utils/logger.js";
import { getExtensionFromLanguage, normalizeLanguage } from "../utils/language.js";
import {
  normalizeRoomId,
  createFallbackFile,
  ensureRoomFiles,
} from "../utils/socketHelpers.js";

const roomUsersStore = new Map();
const socketMembershipStore = new Map();
const DEFAULT_MAX_PARTICIPANTS = 8;

const sanitizeUsername = (name = "") => {
  return String(name)
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s-]/g, "")
    .slice(0, 50)
    .trim();
};

const toClientUsers = (usersMap) => {
  return Array.from(usersMap.values()).map((user) => ({
    id: user.id,
    name: user.name,
    status: user.status || "online",
  }));
};

const getRoomParticipantLimit = async (roomId) => {
  const room = await RoomModel.findOne({ roomId }).select("maxParticipants");
  return Number(room?.maxParticipants) || DEFAULT_MAX_PARTICIPANTS;
};

const persistRoomUsers = async (roomId, users) => {
  await RoomModel.findOneAndUpdate(
    { roomId },
    {
      $set: {
        users,
      },
      $setOnInsert: {
        roomId,
        language: "javascript",
        currentLanguage: "javascript",
      },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const getOrCreateRoomUsers = (roomId) => {
  const existing = roomUsersStore.get(roomId);

  if (existing) return existing;

  const created = new Map();
  roomUsersStore.set(roomId, created);
  return created;
};

export const registerRoomSocket = (io, socket) => {
  const leaveCurrentRoom = async () => {
    const membership = socketMembershipStore.get(socket.id);

    if (!membership) {
      return;
    }

    const { roomId, userId } = membership;
    const usersMap = roomUsersStore.get(roomId);

    if (!usersMap) {
      socketMembershipStore.delete(socket.id);
      return;
    }

    const departingUser = usersMap.get(userId);
    usersMap.delete(userId);
    socketMembershipStore.delete(socket.id);
    socket.leave(roomId);

    const users = toClientUsers(usersMap);
    const maxParticipants = await getRoomParticipantLimit(roomId);

    io.to(roomId).emit("ROOM_USERS", {
      roomId,
      users,
      maxParticipants,
      currentParticipants: users.length,
    });
    io.to(roomId).emit("USER_LEFT", {
      roomId,
      userId,
      userName: departingUser?.name || "Collaborator",
      users,
    });

    if (users.length === 0) {
      roomUsersStore.delete(roomId);
    }

    try {
      await persistRoomUsers(roomId, users);
    } catch (error) {
      logger.error("Failed to persist room users on leave", error);
    }
  };

  socket.on("JOIN_ROOM", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");
      const userId = String(payload.user?.id || payload.userId || socket.user?.id || socket.id);
      const userName =
        sanitizeUsername(
          payload.user?.name || payload.userName || socket.user?.name || "Guest"
        ) || "Guest";

      if (!roomId || !userId) {
        socket.emit("ROOM_JOIN_ERROR", {
          roomId,
          message: "Room ID and user identity are required.",
        });
        return;
      }

      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        socket.emit("ROOM_JOIN_ERROR", {
          roomId,
          message: "Room not found.",
        });
        return;
      }

      const { files, activeFileId, changed } = ensureRoomFiles(room);
      const maxParticipants = Number(room.maxParticipants) || DEFAULT_MAX_PARTICIPANTS;

      if (changed) {
        await room.save();
      }

      const usersMap = getOrCreateRoomUsers(roomId);
      const alreadyInRoom = usersMap.has(userId);

      if (!alreadyInRoom && usersMap.size >= maxParticipants) {
        socket.emit("ROOM_JOIN_ERROR", {
          roomId,
          message: `Room is full. Max ${maxParticipants} participants allowed.`,
          maxParticipants,
          currentParticipants: usersMap.size,
        });
        return;
      }

      const membership = socketMembershipStore.get(socket.id);
      const isSameRoomMembership =
        membership?.roomId === roomId && membership?.userId === userId;

      if (!isSameRoomMembership) {
        await leaveCurrentRoom();
      }

      socket.join(roomId);

      usersMap.set(userId, {
        id: userId,
        name: userName,
        status: "online",
      });

      socketMembershipStore.set(socket.id, {
        roomId,
        userId,
      });

      const users = toClientUsers(usersMap);

      io.to(roomId).emit("ROOM_USERS", {
        roomId,
        users,
        maxParticipants,
        currentParticipants: users.length,
      });
      socket.to(roomId).emit("USER_JOINED", {
        roomId,
        user: { id: userId, name: userName, status: "online" },
        users,
        maxParticipants,
        currentParticipants: users.length,
      });

      socket.emit("ROOM_STATE", {
        roomId,
        name: room.name || room.roomName || "",
        roomName: room.roomName || room.name || "",
        visibility: room.visibility || "private",
        language: room.language || "javascript",
        currentLanguage: room.currentLanguage || room.language || "javascript",
        files,
        activeFileId,
        maxParticipants,
        currentParticipants: users.length,
      });

      await persistRoomUsers(roomId, users);
    } catch (error) {
      logger.error("JOIN_ROOM failed", error);
      socket.emit("ROOM_JOIN_ERROR", {
        roomId: normalizeRoomId(payload?.roomId || ""),
        message: error?.message || "Failed to join room.",
      });
    }
  });

  socket.on("LEAVE_ROOM", async () => {
    await leaveCurrentRoom();
  });

  socket.on("disconnect", async () => {
    await leaveCurrentRoom();
  });
};
