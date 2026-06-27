const path = require("node:path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

function parsePort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
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
    dailyLimit: parsePort(process.env.DAILY_AI_LIMIT, 20),
    dashscope: {
      apiKey: process.env.DASHSCOPE_API_KEY || "",
      baseUrl: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: process.env.DASHSCOPE_MODEL || "qwen-plus",
      visionModel: process.env.DASHSCOPE_VISION_MODEL || "",
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      baseUrl: process.env.OPENAI_BASE_URL || "",
      model: process.env.OPENAI_MODEL || "",
      visionModel: process.env.OPENAI_VISION_MODEL || "",
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || "",
      baseUrl: process.env.GEMINI_BASE_URL || "",
      model: process.env.GEMINI_MODEL || "",
      visionModel: process.env.GEMINI_VISION_MODEL || "",
    },
  },
  mathpix: {
    appId: process.env.MATHPIX_APP_ID || '',
    appKey: process.env.MATHPIX_APP_KEY || '',
    baseUrl: process.env.MATHPIX_BASE_URL || 'https://api.mathpix.com/v3/text',
  },
  ocr: {
    providerPriority: (process.env.OCR_PROVIDER_PRIORITY || 'mathpix,qwen-vl,openai-vision,gemini-vision').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
  },
  upload: {
    maxImageSizeMb: parsePositiveNumber(process.env.MAX_IMAGE_SIZE_MB, 3),
  },
};

env.upload.maxImageSizeBytes = Math.round(env.upload.maxImageSizeMb * 1024 * 1024);

function assertRuntimeEnv() {
  if (!env.jwtSecret || env.jwtSecret === "replace-with-a-long-random-secret") {
    throw new Error("请先在 server/.env 中配置安全的 JWT_SECRET。");
  }
}

module.exports = {
  env,
  assertRuntimeEnv,
};
