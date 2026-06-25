const { env } = require("../../config/env");
const { extractJsonObject } = require("../../utils/json");

const PROVIDER_NAME = "dashscope";

function isConfigured() {
  return Boolean(env.ai.dashscope.apiKey);
}

function getModelName() {
  return env.ai.dashscope.model;
}

function getChatCompletionsUrl() {
  return `${env.ai.dashscope.baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

async function callSolve(messages) {
  if (!isConfigured()) {
    const error = new Error("DashScope API Key 未配置。");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  let response;

  try {
    response = await fetch(getChatCompletionsUrl(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.ai.dashscope.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getModelName(),
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
  } catch (error) {
    const wrapped = new Error(
      error.name === "AbortError" ? "DashScope 调用超时。" : "DashScope 网络请求失败。",
    );
    wrapped.code = error.name === "AbortError" ? "MODEL_TIMEOUT" : "MODEL_NETWORK_ERROR";
    throw wrapped;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error?.message || "DashScope 调用失败。");
    error.code = payload?.code || payload?.error?.code || `HTTP_${response.status}`;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    const error = new Error("DashScope 返回内容为空。");
    error.code = "EMPTY_MODEL_RESPONSE";
    throw error;
  }

  return {
    raw: payload,
    parsed: extractJsonObject(content),
    usage: payload.usage || {},
    requestId: payload.request_id || payload.id || null,
  };
}

module.exports = {
  name: PROVIDER_NAME,
  isConfigured,
  getModelName,
  callSolve,
};
