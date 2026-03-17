import { RoomModel } from "../Models/room.js";
import { logger } from "../utils/logger.js";
import {
  getExtensionFromLanguage,
  getLanguageFromFileName,
  normalizeLanguage,
} from "../utils/language.js";

const normalizeRoomId = (roomId = "") => roomId.trim().toUpperCase();
const MAX_FILES_PER_ROOM = 25;

const createFileId = () => `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createFallbackFile = (language = "javascript", code = "") => {
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

const ensureRoomFiles = (room) => {
  const existingFiles = Array.isArray(room.files) ? room.files : [];

  if (existingFiles.length > 0) {
    return {
      files: existingFiles,
      activeFileId: room.activeFileId || existingFiles[0].id,
      changed: false,
    };
  }

  const fallbackFile = createFallbackFile(room.language, room.code || "");
  room.files = [fallbackFile];
  room.activeFileId = fallbackFile.id;

  return {
    files: room.files,
    activeFileId: room.activeFileId,
    changed: true,
  };
};

const normalizeChanges = (changes = []) => {
  if (!Array.isArray(changes)) return [];

  return changes
    .map((change) => ({
      startLineNumber: Number(change?.startLineNumber) || 1,
      endLineNumber: Number(change?.endLineNumber) || Number(change?.startLineNumber) || 1,
      startColumn: Number(change?.startColumn) || 1,
      endColumn: Number(change?.endColumn) || 1,
      text: typeof change?.text === "string" ? change.text : "",
    }))
    .slice(0, 12);
};

const sanitizeFileName = (inputName = "", language = "javascript") => {
  const normalizedLanguage = normalizeLanguage(language);
  const extension = getExtensionFromLanguage(normalizedLanguage);
  const baseName = String(inputName || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 40);

  if (!baseName) {
    return `untitled.${extension}`;
  }

  if (baseName.includes(".")) {
    return baseName;
  }

  return `${baseName}.${extension}`;
};

const ensureUniqueFileName = (files, preferredName) => {
  const existingNames = new Set(
    (files || []).map((file) => String(file.name || "").toLowerCase())
  );

  if (!existingNames.has(preferredName.toLowerCase())) {
    return preferredName;
  }

  const dotIndex = preferredName.lastIndexOf(".");
  const hasExtension = dotIndex > 0;
  const base = hasExtension ? preferredName.slice(0, dotIndex) : preferredName;
  const extension = hasExtension ? preferredName.slice(dotIndex) : "";

  for (let attempt = 1; attempt <= 200; attempt += 1) {
    const candidate = `${base}-${attempt}${extension}`;

    if (!existingNames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}${extension}`;
};

const toClientFiles = (files = []) => {
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    language: file.language,
    code: file.code || "",
    lastEditedBy: file.lastEditedBy || "",
    lastEditedAt: file.lastEditedAt || null,
  }));
};

