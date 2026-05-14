import { RoomModel } from "../Models/room.js";
import { MessageModel } from "../Models/message.js";
import { generateRoomId } from "../utils/generateRoomId.js";
import { getSocketIo } from "../socket/ioInstance.js";
import { getExtensionFromLanguage, normalizeLanguage } from "../utils/language.js";

const normalizeRoomId = (value = "") => value.trim().toUpperCase();
const DEFAULT_MAX_PARTICIPANTS = 8;
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 50;

const clampParticipantLimit = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_MAX_PARTICIPANTS;
  }

  return Math.min(MAX_PARTICIPANTS, Math.max(MIN_PARTICIPANTS, Math.round(parsed)));
};

const createInitialFile = (language = "javascript", code = "") => {
  const normalizedLanguage = normalizeLanguage(language);
  const extension = getExtensionFromLanguage(normalizedLanguage);

  return {
    id: "main",
    name: `main.${extension}`,
    language: normalizedLanguage,
    code,
    lastEditedBy: "",
    lastEditedAt: null,
  };
};

const normalizeRoomUsers = (users = []) => {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    status: user.status || "online",
  }));
};

const generateUniqueRoomId = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const roomId = generateRoomId(6);
    const exists = await RoomModel.exists({ roomId });

    if (!exists) {
      return roomId;
    }
  }

  const error = new Error("Unable to generate unique room id. Please try again.");
  error.statusCode = 500;
  throw error;
};

export const createRoom = async (req, res, next) => {
  try {
    const roomName = (req.body?.name || req.body?.roomName || "").trim();
    const language = normalizeLanguage(req.body?.language, "javascript");
    const maxParticipants = clampParticipantLimit(req.body?.maxParticipants);
    const initialCode = typeof req.body?.code === "string" ? req.body.code : "";
    const initialFile = createInitialFile(language, initialCode);

    const roomId = req.body?.roomId
      ? normalizeRoomId(req.body.roomId)
      : await generateUniqueRoomId();

    const creatorId =
      req.user?.id != null && req.user.id !== ""
        ? String(req.user.id)
        : req.body?.user?.id || `guest-${Date.now()}`;
    const creatorName = req.user?.name || req.body?.user?.name || "Host";

    const room = await RoomModel.create({
      roomId,
      name: roomName,
      roomName,
      language,
      currentLanguage: language,
      code: initialFile.code,
      maxParticipants,
      users: [{ id: String(creatorId), name: creatorName, status: "online" }],
      files: [initialFile],
      activeFileId: initialFile.id,
      createdBy: String(creatorId),
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      roomId: room.roomId,
      data: room,
    });
  } catch (error) {
    return next(error);
  }
};

export const getRoom = async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    const room = await RoomModel.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const roomObject = room.toObject();
    const roomName = roomObject.name || roomObject.roomName || "";
    const normalizedUsers = normalizeRoomUsers(roomObject.users);
    const currentParticipants = normalizedUsers.length;
    const maxParticipants = Number(roomObject.maxParticipants) || DEFAULT_MAX_PARTICIPANTS;

    return res.status(200).json({
      ...roomObject,
      name: roomName,
      roomName,
      currentLanguage: roomObject.currentLanguage || roomObject.language || "javascript",
      users: normalizedUsers,
      currentParticipants,
      maxParticipants,
      isJoinable: currentParticipants < maxParticipants,
      activeFileId: roomObject.activeFileId || roomObject.files?.[0]?.id || "",
    });
  } catch (error) {
    return next(error);
  }
};

export const leaveRoom = async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    const userId = String(req.user?.id || req.body?.userId || "");

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required to leave room",
      });
    }

    const room = await RoomModel.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    room.users = room.users.filter((user) => user.id !== userId);
    await room.save();

    return res.status(200).json({
      success: true,
      message: "User left the room",
      room,
    });
  } catch (error) {
    return next(error);
  }
};

export const listMyRooms = async (req, res, next) => {
  try {
    const ownerId = String(req.user?.id || "");

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const rooms = await RoomModel.find({ createdBy: ownerId }).sort({ updatedAt: -1 }).lean();

    const payload = rooms.map((room) => {
      const roomName = room.name || room.roomName || "";
      const currentParticipants = Array.isArray(room.users) ? room.users.length : 0;
      const maxParticipants = Number(room.maxParticipants) || DEFAULT_MAX_PARTICIPANTS;

      return {
        roomId: room.roomId,
        name: roomName,
        roomName,
        language: room.currentLanguage || room.language || "javascript",
        maxParticipants,
        currentParticipants,
        updatedAt: room.updatedAt,
        createdAt: room.createdAt,
        createdBy: room.createdBy,
        isJoinable: currentParticipants < maxParticipants,
      };
    });

    return res.status(200).json({
      success: true,
      rooms: payload,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    const userId = String(req.user?.id || "");

    const room = await RoomModel.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (String(room.createdBy || "") !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the room owner can update this room.",
      });
    }

    const { name, roomName, maxParticipants } = req.body || {};
    const nextTitle = typeof name === "string" ? name.trim() : typeof roomName === "string" ? roomName.trim() : "";

    if (nextTitle) {
      room.name = nextTitle;
      room.roomName = nextTitle;
    }

    if (maxParticipants !== undefined && maxParticipants !== null) {
      room.maxParticipants = clampParticipantLimit(maxParticipants);
    }

    await room.save();

    const roomObject = room.toObject();
    const normalizedUsers = normalizeRoomUsers(roomObject.users);
    const currentParticipants = normalizedUsers.length;
    const maxP = Number(roomObject.maxParticipants) || DEFAULT_MAX_PARTICIPANTS;

    const io = getSocketIo();
    io?.to(roomId).emit("ROOM_STATE", {
      roomId,
      name: roomObject.name || roomObject.roomName || "",
      roomName: roomObject.roomName || roomObject.name || "",
      maxParticipants: maxP,
      currentParticipants,
      users: normalizedUsers,
    });

    return res.status(200).json({
      success: true,
      message: "Room updated",
      data: {
        ...roomObject,
        users: normalizedUsers,
        currentParticipants,
        maxParticipants: maxP,
        isJoinable: currentParticipants < maxP,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    const userId = String(req.user?.id || "");

    const room = await RoomModel.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (String(room.createdBy || "") !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the room owner can delete this room.",
      });
    }

    await MessageModel.deleteMany({ roomId });
    await RoomModel.deleteOne({ roomId });

    const io = getSocketIo();
    io?.to(roomId).emit("ROOM_DELETED", { roomId });

    return res.status(200).json({
      success: true,
      message: "Room deleted",
      roomId,
    });
  } catch (error) {
    return next(error);
  }
};