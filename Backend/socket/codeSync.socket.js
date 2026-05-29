import { RoomModel } from "../Models/room.js";
import { logger } from "../utils/logger.js";
import {
  getExtensionFromLanguage,
  getLanguageFromFileName,
  normalizeLanguage,
} from "../utils/language.js";
import {
  normalizeRoomId,
  createFallbackFile,
  ensureRoomFiles,
} from "../utils/socketHelpers.js";

const MAX_FILES_PER_ROOM = 25;

const createFileId = () => `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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

const ensureUniqueFileName = (files, preferredName, ignoreFileId = "") => {
  const existingNames = new Set(
    (files || [])
      .filter((file) => !ignoreFileId || file.id !== ignoreFileId)
      .map((file) => String(file.name || "").toLowerCase())
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

const findFileByPayload = (files = [], payload = {}) => {
  return files.find((file) => {
    if (payload.fileId && file.id === payload.fileId) {
      return true;
    }

    if (payload.fileName) {
      return (
        String(file.name || "").toLowerCase() ===
        String(payload.fileName || "").toLowerCase()
      );
    }

    return false;
  });
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

const emitFileListUpdate = (io, roomId, room, extra = {}) => {
  io.to(roomId).emit("FILE_LIST_UPDATE", {
    roomId,
    files: toClientFiles(room.files),
    activeFileId: room.activeFileId,
    ...extra,
  });
};

const debounceStore = new Map();
const DEBOUNCE_DELAY_MS = 3000;

const scheduleRoomSave = (roomId, room) => {
  const existing = debounceStore.get(roomId);

  if (existing) {
    clearTimeout(existing.timerId);
  }

  const timerId = setTimeout(async () => {
    try {
      await room.save();
      debounceStore.delete(roomId);
    } catch (error) {
      logger.error("Debounced room save failed", error);
    }
  }, DEBOUNCE_DELAY_MS);

  debounceStore.set(roomId, { room, timerId });
};

export const registerCodeSyncSocket = (io, socket) => {
  socket.on("CODE_CHANGE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        socket.emit("CODE_CHANGE_ERROR", {
          message: "Room ID is required.",
        });
        return;
      }

      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        return;
      }

      const { files, activeFileId } = ensureRoomFiles(room);

      let targetFile = findFileByPayload(files, payload);
      let createdNewFileFromCodeChange = false;

      if (!targetFile) {
        const fallbackLanguage = normalizeLanguage(payload.language, room.language || "javascript");
        const desiredName = sanitizeFileName(payload.fileName || "untitled", fallbackLanguage);
        const uniqueName = ensureUniqueFileName(files, desiredName);
        const inferredLanguage = getLanguageFromFileName(uniqueName, fallbackLanguage);

        targetFile = {
          id: payload.fileId || createFileId(),
          name: uniqueName,
          language: inferredLanguage,
          code: typeof payload.code === "string" ? payload.code : "",
          lastEditedBy: socket.user?.name || "Collaborator",
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
      targetFile.lastEditedBy = socket.user?.name || "Collaborator";
      targetFile.lastEditedAt = new Date();

      room.language = nextLanguage;
      room.currentLanguage = nextLanguage;
      room.code = targetFile.code || "";
      room.activeFileId = targetFile.id || activeFileId;

      scheduleRoomSave(roomId, room);

      if (createdNewFileFromCodeChange) {
        emitFileListUpdate(io, roomId, room);
      }

      const normalizedChanges = normalizeChanges(payload.changes);

      socket.to(roomId).emit("CODE_UPDATE", {
        roomId,
        fileId: targetFile.id,
        fileName: targetFile.name,
        code: targetFile.code,
        language: targetFile.language,
        userId: socket.user?.id,
        userName: socket.user?.name || "Collaborator",
        changes: normalizedChanges,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("CODE_CHANGE failed", error);
      socket.emit("CODE_CHANGE_ERROR", {
        roomId: normalizeRoomId(payload?.roomId || ""),
        message: error?.message || "Failed to save code changes.",
      });
    }
  });

  socket.on("FILE_CREATE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        socket.emit("FILE_CREATE_ERROR", {
          roomId,
          message: "Room ID is required.",
        });
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
        lastEditedBy: socket.user?.name || "Collaborator",
        lastEditedAt: now,
      };

      room.files.push(newFile);
      room.activeFileId = newFile.id;
      room.language = newFile.language;
      room.currentLanguage = newFile.language;
      room.code = newFile.code;

      emitFileListUpdate(io, roomId, room, {
        language: newFile.language,
        createdBy: {
          id: socket.user?.id,
          name: socket.user?.name || "Collaborator",
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
        message: error?.message || "Unable to create file right now.",
      });
    }
  });

  socket.on("FILE_CHANGE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        socket.emit("FILE_CHANGE_ERROR", {
          roomId,
          message: "Room ID is required.",
        });
        return;
      }

      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        return;
      }

      const { files, activeFileId } = ensureRoomFiles(room);
      const targetFile = findFileByPayload(files, payload);

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
      room.currentLanguage = nextLanguage;
      room.code = targetFile.code || "";

      await room.save();

      emitFileListUpdate(io, roomId, room, {
        language: room.language,
      });

      io.to(roomId).emit("FILE_CHANGE", {
        roomId,
        fileId: targetFile.id,
        fileName: targetFile.name,
        language: targetFile.language,
        userId: socket.user?.id,
        userName: socket.user?.name || "Collaborator",
      });
    } catch (error) {
      logger.error("FILE_CHANGE failed", error);
      socket.emit("FILE_CHANGE_ERROR", {
        roomId: normalizeRoomId(payload?.roomId || ""),
        message: error?.message || "Unable to switch file right now.",
      });
    }
  });

  socket.on("FILE_RENAME", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        socket.emit("FILE_RENAME_ERROR", {
          roomId,
          message: "Room ID is required.",
        });
        return;
      }

      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        return;
      }

      const { files, activeFileId } = ensureRoomFiles(room);
      const targetFile = findFileByPayload(files, {
        fileId: payload.fileId,
        fileName: payload.oldFileName || payload.fileName || payload.oldName,
      });

      if (!targetFile) {
        return;
      }

      const requestedName = String(
        payload.newFileName || payload.newName || payload.fileName || ""
      ).trim();

      if (!requestedName) {
        return;
      }

      const fallbackLanguage = normalizeLanguage(
        payload.language,
        targetFile.language || room.language || "javascript"
      );
      const sanitizedName = sanitizeFileName(requestedName, fallbackLanguage);
      const uniqueName = ensureUniqueFileName(files, sanitizedName, targetFile.id);

      const previousName = targetFile.name;

      targetFile.name = uniqueName;
      targetFile.language = getLanguageFromFileName(uniqueName, fallbackLanguage);
      targetFile.lastEditedBy = socket.user?.name || "Collaborator";
      targetFile.lastEditedAt = new Date();

      const resolvedActiveFileId = room.activeFileId || activeFileId || targetFile.id;
      const activeFile = files.find((file) => file.id === resolvedActiveFileId) || targetFile;

      room.activeFileId = activeFile.id;
      room.language = activeFile.language || room.language;
      room.currentLanguage = room.language;
      room.code = activeFile.code || "";

      await room.save();

      emitFileListUpdate(io, roomId, room, {
        language: room.language,
      });

      io.to(roomId).emit("FILE_RENAMED", {
        roomId,
        fileId: targetFile.id,
        oldFileName: previousName,
        fileName: uniqueName,
        language: targetFile.language,
        userId: socket.user?.id,
        userName: socket.user?.name || "Collaborator",
      });

      if (activeFile.id === targetFile.id) {
        io.to(roomId).emit("FILE_CHANGE", {
          roomId,
          fileId: activeFile.id,
          fileName: activeFile.name,
          language: activeFile.language,
        });
      }
    } catch (error) {
      logger.error("FILE_RENAME failed", error);
      socket.emit("FILE_RENAME_ERROR", {
        roomId: normalizeRoomId(payload?.roomId || ""),
        message: error?.message || "Unable to rename file right now.",
      });
    }
  });

  socket.on("FILE_DELETE", async (payload = {}) => {
    try {
      const roomId = normalizeRoomId(payload.roomId || "");

      if (!roomId) {
        socket.emit("FILE_DELETE_ERROR", {
          roomId,
          message: "Room ID is required.",
        });
        return;
      }

      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        return;
      }

      const { files, activeFileId } = ensureRoomFiles(room);

      if (files.length <= 1) {
        socket.emit("FILE_DELETE_ERROR", {
          roomId,
          message: "At least one file must remain in the room.",
        });
        return;
      }

      const targetFile = findFileByPayload(files, payload);

      if (!targetFile) {
        return;
      }

      room.files = files.filter((file) => file.id !== targetFile.id);

      const currentlyActiveId = room.activeFileId || activeFileId;
      const shouldSwitchActive = !currentlyActiveId || currentlyActiveId === targetFile.id;
      const nextActive = shouldSwitchActive
        ? room.files[0]
        : room.files.find((file) => file.id === currentlyActiveId) || room.files[0];

      room.activeFileId = nextActive?.id || "";
      room.language = nextActive?.language || room.language;
      room.currentLanguage = room.language;
      room.code = nextActive?.code || "";

      await room.save();

      emitFileListUpdate(io, roomId, room, {
        language: room.language,
      });

      io.to(roomId).emit("FILE_DELETED", {
        roomId,
        fileId: targetFile.id,
        fileName: targetFile.name,
        userId: socket.user?.id,
        userName: socket.user?.name || "Collaborator",
      });

      if (nextActive) {
        io.to(roomId).emit("FILE_CHANGE", {
          roomId,
          fileId: nextActive.id,
          fileName: nextActive.name,
          language: nextActive.language,
        });
      }
    } catch (error) {
      logger.error("FILE_DELETE failed", error);
      socket.emit("FILE_DELETE_ERROR", {
        roomId: normalizeRoomId(payload.roomId || ""),
        message: error?.message || "Unable to delete file right now.",
      });
    }
  });
};

export const cleanCodeSyncSocketStore = (roomId) => {
  const entry = debounceStore.get(roomId);
  if (entry?.timerId) {
    clearTimeout(entry.timerId);
  }
  debounceStore.delete(roomId);
};
