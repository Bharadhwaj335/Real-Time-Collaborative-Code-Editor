import { getExtensionFromLanguage, normalizeLanguage } from "./language.js";

export const normalizeRoomId = (roomId = "") => roomId.trim().toUpperCase();

export const createFallbackFile = (language = "javascript", code = "") => {
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

export const ensureRoomFiles = (room) => {
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
