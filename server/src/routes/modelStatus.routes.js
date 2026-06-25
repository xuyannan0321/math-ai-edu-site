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

router.get("/models/status", (req, res) => {
  const providers = [
    {
      id: "dashscope",
      name: "阿里通义 Qwen",
      textConfigured: isTextConfigured(env.ai.dashscope),
      visionConfigured: isVisionConfigured(env.ai.dashscope),
      message: getTextMessage(env.ai.dashscope, "阿里通义 Qwen"),
      visionMessage: getVisionMessage(env.ai.dashscope, "阿里通义 Qwen"),
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      textConfigured: isTextConfigured(env.ai.deepseek),
      visionConfigured: false,
      message: getTextMessage(env.ai.deepseek, "DeepSeek"),
      visionMessage: getVisionMessage(env.ai.deepseek, "DeepSeek", false),
    },
    {
      id: "openai",
      name: "GPT",
      textConfigured: isTextConfigured(env.ai.openai),
      visionConfigured: isVisionConfigured(env.ai.openai),
      message: getTextMessage(env.ai.openai, "GPT"),
      visionMessage: getVisionMessage(env.ai.openai, "GPT"),
    },
    {
      id: "gemini",
      name: "Gemini",
      textConfigured: isTextConfigured(env.ai.gemini),
      visionConfigured: isVisionConfigured(env.ai.gemini),
      message: getTextMessage(env.ai.gemini, "Gemini"),
      visionMessage: getVisionMessage(env.ai.gemini, "Gemini"),
    },
  ];

  res.json({
    success: true,
    data: {
      providers,
    },
  });
});

module.exports = router;
