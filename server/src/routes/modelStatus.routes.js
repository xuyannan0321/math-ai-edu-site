const express = require("express");
const { env } = require("../config/env");

const router = express.Router();

function isTextConfigured(config) {
  return Boolean(config.apiKey && config.baseUrl && config.model);
}

function isVisionConfigured(config) {
  return Boolean(config.apiKey && config.baseUrl && config.visionModel);
}

function getTextMessage(config, displayName) {
  if (isTextConfigured(config)) {
    return "文字模型可用";
  }

  if (!config.apiKey) {
    return `${displayName} 未配置`;
  }

  if (!config.baseUrl || !config.model) {
    return `${displayName} 模型服务配置不完整`;
  }

  return `${displayName} 暂不可用`;
}

function getVisionMessage(config, displayName, supportsVision = true) {
  if (!supportsVision) {
    return `${displayName} 暂不支持图片识题`;
  }

  if (isVisionConfigured(config)) {
    return "视觉模型可用";
  }

  if (!config.apiKey) {
    return `${displayName} 未配置`;
  }

  if (!config.baseUrl || !config.visionModel) {
    return `${displayName} 视觉模型配置不完整`;
  }

  return `${displayName} 视觉模型暂不可用`;
}

function buildProviderStatus({
  id,
  name,
  config,
  supportsVision = true,
}) {
  return {
    id,
    name,
    textConfigured: isTextConfigured(config),
    visionConfigured: supportsVision ? isVisionConfigured(config) : false,
    textModel: config.model || "",
    visionModel: supportsVision ? config.visionModel || "" : "",
    message: getTextMessage(config, name),
    visionMessage: getVisionMessage(config, name, supportsVision),
  };
}

router.get("/models/status", (req, res) => {
  const providers = [
    buildProviderStatus({
      id: "dashscope",
      name: "阿里通义 Qwen",
      config: env.ai.dashscope,
    }),
    buildProviderStatus({
      id: "deepseek",
      name: "DeepSeek",
      config: env.ai.deepseek,
      supportsVision: false,
    }),
    buildProviderStatus({
      id: "openai",
      name: "GPT",
      config: env.ai.openai,
    }),
    buildProviderStatus({
      id: "gemini",
      name: "Gemini",
      config: env.ai.gemini,
    }),
  ];

  res.json({
    success: true,
    data: {
      providers,
    },
  });
});

module.exports = router;
