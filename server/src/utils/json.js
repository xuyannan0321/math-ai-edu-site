function extractJsonObject(text) {
  const value = String(text || "").trim();

  if (!value) {
    throw new Error("模型返回为空。");
  }

  try {
    return JSON.parse(value);
  } catch {
    const codeFenceMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (codeFenceMatch) {
      return JSON.parse(codeFenceMatch[1].trim());
    }

    const firstBrace = value.indexOf("{");
    const lastBrace = value.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(value.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("模型返回不是合法 JSON。");
  }
}

function truncateForLog(value, maxLength = 480) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

module.exports = {
  extractJsonObject,
  truncateForLog,
};
