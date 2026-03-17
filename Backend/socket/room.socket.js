import { RoomModel } from "../Models/room.js";
import { logger } from "../utils/logger.js";

const roomUsersStore = new Map();
const socketMembershipStore = new Map();

const normalizeRoomId = (roomId = "") => roomId.trim().toUpperCase();

const toClientUsers = (usersMap) => {
  return Array.from(usersMap.values()).map((user) => ({
    id: user.id,
    name: user.name,
    status: user.status || "online",
  }));
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
      },
    },
    { upsert: true, new: true }
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

    usersMap.delete(userId);
    socketMembershipStore.delete(socket.id);
    socket.leave(roomId);

    const users = toClientUsers(usersMap);

    io.to(roomId).emit("ROOM_USERS", { roomId, users });
    io.to(roomId).emit("USER_LEFT", { roomId, userId, users });

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
      const userName = payload.user?.name || payload.userName || socket.user?.name || "Guest";

      if (!roomId || !userId) {
        return;
      }

      await leaveCurrentRoom();

      socket.join(roomId);

      const usersMap = getOrCreateRoomUsers(roomId);
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

      io.to(roomId).emit("ROOM_USERS", { roomId, users });
      socket.to(roomId).emit("USER_JOINED", {
        roomId,
        user: { id: userId, name: userName, status: "online" },
        users,
      });

      await persistRoomUsers(roomId, users);
    } catch (error) {
      logger.error("JOIN_ROOM failed", error);
    }
  });

  socket.on("LEAVE_ROOM", async () => {
    await leaveCurrentRoom();
  });

  socket.on("disconnect", async () => {
    await leaveCurrentRoom();
  });
};
