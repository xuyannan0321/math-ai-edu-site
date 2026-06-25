const { env } = require("../../config/env");

function isConfigured() {
  return Boolean(env.ai.deepseek.apiKey);
}

function getModelName() {
  return env.ai.deepseek.model;
}

async function callSolve() {
  const error = new Error("DeepSeek provider 已预留，将在后续阶段接入。");
  error.code = "PROVIDER_RESERVED";
  throw error;
}

module.exports = {
  name: "deepseek",
  isConfigured,
  getModelName,
  callSolve,
};
