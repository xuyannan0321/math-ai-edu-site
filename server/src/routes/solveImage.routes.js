const express = require("express");
const { authRequired } = require("../middleware/auth");
const { uploadProblemImage } = require("../middleware/upload");
const { createHttpError, sendSuccess } = require("../utils/response");
const { runImageRecognition } = require("../services/visionRouter");
const { runSolve, attachRecordToModelCall } = require("../services/modelRouter");
const { createSolveRecord, createAttachmentMetadata } = require("../services/recordService");
const { buildHtmlResult } = require("../services/htmlResult");

const router = express.Router();

function asString(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim() || fallback;
}

function validateImageInput(body) {
  const libraryType = asString(body.libraryType, "original");

  if (!["original", "strategy"].includes(libraryType)) {
    return { valid: false, message: "保存位置只能是 original 或 strategy。" };
  }

  return {
    valid: true,
    data: {
      subject: asString(body.subject, "数学"),
      gradeLevel: asString(body.gradeLevel, "初中"),
      questionType: asString(body.questionType, "综合"),
      libraryType,
      preferredVisionProvider: asString(body.preferredVisionProvider, "qwen-vl"),
      preferredSolveProvider: asString(body.preferredSolveProvider, "dashscope"),
    },
  };
}

router.post("/solve-image", authRequired, uploadProblemImage, async (req, res, next) => {
  try {
    const validated = validateImageInput(req.body || {});

    if (!validated.valid) {
      throw createHttpError(400, validated.message);
    }

    const input = validated.data;
    const visionResult = await runImageRecognition({
      userId: req.user.id,
      file: req.file,
      preferredProvider: input.preferredVisionProvider,
      input,
    });
    const recognizedText = visionResult.result.recognizedText.trim();

    if (recognizedText.length < 4) {
      return res.status(422).json({
        success: false,
        message: "图片中的题目文字不够清晰，请换一张更清楚的图片，或手动输入题目后解析。",
        data: {
          recognizedText,
          visionProvider: visionResult.provider,
          visionModelName: visionResult.modelName,
          imageQuality: visionResult.result.imageQuality,
          warnings: visionResult.result.warnings,
        },
      });
    }

    let solveResult;

    try {
      solveResult = await runSolve({
        userId: req.user.id,
        preferredProvider: input.preferredSolveProvider,
        input: {
          questionText: recognizedText,
          subject: visionResult.result.subject || input.subject,
          gradeLevel: visionResult.result.gradeLevel || input.gradeLevel,
          questionType: visionResult.result.questionType || input.questionType,
          libraryType: input.libraryType,
          preferredProvider: input.preferredSolveProvider,
        },
      });
    } catch (error) {
      return res.status(error.statusCode || 503).json({
        success: false,
        message: "题目已识别，但生成解析失败。你可以修改识别文本后重新解析。",
        data: {
          recognizedText,
          visionProvider: visionResult.provider,
          visionModelName: visionResult.modelName,
          imageQuality: visionResult.result.imageQuality,
          warnings: visionResult.result.warnings,
        },
      });
    }

    const htmlResult = buildHtmlResult(solveResult.result);
    let recordId;

    try {
      recordId = await createSolveRecord({
        userId: req.user.id,
        libraryType: input.libraryType,
        solution: solveResult.result,
        htmlResult,
        questionType: solveResult.result.topic || input.questionType,
        recognizedText,
      });
    } catch (error) {
      error.statusCode = 500;
      error.message = "AI 已生成解析，但保存到数据库失败，请稍后重试。";
      error.expose = true;
      throw error;
    }

    await Promise.allSettled([
      attachRecordToModelCall(visionResult.modelCallId, recordId),
      attachRecordToModelCall(solveResult.modelCallId, recordId),
      createAttachmentMetadata({
        userId: req.user.id,
        recordId,
        file: req.file,
      }),
    ]);

    return sendSuccess(res, {
      recordId,
      recognizedText,
      visionProvider: visionResult.provider,
      visionModelName: visionResult.modelName,
      solveProvider: solveResult.provider,
      modelName: solveResult.modelName,
      imageQuality: visionResult.result.imageQuality,
      warnings: visionResult.result.warnings,
      result: solveResult.result,
      htmlResult,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
