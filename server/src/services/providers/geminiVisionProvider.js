const { env } = require("../../config/env");
const { callJsonChatCompletion } = require("./openAiCompatible");

function isConfigured() {
  return Boolean(env.ai.gemini.apiKey && env.ai.gemini.baseUrl && env.ai.gemini.visionModel);
}

function getModelName() {
  return env.ai.gemini.visionModel;
}

async function callRecognize(messages) {
  if (!isConfigured()) {
    const error = new Error("Gemini Vision 未配置。");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  return callJsonChatCompletion({
    providerLabel: "Gemini Vision",
    apiKey: env.ai.gemini.apiKey,
    baseUrl: env.ai.gemini.baseUrl,
    model: getModelName(),
    messages,
    temperature: 0.1,
  });
}

module.exports = {
  name: "gemini-vision",
  isConfigured,
  getModelName,
  callRecognize,
};
