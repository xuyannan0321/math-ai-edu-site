const { env } = require("../../config/env");

function isConfigured() {
  return Boolean(env.ai.gemini.apiKey);
}

function getModelName() {
  return env.ai.gemini.model;
}

async function callSolve() {
  const error = new Error("Gemini provider 已预留，将在后续阶段接入。");
  error.code = "PROVIDER_RESERVED";
  throw error;
}

module.exports = {
  name: "gemini",
  isConfigured,
  getModelName,
  callSolve,
};
