import { env } from "../config/env.js";

const normalizeOrigin = (origin = "") => origin.replace(/\/$/, "");

const localOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

const configuredOrigins = [env.clientUrl, ...env.clientUrls].map(normalizeOrigin);

export const allowedOrigins = Array.from(
  new Set([...configuredOrigins, ...localOrigins].filter(Boolean))
);

const isLocalDevOrigin = (origin = "") => {
  const normalized = normalizeOrigin(origin);
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized);
};

export const isAllowedOrigin = (origin = "") => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(normalizeOrigin(origin)) || isLocalDevOrigin(origin);
};

export const corsOriginHandler = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
};
