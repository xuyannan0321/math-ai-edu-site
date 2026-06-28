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
      preferredVisionProvider: asString(body.preferredVisionProvider, "auto"),
      preferredSolveProvider: asString(body.preferredSolveProvider, "auto"),
    },
  };
}

function detectMultipleQuestions(text) {
  const normalized = asString(text)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");

  if (!normalized) {
    return false;
  }

  const markers = [
    /(?:^|\n)\s*(?:\d{1,2}|[一二三四五六七八九十]+)[\.．、)]\s*\S/g,
    /(?:^|\n)\s*\(\s*\d{1,2}\s*\)\s*\S/g,
    /(?:^|\n)\s*第\s*[一二三四五六七八九十\d]+\s*[题問问]\s*/g,
    /(?:^|\n)\s*[（(]\s*[一二三四五六七八九十\d]+\s*[）)]\s*\S/g,
  ];
  const markerCount = markers.reduce((count, pattern) => {
    const matches = normalized.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
  const mathCommandCount = (normalized.match(/\\(?:frac|sqrt|angle|triangle|overline|begin)\b/g) || []).length;
  const lineCount = normalized.split("\n").filter((line) => line.trim().length >= 8).length;

  return markerCount >= 3 || (markerCount >= 2 && lineCount >= 5) || (lineCount >= 8 && mathCommandCount >= 5);
}

function buildPartialRecognitionResponse({
  recognizedText,
  visionResult,
  imageQuality,
  warnings = [],
  reviewReason,
  solveError = "",
}) {
  return {
    recognizedText,
    visionProvider: visionResult.provider,
    visionModelName: visionResult.modelName,
    imageQuality: imageQuality || visionResult.result.imageQuality || "medium",
    warnings,
    partial: true,
    needsUserReview: true,
    canRetryWithEditedText: true,
    reviewReason,
    solveError,
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

    // Partial recognition: return draft for user review instead of blocking.
    if (recognizedText.length < 4) {
      return sendSuccess(res, buildPartialRecognitionResponse({
        recognizedText,
        visionResult,
        imageQuality: "low",
        warnings: visionResult.result.warnings || ["识别文本可能不完整，请核对后继续。"],
        reviewReason: "too_short",
      }));
    }

    if (detectMultipleQuestions(recognizedText)) {
      return sendSuccess(res, buildPartialRecognitionResponse({
        recognizedText,
        visionResult,
        imageQuality: visionResult.result.imageQuality || "medium",
        warnings: [
          ...(visionResult.result.warnings || []),
          "识别结果疑似包含整页多题。请裁剪单题，或在草稿中只保留一个小题后重新解析。",
        ],
        reviewReason: "multiple_questions",
      }));
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
      return sendSuccess(res, buildPartialRecognitionResponse({
        recognizedText,
        visionResult,
        warnings: visionResult.result.warnings || [],
        reviewReason: "solve_failed",
        solveError: error.expose ? error.message : "生成解析失败，请修改识别文本后重新解析。",
      }));
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
