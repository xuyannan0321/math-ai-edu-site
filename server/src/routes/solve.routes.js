const express = require("express");
const { authRequired } = require("../middleware/auth");
const { createHttpError, sendSuccess } = require("../utils/response");
const { validateQuestionInput } = require("../services/solveSchema");
const { runSolve, attachRecordToModelCall } = require("../services/modelRouter");
const { createSolveRecord } = require("../services/recordService");
const { buildHtmlResult } = require("../services/htmlResult");

const router = express.Router();

router.post("/solve-text", authRequired, async (req, res, next) => {
  try {
    const validated = validateQuestionInput(req.body || {});

    if (!validated.valid) {
      throw createHttpError(400, validated.message);
    }

    const input = validated.data;
    const solveResult = await runSolve({
      userId: req.user.id,
      preferredProvider: input.preferredProvider,
      input,
    });
    const htmlResult = buildHtmlResult(solveResult.result);

    let recordId;

    try {
      recordId = await createSolveRecord({
        userId: req.user.id,
        libraryType: input.libraryType,
        solution: solveResult.result,
        htmlResult,
        questionType: input.questionType,
      });
    } catch (error) {
      error.statusCode = 500;
      error.message = "AI 已生成解析，但保存到数据库失败，请稍后重试。";
      error.expose = true;
      throw error;
    }

    attachRecordToModelCall(solveResult.modelCallId, recordId).catch((error) => {
      console.error("Failed to attach solve record to model call:", error);
    });

    return sendSuccess(res, {
      recordId,
      provider: solveResult.provider,
      modelName: solveResult.modelName,
      result: solveResult.result,
      htmlResult,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
