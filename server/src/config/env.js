const path = require("node:path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

function parsePort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCorsOrigins(value) {
  return String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT, 3001),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parsePort(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "math_ai_edu",
    connectionLimit: parsePort(process.env.DB_CONNECTION_LIMIT, 10),
  },
  ai: {
    dashscope: {
      apiKey: process.env.DASHSCOPE_API_KEY || "",
      baseUrl: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: process.env.DASHSCOPE_MODEL || "qwen-plus",
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    },
  },
};

function assertRuntimeEnv() {
  if (!env.jwtSecret || env.jwtSecret === "replace-with-a-long-random-secret") {
    throw new Error("请先在 server/.env 中配置安全的 JWT_SECRET。");
  }
}

module.exports = {
  env,
  assertRuntimeEnv,
};
