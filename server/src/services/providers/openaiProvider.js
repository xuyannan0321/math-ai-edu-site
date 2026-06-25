const { env } = require("../../config/env");

function isConfigured() {
  return Boolean(env.ai.openai.apiKey);
}

function getModelName() {
  return env.ai.openai.model;
}

async function callSolve() {
  const error = new Error("OpenAI provider 已预留，将在后续阶段接入。");
  error.code = "PROVIDER_RESERVED";
  throw error;
}

module.exports = {
  name: "openai",
  isConfigured,
  getModelName,
  callSolve,
};
