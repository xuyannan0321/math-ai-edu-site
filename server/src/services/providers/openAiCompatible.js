const { extractJsonObject } = require("../../utils/json");

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "");
}

function getChatCompletionsUrl(baseUrl) {
  return `${normalizeBaseUrl(baseUrl)}/chat/completions`;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    const body = {
      model,
      messages,
      temperature,
    };

    if (responseFormat) {
      body.response_format = { type: "json_object" };
    }

    response = await fetch(getChatCompletionsUrl(baseUrl), {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
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

  const responseText = await response.text();
  let payload = null;

  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message || payload?.error?.message || `${providerLabel} 调用失败。`,
    );
    error.code = payload?.code || payload?.error?.code || `HTTP_${response.status}`;
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
};
