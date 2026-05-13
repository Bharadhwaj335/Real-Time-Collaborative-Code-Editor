import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const extractToken = (authorizationHeader = "") => {
  if (!authorizationHeader) return "";

  if (authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.slice(7).trim();
  }

  return authorizationHeader.trim();
};

export const authMiddleware = (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

/** Attaches `req.user` when a valid Bearer token is present; never sends 401. */
export const optionalAuth = (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    // Ignore invalid tokens for optional auth flows.
  }

  next();
};