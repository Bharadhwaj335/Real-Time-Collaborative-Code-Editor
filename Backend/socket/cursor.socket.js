const normalizeRoomId = (roomId = "") => roomId.trim().toUpperCase();

export const registerCursorSocket = (socket) => {
  socket.on("CURSOR_MOVE", (payload = {}) => {
    const roomId = normalizeRoomId(payload.roomId || "");

    if (!roomId || !payload.userId || !payload.position) {
      return;
    }

    socket.to(roomId).emit("CURSOR_UPDATE", {
      roomId,
      userId: payload.userId,
      userName: payload.userName,
      fileId: payload.fileId,
      position: payload.position,
      timestamp: new Date().toISOString(),
    });
  });
};
