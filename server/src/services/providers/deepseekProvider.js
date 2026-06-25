const { env } = require("../../config/env");
const { callJsonChatCompletion } = require("./openAiCompatible");

function isConfigured() {
  return Boolean(env.ai.deepseek.apiKey && env.ai.deepseek.baseUrl && env.ai.deepseek.model);
}

function getModelName() {
  return env.ai.deepseek.model;
}

async function callSolve(messages) {
  if (!isConfigured()) {
    const error = new Error("DeepSeek API Key 未配置。");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  return callJsonChatCompletion({
    providerLabel: "DeepSeek",
    apiKey: env.ai.deepseek.apiKey,
    baseUrl: env.ai.deepseek.baseUrl,
    model: getModelName(),
    messages,
  });
}

module.exports = {
  name: "deepseek",
  isConfigured,
  getModelName,
  callSolve,
};
