const { extractJsonObject } = require("../../utils/json");

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").trim().replace(/\/+$/, "");
}

function getChatCompletionsUrl(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);

  if (!normalized) {
    return "";
  }

  if (/\/chat\/completions$/i.test(normalized)) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

function sanitizeErrorMessage(message, providerLabel) {
  const fallback = `${providerLabel} 调用失败。`;
  const value = String(message || fallback)
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer ***")
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[remote endpoint]")
    .replace(
      /(api[_-]?key|authorization|jwt_secret|db_password)\s*[:=]\s*[^\s,;]+/gi,
      "$1=***",
    )
    .trim();

  return (value || fallback).slice(0, 300);
}

function readMessageContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        return part?.text || "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function readErrorMessage(payload, responseText, providerLabel) {
  return sanitizeErrorMessage(
    payload?.message ||
      payload?.error?.message ||
      payload?.error ||
      responseText ||
      `${providerLabel} 调用失败。`,
    providerLabel,
  );
}

function readErrorCode(payload, status) {
  return payload?.code || payload?.error?.code || `HTTP_${status}`;
}

function isResponseFormatCompatibilityError({ status, message, code }) {
  if (status !== 400) {
    return false;
  }

  const text = `${message || ""} ${code || ""}`.toLowerCase();
  const keywords = [
    "response_format",
    "json_object",
    "unsupported",
    "not support",
    "not supported",
    "invalid parameter",
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

async function postChatCompletion({
  providerLabel,
  apiKey,
  url,
  body,
  timeoutMs,
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const responseText = await response.text();
    let payload = null;

    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      payload = null;
    }

    return {
      response,
      responseText,
      payload,
    };
  } catch (error) {
    const wrapped = new Error(
      error.name === "AbortError"
        ? `${providerLabel} 调用超时。`
        : `${providerLabel} 网络请求失败。`,
    );
    wrapped.code = error.name === "AbortError" ? "MODEL_TIMEOUT" : "MODEL_NETWORK_ERROR";
    throw wrapped;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callJsonChatCompletion({
  providerLabel,
  apiKey,
  baseUrl,
  model,
  messages,
  temperature = 0.2,
  timeoutMs = 60000,
  responseFormat = true,
}) {
  if (!apiKey || !baseUrl || !model) {
    const error = new Error(`${providerLabel} 未配置完整。`);
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  const url = getChatCompletionsUrl(baseUrl);
  const baseBody = {
    model,
    messages,
    temperature,
  };
  const firstBody = responseFormat
    ? { ...baseBody, response_format: { type: "json_object" } }
    : baseBody;
  let { response, responseText, payload } = await postChatCompletion({
    providerLabel,
    apiKey,
    url,
    body: firstBody,
    timeoutMs,
  });

  if (!response.ok && responseFormat) {
    const message = readErrorMessage(payload, responseText, providerLabel);
    const code = readErrorCode(payload, response.status);

    if (isResponseFormatCompatibilityError({ status: response.status, message, code })) {
      ({ response, responseText, payload } = await postChatCompletion({
        providerLabel,
        apiKey,
        url,
        body: baseBody,
        timeoutMs,
      }));
    }
  }

  if (!response.ok) {
    const message = readErrorMessage(payload, responseText, providerLabel);
    const code = readErrorCode(payload, response.status);
    const friendlyMessage = isResponseFormatCompatibilityError({
      status: response.status,
      message,
      code,
    })
      ? "当前模型不支持结构化 JSON 输出，请切换模型或使用自动推荐。"
      : message;
    const error = new Error(friendlyMessage);
    error.code = code;
    throw error;
  }

  const content = readMessageContent(payload);

  if (!content) {
    const error = new Error(`${providerLabel} 返回内容为空。`);
    error.code = "EMPTY_MODEL_RESPONSE";
    throw error;
  }

  return {
    raw: payload,
    parsed: extractJsonObject(content),
    usage: payload?.usage || {},
    requestId: payload?.request_id || payload?.id || null,
  };
}

module.exports = {
  callJsonChatCompletion,
  getChatCompletionsUrl,
};
