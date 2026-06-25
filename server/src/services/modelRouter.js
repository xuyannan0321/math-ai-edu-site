const pool = require("../db/pool");
const { truncateForLog } = require("../utils/json");
const { buildSolveMessages } = require("./solvePrompt");
const { normalizeSolution } = require("./solveSchema");
const dashscopeProvider = require("./providers/dashscopeProvider");
const deepseekProvider = require("./providers/deepseekProvider");
const openaiProvider = require("./providers/openaiProvider");
const geminiProvider = require("./providers/geminiProvider");

const PROVIDERS = [dashscopeProvider, deepseekProvider, openaiProvider, geminiProvider];
const DAILY_SOLVE_LIMIT = 20;

function orderProviders(preferredProvider) {
  const preferred = String(preferredProvider || "").trim().toLowerCase();
  const ordered = [...PROVIDERS];
  const preferredIndex = ordered.findIndex((provider) => provider.name === preferred);

  if (preferredIndex > 0) {
    const [provider] = ordered.splice(preferredIndex, 1);
    ordered.unshift(provider);
  }

  return ordered;
}

async function countTodaySuccessfulSolves(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM model_calls
      WHERE user_id = :userId
        AND stage = 'solve'
        AND success = 1
        AND DATE(created_at) = CURRENT_DATE`,
    { userId },
  );

  return Number(rows[0]?.total || 0);
}

async function insertModelCallLog({
  userId,
  stage = "solve",
  provider,
  modelName,
  success,
  requestId = null,
  fallbackFrom = null,
  usage = {},
  latencyMs,
  errorCode = null,
  errorMessage = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO model_calls
      (user_id, stage, provider, model_name, request_id, success, fallback_from,
       prompt_tokens, completion_tokens, total_tokens, latency_ms, error_code, error_message)
     VALUES
      (:userId, :stage, :provider, :modelName, :requestId, :success, :fallbackFrom,
       :promptTokens, :completionTokens, :totalTokens, :latencyMs, :errorCode, :errorMessage)`,
    {
      userId,
      stage,
      provider,
      modelName,
      requestId,
      success: success ? 1 : 0,
      fallbackFrom,
      promptTokens: usage.prompt_tokens ?? null,
      completionTokens: usage.completion_tokens ?? null,
      totalTokens: usage.total_tokens ?? null,
      latencyMs,
      errorCode: errorCode ? truncateForLog(errorCode, 60) : null,
      errorMessage: errorMessage ? truncateForLog(errorMessage, 500) : null,
    },
  );

  return result.insertId;
}

async function attachRecordToModelCall(modelCallId, recordId) {
  if (!modelCallId || !recordId) {
    return;
  }

  await pool.execute(
    "UPDATE model_calls SET solve_record_id = :recordId WHERE id = :modelCallId",
    { recordId, modelCallId },
  );
}

async function runSolve({ userId, preferredProvider, input }) {
  const usedToday = await countTodaySuccessfulSolves(userId);

  if (usedToday >= DAILY_SOLVE_LIMIT) {
    const error = new Error("今日 AI 解题次数已达 20 次，请明天再试。");
    error.statusCode = 429;
    throw error;
  }

  const messages = buildSolveMessages(input);
  const providers = orderProviders(preferredProvider);
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
      const providerResult = await provider.callSolve(messages);
      const latencyMs = Date.now() - startedAt;
      const modelCallId = await insertModelCallLog({
        userId,
        provider: provider.name,
        modelName,
        success: true,
        requestId: providerResult.requestId,
        fallbackFrom,
        usage: providerResult.usage,
        latencyMs,
      });
      const result = normalizeSolution(providerResult.parsed, input);

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
        provider: provider.name,
        modelName,
        success: false,
        fallbackFrom,
        latencyMs,
        errorCode: error.code || "MODEL_CALL_FAILED",
        errorMessage: error.message,
      });

      fallbackFrom = provider.name;
    }
  }

  const message = skippedProviders.length === PROVIDERS.length
    ? "暂未配置可用的大模型 API Key，请先在 server/.env 中配置 DASHSCOPE_API_KEY。"
    : "当前可用模型调用失败，请稍后再试。";
  const error = new Error(message);
  error.statusCode = 503;
  error.expose = true;
  error.details = errors;
  throw error;
}

module.exports = {
  DAILY_SOLVE_LIMIT,
  runSolve,
  attachRecordToModelCall,
};
