import { createErrorResponse } from "../utils/errorHandler.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROOM_ID_REGEX = /^[A-Z0-9]{4,10}$/;
const PASSWORD_MIN_LENGTH = 6;

export const validateEmail = (email) => {
  const trimmed = String(email || "").trim().toLowerCase();
  return EMAIL_REGEX.test(trimmed) ? trimmed : null;
};

export const validateRoomId = (roomId) => {
  const trimmed = String(roomId || "").trim().toUpperCase();
  return ROOM_ID_REGEX.test(trimmed) ? trimmed : null;
};

export const validatePassword = (password) => {
  const str = String(password || "").trim();
  return str.length >= PASSWORD_MIN_LENGTH ? str : null;
};

export const validateUsername = (username) => {
  const trimmed = String(username || "").trim();
  return trimmed.length >= 2 && trimmed.length <= 50 ? trimmed : null;
};

export const validateText = (text, minLength = 1, maxLength = 10000) => {
  const trimmed = String(text || "").trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength ? trimmed : null;
};

export const validateCode = (code, maxLength = 50000) => {
  const codeStr = String(code || "");
  return codeStr.length <= maxLength ? codeStr : null;
};

export const validateRequestBody = (schema) => (req, res, next) => {
  const errors = {};

  if (schema.email) {
    const email = req.body?.email;
    if (!email || !validateEmail(email)) {
      errors.email = "Invalid email format";
    } else {
      req.body.email = validateEmail(email);
    }
  }

  if (schema.password) {
    const password = req.body?.password;
    if (!password || !validatePassword(password)) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
  }

  if (schema.name) {
    const name = req.body?.name;
    if (!name || !validateUsername(name)) {
      errors.name = "Name must be between 2 and 50 characters";
    } else {
      req.body.name = validateUsername(name);
    }
  }

  if (schema.username) {
    const username = req.body?.username;
    if (!username || !validateUsername(username)) {
      errors.username = "Username must be between 2 and 50 characters";
    } else {
      req.body.username = validateUsername(username);
    }
  }

  if (schema.roomId) {
    // For GET/DELETE requests, roomId is in params; for POST/PUT, check both body and params
    const roomId = req.params?.roomId || req.body?.roomId;
    if (!roomId || !validateRoomId(roomId)) {
      errors.roomId = "Invalid room ID format";
    } else {
      // Update the normalized value
      const normalized = validateRoomId(roomId);
      if (req.params?.roomId) req.params.roomId = normalized;
      if (req.body?.roomId) req.body.roomId = normalized;
    }
  }

  if (schema.text) {
    const text = req.body?.text;
    if (!text || !validateText(text, 1, 5000)) {
      errors.text = "Message must be between 1 and 5000 characters";
    } else {
      req.body.text = validateText(text);
    }
  }

  if (schema.code) {
    const code = req.body?.code;
    if (!validateCode(code)) {
      errors.code = "Code exceeds maximum size limit (50KB)";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(createErrorResponse(400, "Validation failed", errors));
  }

  next();
};
