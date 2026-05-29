import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

import { AppError } from "../utils/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AVATAR_DIR = path.join(__dirname, "..", "uploads", "avatars");

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const ALLOWED_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);


export const ensureAvatarDir = () => {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
};

const avatarFileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIMES.has(file.mimetype)) {
    return cb(new AppError("Please use a PNG, JPG, JPEG, or WebP image.", 400));
  }
  cb(null, true);
};

/** Memory storage — persist to disk only after validation in controllers. */
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: avatarFileFilter,
});

export const validateAvatarMagicBytes = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const type = await fileTypeFromBuffer(req.file.buffer);
    if (!type || !ALLOWED_MIMES.has(type.mime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file content. Please upload a real PNG, JPG, JPEG, or WebP image.",
      });
    }
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to validate file contents.",
    });
  }
};


/**
 * Parses multipart registration (optional avatar). Skips multer for JSON bodies.
 */
export const optionalRegisterMultipart = (req, res, next) => {
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (!contentType.includes("multipart/form-data")) {
    return next();
  }

  return avatarUpload.single("avatar")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image must be 2 MB or smaller.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Could not process the image upload.",
      });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || "Upload failed.";
    return res.status(statusCode).json({ success: false, message });
  });
};

/**
 * Profile picture update (multipart with avatar file).
 */
export const requireAvatarUpload = (req, res, next) => {
  return avatarUpload.single("avatar")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image must be 2 MB or smaller.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Could not process the image upload.",
      });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || "Upload failed.";
    return res.status(statusCode).json({ success: false, message });
  });
};

export const persistAvatarFile = (file) => {
  if (!file?.buffer) return "";

  const ext = path.extname(file.originalname || "").toLowerCase();
  const safeExt = ALLOWED_EXT.has(ext) ? ext : ".png";
  ensureAvatarDir();
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${safeExt}`;
  const fullPath = path.join(AVATAR_DIR, filename);
  fs.writeFileSync(fullPath, file.buffer);
  return `/uploads/avatars/${filename}`;
};

export const unlinkAvatarIfExists = (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== "string") return;
  if (!avatarUrl.startsWith("/uploads/avatars/")) return;

  const base = path.basename(avatarUrl);
  if (!base || base.includes("..") || base.includes("/") || base.includes("\\")) return;

  const fullPath = path.join(AVATAR_DIR, base);
  if (!fullPath.startsWith(AVATAR_DIR)) return;

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    // ignore
  }
};
