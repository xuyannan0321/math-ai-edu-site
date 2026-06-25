function asString(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim() || fallback;
}

function asStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function buildImageRecognitionMessages({
  imageDataUrl,
  subject = "数学",
  gradeLevel = "初中",
  questionType = "综合",
}) {
  const prompt = [
    "你是原题真解 Pro 的数学题图片识别助手。",
    "本阶段只做题目识别，不要完整解题。",
    "请只完成两件事：",
    "1. 识别图片中的数学题文字；",
    "2. 尽量保留原题结构、公式、选项、图形条件说明。",
    "",
    `默认科目：${subject || "数学"}`,
    `默认学段：${gradeLevel || "初中"}`,
    `默认题型：${questionType || "综合"}`,
    "",
    "规则：",
    "1. 不要编造图片里没有的条件；",
    "2. 看不清的地方用“【此处不清晰】”标记；",
    "3. 如果图片不是数学题，请在 recognizedText 中友好说明；",
    "4. 不要在识图阶段给出完整解题过程；",
    "5. 返回必须是纯 JSON，不要包含 Markdown、代码块或额外说明。",
    "",
    "请严格返回：",
    "{",
    '  "recognizedText": "识别出的题目文字",',
    '  "subject": "数学",',
    '  "gradeLevel": "初中",',
    '  "questionType": "代数|几何|函数|综合",',
    '  "imageQuality": "low|medium|high",',
    '  "warnings": []',
    "}",
  ].join("\n");

  return [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: imageDataUrl,
          },
        },
      ],
    },
  ];
}

function normalizeVisionResult(raw, fallback = {}) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const imageQuality = ["low", "medium", "high"].includes(source.imageQuality)
    ? source.imageQuality
    : "medium";

  return {
    recognizedText: asString(source.recognizedText),
    subject: asString(source.subject, fallback.subject || "数学"),
    gradeLevel: asString(source.gradeLevel, fallback.gradeLevel || "初中"),
    questionType: asString(source.questionType, fallback.questionType || "综合"),
    imageQuality,
    warnings: asStringArray(source.warnings),
  };
}

module.exports = {
  buildImageRecognitionMessages,
  normalizeVisionResult,
};