export const registerCodeSyncSocket = (io, socket) => {
  socket.on("CODE_CHANGE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        return;
      }

      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        return;
      }

      const { files, activeFileId } = ensureRoomFiles(room);

      let targetFile = files.find((file) => file.id === payload.fileId);
      let createdNewFileFromCodeChange = false;

      if (!targetFile) {
        const fallbackLanguage = normalizeLanguage(payload.language, room.language || "javascript");
        const desiredName = sanitizeFileName(payload.fileName, fallbackLanguage);
        const uniqueName = ensureUniqueFileName(files, desiredName);
        const inferredLanguage = getLanguageFromFileName(uniqueName, fallbackLanguage);

        targetFile = {
          id: payload.fileId || createFileId(),
          name: uniqueName,
          language: inferredLanguage,
          code: typeof payload.code === "string" ? payload.code : "",
          lastEditedBy: payload.userName || payload.userId || "Collaborator",
          lastEditedAt: new Date(),
        };

        room.files.push(targetFile);
        createdNewFileFromCodeChange = true;
      }

      const languageFallback = normalizeLanguage(
        payload.language,
        targetFile.language || room.language || "javascript"
      );
      const nextLanguage = getLanguageFromFileName(targetFile.name, languageFallback);

      if (typeof payload.code === "string") {
        targetFile.code = payload.code;
      }

      targetFile.language = nextLanguage;
      targetFile.lastEditedBy = payload.userName || payload.userId || "Collaborator";
      targetFile.lastEditedAt = new Date();

      room.language = nextLanguage;
      room.code = targetFile.code || "";
      room.activeFileId = targetFile.id || activeFileId;

      await room.save();

      if (createdNewFileFromCodeChange) {
        io.to(roomId).emit("FILE_LIST_UPDATE", {
          roomId,
          files: toClientFiles(room.files),
          activeFileId: room.activeFileId,
        });
      }

      const normalizedChanges = normalizeChanges(payload.changes);

      socket.to(roomId).emit("CODE_UPDATE", {
        roomId,
        fileId: targetFile.id,
        fileName: targetFile.name,
        code: targetFile.code,
        language: targetFile.language,
        userId: payload.userId,
        userName: payload.userName,
        changes: normalizedChanges,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("CODE_CHANGE failed", error);
    }
  });

  socket.on("FILE_CREATE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        return;
      }

      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        socket.emit("FILE_CREATE_ERROR", {
          roomId,
          message: "Room not found.",
        });
        return;
      }

      const { files, changed } = ensureRoomFiles(room);

      if (files.length >= MAX_FILES_PER_ROOM) {
        socket.emit("FILE_CREATE_ERROR", {
          roomId,
          message: `You can create up to ${MAX_FILES_PER_ROOM} files in this room.`,
        });
        return;
      }

      const requestedLanguage = normalizeLanguage(payload.language, room.language || "javascript");
      const desiredName = sanitizeFileName(payload.fileName, requestedLanguage);
      const uniqueName = ensureUniqueFileName(files, desiredName);
      const inferredLanguage = getLanguageFromFileName(uniqueName, requestedLanguage);
      const now = new Date();

      const newFile = {
        id: createFileId(),
        name: uniqueName,
        language: inferredLanguage,
        code: typeof payload.code === "string" ? payload.code : "",
        lastEditedBy: payload.userName || payload.userId || "Collaborator",
        lastEditedAt: now,
      };

      room.files.push(newFile);
      room.activeFileId = newFile.id;
      room.language = newFile.language;
      room.code = newFile.code;

      await room.save();

      io.to(roomId).emit("FILE_LIST_UPDATE", {
        roomId,
        files: toClientFiles(room.files),
        activeFileId: room.activeFileId,
        language: newFile.language,
        createdBy: {
          id: payload.userId,
          name: payload.userName,
        },
      });

      io.to(roomId).emit("FILE_CHANGE", {
        roomId,
        fileId: newFile.id,
        fileName: newFile.name,
        language: newFile.language,
      });

      if (changed) {
        socket.emit("ROOM_STATE", {
          roomId,
          files: toClientFiles(room.files),
          activeFileId: room.activeFileId,
          language: room.language,
          maxParticipants: room.maxParticipants,
        });
      }
    } catch (error) {
      logger.error("FILE_CREATE failed", error);
      socket.emit("FILE_CREATE_ERROR", {
        roomId: normalizeRoomId(payload.roomId || ""),
        message: "Unable to create file right now.",
      });
    }
  });

  socket.on("FILE_CHANGE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        return;
      }

      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        return;
      }

      const { files, activeFileId } = ensureRoomFiles(room);
      const targetFile = files.find((file) => {
        if (payload.fileId && file.id === payload.fileId) {
          return true;
        }

        if (payload.fileName) {
          return String(file.name || "").toLowerCase() === String(payload.fileName || "").toLowerCase();
        }

        return false;
      });

      if (!targetFile) {
        return;
      }

      const nextLanguage = getLanguageFromFileName(
        targetFile.name,
        normalizeLanguage(payload.language, targetFile.language || room.language || "javascript")
      );

      targetFile.language = nextLanguage;
      room.activeFileId = targetFile.id || activeFileId;
      room.language = nextLanguage;
      room.code = targetFile.code || "";

      await room.save();

      io.to(roomId).emit("FILE_CHANGE", {
        roomId,
        fileId: targetFile.id,
        fileName: targetFile.name,
        language: targetFile.language,
      });
    } catch (error) {
      logger.error("FILE_CHANGE failed", error);
    }
  });
};
