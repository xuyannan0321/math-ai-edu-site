const { env } = require("../../config/env");
const { callJsonChatCompletion } = require("./openAiCompatible");

function isConfigured() {
  return Boolean(
    env.ai.dashscope.apiKey
      && env.ai.dashscope.baseUrl
      && env.ai.dashscope.visionModel,
  );
}

function getModelName() {
  return env.ai.dashscope.visionModel;
}

async function callRecognize(messages) {
  if (!isConfigured()) {
    const error = new Error("Qwen-VL 未配置。");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  return callJsonChatCompletion({
    providerLabel: "Qwen-VL",
    apiKey: env.ai.dashscope.apiKey,
    baseUrl: env.ai.dashscope.baseUrl,
    model: getModelName(),
    messages,
    temperature: 0.1,
  });
}

module.exports = {
  name: "qwen-vl",
  isConfigured,
  getModelName,
  callRecognize,
};
