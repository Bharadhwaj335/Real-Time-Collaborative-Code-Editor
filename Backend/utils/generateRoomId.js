import crypto from "node:crypto";

export const generateRoomId = (length = 6) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length).toUpperCase();
};
