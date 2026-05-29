import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: "7d" });
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwtRefreshSecret);
  } catch (error) {
    return null;
  }
};
