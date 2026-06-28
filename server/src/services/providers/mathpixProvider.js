const { env } = require("../../config/env");

function isConfigured() {
  return Boolean(
    env.mathpix.appId
    && env.mathpix.appKey
    && env.mathpix.baseUrl
  );
}

function getModelName() {
  return "mathpix-v3-text";
}

async function callRecognize(messages) {
  if (!isConfigured()) {
    const error = new Error("Mathpix 未配置。");
    error.code = "PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  // Extract base64 data URL from messages
  var imageUrl = null;
  if (Array.isArray(messages)) {
    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      var content = msg && msg.content;
      if (Array.isArray(content)) {
        for (var j = 0; j < content.length; j++) {
          var part = content[j];
          if (part && part.type === "image_url" && part.image_url && part.image_url.url) {
            imageUrl = part.image_url.url;
            break;
          }
        }
      }
      if (imageUrl) break;
    }
  }

  if (!imageUrl) {
    const error = new Error("Mathpix: 未找到图片数据。");
    error.code = "MISSING_IMAGE";
    throw error;
  }

  var response;
  try {
    response = await fetch(env.mathpix.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "app_id": env.mathpix.appId,
        "app_key": env.mathpix.appKey,
      },
      body: JSON.stringify({ src: imageUrl }),
    });
  } catch (fetchError) {
    const error = new Error("Mathpix 网络请求失败。");
    error.code = "MATH_PIX_NETWORK";
    throw error;
  }

  if (!response.ok) {
    const error = new Error("Mathpix 返回错误 " + response.status);
    error.code = "MATH_PIX_API_" + response.status;
    throw error;
  }

  var data;
  try {
    data = await response.json();
  } catch {
    const error = new Error("Mathpix 返回数据格式异常。");
    error.code = "MATH_PIX_PARSE";
    throw error;
  }

  // Normalize to internal recognition structure
  var recognizedText = data.text || "";
  var latexStyled = data.latex_styled || "";
  var mathpixMarkdown = data.mmd || "";

  // Use text as primary; latex_styled and mmd as supplemental
  if (!recognizedText || recognizedText.trim().length < 3) {
    recognizedText = latexStyled || mathpixMarkdown || recognizedText;
  }

  var imageQuality = "medium";
  if (data.confidence && typeof data.confidence === "number") {
    imageQuality = data.confidence > 0.85 ? "high" : data.confidence > 0.5 ? "medium" : "low";
  } else if (data.error) {
    imageQuality = "low";
  }

  var warnings = [];
  if (data.error) warnings.push(data.error);
  if (!recognizedText || recognizedText.trim().length < 3) warnings.push("Mathpix 识别文本可能不完整");

  return {
    requestId: data.request_id || null,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    parsed: {
      recognizedText: recognizedText.trim(),
      formulaText: latexStyled.trim(),
      imageQuality: imageQuality,
      warnings: warnings,
      rawProvider: "mathpix",
    },
  };
}

module.exports = {
  name: "mathpix",
  isConfigured,
  getModelName,
  callRecognize,
};