const { env } = require("../../config/env");
const { callJsonChatCompletion } = require("./openAiCompatible");

function isConfigured() {
  return Boolean(env.ai.openai.apiKey && env.ai.openai.baseUrl && env.ai.openai.visionModel);
}

function getModelName() {
  return env.ai.openai.visionModel;
}

async function callRecognize(messages) {
  if (!isConfigured()) {
    const error = new Error("GPT Vision 未配置。");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  return callJsonChatCompletion({
    providerLabel: "GPT Vision",
    apiKey: env.ai.openai.apiKey,
    baseUrl: env.ai.openai.baseUrl,
    model: getModelName(),
    messages,
    temperature: 0.1,
  });
}

module.exports = {
  name: "openai-vision",
  isConfigured,
  getModelName,
  callRecognize,
};
