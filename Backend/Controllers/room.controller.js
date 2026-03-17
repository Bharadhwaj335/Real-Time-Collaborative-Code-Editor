import { RoomModel } from "../Models/room.js";
import { generateRoomId } from "../utils/generateRoomId.js";

const normalizeRoomId = (value = "") => value.trim().toUpperCase();
const DEFAULT_MAX_PARTICIPANTS = 8;
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 50;

const LANGUAGE_FILE_EXTENSION = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  cpp: "cpp",
  c: "c",
  go: "go",
  rust: "rs",
};

const clampParticipantLimit = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_MAX_PARTICIPANTS;
  }

  return Math.min(MAX_PARTICIPANTS, Math.max(MIN_PARTICIPANTS, Math.round(parsed)));
};

const createInitialFile = (language = "javascript", code = "") => {
  const normalizedLanguage = String(language || "javascript").toLowerCase();
  const extension = LANGUAGE_FILE_EXTENSION[normalizedLanguage] || "txt";

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
    const roomName = (req.body?.roomName || "").trim();
    const language = (req.body?.language || "javascript").trim().toLowerCase();
    const visibility = req.body?.visibility === "public" ? "public" : "private";
    const maxParticipants = clampParticipantLimit(req.body?.maxParticipants);
    const initialCode = typeof req.body?.code === "string" ? req.body.code : "";
    const initialFile = createInitialFile(language, initialCode);

    const roomId = req.body?.roomId
      ? normalizeRoomId(req.body.roomId)
      : await generateUniqueRoomId();

    const creatorId = req.user?.id || req.body?.user?.id || `guest-${Date.now()}`;
    const creatorName = req.user?.name || req.body?.user?.name || "Host";

    const room = await RoomModel.create({
      roomId,
      roomName,
      language,
      code: initialFile.code,
      visibility,
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
    const normalizedUsers = normalizeRoomUsers(roomObject.users);
    const currentParticipants = normalizedUsers.length;
    const maxParticipants = Number(roomObject.maxParticipants) || DEFAULT_MAX_PARTICIPANTS;

    return res.status(200).json({
      ...roomObject,
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