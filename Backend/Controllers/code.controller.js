import { executeCodeRemotely } from "../Services/codeExecution.service.js";
import { RoomModel } from "../Models/room.js";
import {
  getLanguageFromFileName,
  normalizeLanguage,
} from "../utils/language.js";

const normalizeRoomId = (value = "") => value.trim().toUpperCase();

const createFileId = () =>
  `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeFileName = (value = "", index = 0) => {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 64);

  if (normalized) {
    return normalized;
  }

  return `file-${index + 1}.txt`;
};

const normalizeIncomingFiles = (filesPayload = {}) => {
  if (!filesPayload || typeof filesPayload !== "object" || Array.isArray(filesPayload)) {
    return [];
  }

  return Object.entries(filesPayload)
    .map(([name, value], index) => {
      const safeName = normalizeFileName(name, index);

      if (!safeName) {
        return null;
      }

      let codeValue = "";

      if (typeof value === "string") {
        codeValue = value;
      } else if (value && typeof value === "object" && typeof value.code === "string") {
        codeValue = value.code;
      }

      return {
        name: safeName,
        code: codeValue,
      };
    })
    .filter(Boolean);
};

const getFilesObject = (files = []) => {
  return files.reduce((acc, file) => {
    const name = String(file?.name || "").trim();

    if (!name) {
      return acc;
    }

    acc[name] = typeof file?.code === "string" ? file.code : "";
    return acc;
  }, {});
};

const resolveActiveFile = ({ files = [], activeFileName = "", activeFileId = "" }) => {
  const byName = String(activeFileName || "").trim().toLowerCase();

  if (byName) {
    const match = files.find((file) => String(file?.name || "").toLowerCase() === byName);
    if (match) return match;
  }

  if (activeFileId) {
    const byIdMatch = files.find((file) => file?.id === activeFileId);
    if (byIdMatch) return byIdMatch;
  }

  return files[0] || null;
};

const createFallbackFile = (room) => {
  const language = normalizeLanguage(room?.language, "javascript");
  const extension =
    language === "typescript"
      ? "ts"
      : language === "python"
      ? "py"
      : language === "cpp"
      ? "cpp"
      : language === "java"
      ? "java"
      : language === "html"
      ? "html"
      : language === "css"
      ? "css"
      : "js";

  return {
    id: "main",
    name: `main.${extension}`,
    language,
    code: typeof room?.code === "string" ? room.code : "",
    lastEditedBy: "",
    lastEditedAt: null,
  };
};

const applyFilesToRoom = ({
  room,
  incomingFiles,
  activeFileName,
  fallbackLanguage,
  editedBy,
}) => {
  const existingFiles = Array.isArray(room.files) ? room.files : [];
  const existingByName = new Map(
    existingFiles.map((file) => [String(file?.name || "").toLowerCase(), file])
  );
  const now = new Date();

  let nextFiles = incomingFiles.map((file) => {
    const existing = existingByName.get(String(file.name).toLowerCase());
    const nextCode = typeof file.code === "string" ? file.code : "";
    const nextLanguage = getLanguageFromFileName(
      file.name,
      normalizeLanguage(
        fallbackLanguage,
        existing?.language || room.language || "javascript"
      )
    );
    const codeChanged = !existing || existing.code !== nextCode;

    return {
      id: existing?.id || createFileId(),
      name: file.name,
      language: nextLanguage,
      code: nextCode,
      lastEditedBy: codeChanged
        ? editedBy || existing?.lastEditedBy || "Collaborator"
        : existing?.lastEditedBy || "",
      lastEditedAt: codeChanged ? now : existing?.lastEditedAt || null,
    };
  });

  if (nextFiles.length === 0) {
    if (existingFiles.length > 0) {
      nextFiles = existingFiles;
    } else {
      nextFiles = [createFallbackFile(room)];
    }
  }

  const activeFile = resolveActiveFile({
    files: nextFiles,
    activeFileName,
    activeFileId: room.activeFileId,
  });

  room.files = nextFiles;
  room.activeFileId = activeFile?.id || nextFiles[0]?.id || "";
  room.language = normalizeLanguage(
    activeFile?.language,
    room.language || fallbackLanguage || "javascript"
  );
  room.code = typeof activeFile?.code === "string" ? activeFile.code : "";

  return {
    files: nextFiles,
    activeFile,
  };
};

export const executeCode = async (req, res, next) => {
  try {
    const code = req.body?.code;
    const language = req.body?.language;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "code and language are required",
      });
    }

    const result = await executeCodeRemotely({
      code,
      language,
      stdin: req.body?.stdin || "",
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    if (err?.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: err.message || "Code execution service is temporarily unavailable. Please try again.",
      });
    }

    return next(err);
  }
};

export const saveRoomCode = async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.body?.roomId || "");
    const incomingFiles = normalizeIncomingFiles(req.body?.files);

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "roomId is required",
      });
    }

    if (incomingFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "files object is required",
      });
    }

    const room = await RoomModel.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const editorName = req.user?.name || req.body?.userName || "Collaborator";
    const { files, activeFile } = applyFilesToRoom({
      room,
      incomingFiles,
      activeFileName: req.body?.activeFileName,
      fallbackLanguage: req.body?.language,
      editedBy: editorName,
    });

    await room.save();

    return res.status(200).json({
      success: true,
      roomId: room.roomId,
      files: getFilesObject(files),
      activeFileName: activeFile?.name || "",
      updatedAt: room.updatedAt,
    });
  } catch (error) {
    return next(error);
  }
};

export const getRoomCode = async (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId || "");

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "roomId is required",
      });
    }

    const room = await RoomModel.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const existingFiles = Array.isArray(room.files) ? room.files : [];
    const files = existingFiles.length > 0 ? existingFiles : [createFallbackFile(room)];
    const activeFile = resolveActiveFile({
      files,
      activeFileId: room.activeFileId,
    });

    if (existingFiles.length === 0) {
      room.files = files;
      room.activeFileId = activeFile?.id || files[0]?.id || "";
      room.language = normalizeLanguage(activeFile?.language, room.language || "javascript");
      room.code = activeFile?.code || "";
      await room.save();
    }

    return res.status(200).json({
      success: true,
      roomId: room.roomId,
      files: getFilesObject(files),
      activeFileName: activeFile?.name || files[0]?.name || "",
      updatedAt: room.updatedAt,
    });
  } catch (error) {
    return next(error);
  }
};
