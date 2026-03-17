import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value = "") => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const env = {
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI || process.env.DB_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  judge0ApiUrl: process.env.JUDGE0_API_URL || "https://ce.judge0.com",
  judge0ApiKey: process.env.JUDGE0_API_KEY || "",
  judge0ApiHost: process.env.JUDGE0_API_HOST || "",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientUrls: toList(process.env.CLIENT_URLS || ""),
  nodeEnv: process.env.NODE_ENV || "development",
};

export const validateEnv = () => {
  const missing = [];

  if (!env.mongoUri) missing.push("MONGO_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};
