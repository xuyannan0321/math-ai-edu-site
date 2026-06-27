const { insertModelCallLog } = require("./modelRouter");
const {
  buildImageRecognitionMessages,
  normalizeVisionResult,
} = require("./imagePrompt");
const mathpixProvider = require("./providers/mathpixProvider");
const qwenVlProvider = require("./providers/qwenVlProvider");
const geminiVisionProvider = require("./providers/geminiVisionProvider");
const gptVisionProvider = require("./providers/gptVisionProvider");

const VISION_PROVIDERS = [
  mathpixProvider,
  qwenVlProvider,
  geminiVisionProvider,
  gptVisionProvider,
];

function orderVisionProviders(preferredProvider) {
  const preferred = String(preferredProvider || "")
    .trim()
    .toLowerCase();
  const ordered = [...VISION_PROVIDERS];
  const preferredIndex = ordered.findIndex(
    (provider) => provider.name === preferred,
  );

  if (preferredIndex > 0) {
    const [provider] = ordered.splice(preferredIndex, 1);
    ordered.unshift(provider);
  }

  return ordered;
}

function buildDataUrl(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

async function runImageRecognition({ userId, file, preferredProvider, input }) {
  const imageDataUrl = buildDataUrl(file);
  const messages = buildImageRecognitionMessages({
    imageDataUrl,
    subject: input.subject,
    gradeLevel: input.gradeLevel,
    questionType: input.questionType,
  });
  const providers = orderVisionProviders(preferredProvider);
  const skippedProviders = [];
  const errors = [];
  let fallbackFrom = null;

  for (const provider of providers) {
    const modelName = provider.getModelName();

    if (!provider.isConfigured()) {
      skippedProviders.push(provider.name);
      continue;
    }

    const startedAt = Date.now();

    try {
      const providerResult = await provider.callRecognize(messages);
      const latencyMs = Date.now() - startedAt;
      const modelCallId = await insertModelCallLog({
        userId,
        stage: "recognition",
        provider: provider.name,
        modelName,
        success: true,
        requestId: providerResult.requestId,
        fallbackFrom,
        usage: providerResult.usage,
        latencyMs,
      });
      const result = normalizeVisionResult(providerResult.parsed, input);

      return {
        provider: provider.name,
        modelName,
        modelCallId,
        result,
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      errors.push(`${provider.name}: ${error.message}`);

      await insertModelCallLog({
        userId,
        stage: "recognition",
        provider: provider.name,
        modelName,
        success: false,
        fallbackFrom,
        latencyMs,
        errorCode: error.code || "VISION_CALL_FAILED",
        errorMessage: `image recognition: ${error.message}`,
      });

      fallbackFrom = provider.name;
    }
  }

  const message =
    skippedProviders.length === VISION_PROVIDERS.length
      ? "暂未配置可用的图片识别模型，请先在 server/.env 中配置 DASHSCOPE_VISION_MODEL 和对应 Key。"
      : "当前图片识别模型调用失败，请稍后再试。";
  const error = new Error(message);
  error.statusCode = 503;
  error.expose = true;
  error.details = errors;
  throw error;
}

module.exports = {
  runImageRecognition,
};
