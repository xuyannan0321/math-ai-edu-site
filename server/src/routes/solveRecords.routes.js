const express = require("express");
const { authRequired } = require("../middleware/auth");
const { createHttpError, sendSuccess } = require("../utils/response");
const {
  listSolveRecordsForUser,
  getSolveRecordForUser,
  updateSolveRecordLibrary,
} = require("../services/recordService");
const {
  buildWordHtmlDocument,
  buildGeoGebraXml,
} = require("../services/exportService");

const router = express.Router();

function parseRecordId(value) {
  const recordId = Number.parseInt(value, 10);

  return Number.isFinite(recordId) && recordId > 0 ? recordId : null;
}

function encodeDownloadFilename(filename) {
  return encodeURIComponent(filename).replaceAll("%20", " ");
}

function normalizeLibraryType(value, fallback = "original") {
  const libraryType = String(value || fallback).trim();

  if (!["original", "strategy"].includes(libraryType)) {
    throw createHttpError(400, "题库类型只能是 original 或 strategy。");
  }

  return libraryType;
}

function toIsoString(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function recordHasVisualization(record) {
  const spec = record.visualization_spec;

  if (!spec || typeof spec !== "object" || spec.type === "none") {
    return false;
  }

  const hasObjects = Array.isArray(spec.objects) && spec.objects.length > 0;
  const hasPoints =
    spec.points &&
    typeof spec.points === "object" &&
    !Array.isArray(spec.points) &&
    Object.keys(spec.points).length > 0;
  const hasViews = Array.isArray(spec.views) && spec.views.length > 0;

  return Boolean(hasObjects || hasPoints || hasViews);
}

function toListRecord(record) {
  return {
    id: record.id,
    title: record.title,
    problemText: record.problem_text,
    subject: record.subject,
    gradeLevel: record.grade_level,
    questionType: record.question_type,
    topic: record.topic,
    knowledgePoints: record.knowledge_points || [],
    finalAnswer: record.final_answer,
    libraryType: record.library_type,
    publishStatus: record.publish_status,
    isFavorite: Boolean(record.is_favorite),
    hasVisualization: recordHasVisualization(record),
    createdAt: toIsoString(record.created_at),
  };
}

function toDetailRecord(record) {
  const result = {
    title: record.title,
    problemText: record.problem_text,
    recognizedText: record.recognized_text || "",
    gradeLevel: record.grade_level,
    subject: record.subject,
    topic: record.topic,
    knowledgePoints: record.knowledge_points || [],
    analysis: record.analysis || "",
    steps: record.steps || [],
    finalAnswer: record.final_answer || "",
    commonMistakes: record.common_mistakes || [],
    verification: record.verification || "",
    visualizationSpec: record.visualization_spec || null,
    qualityCheck: record.quality_check || {},
  };

  return {
    id: record.id,
    recordId: record.id,
    libraryType: record.library_type,
    questionType: record.question_type,
    publishStatus: record.publish_status,
    isFavorite: Boolean(record.is_favorite),
    createdAt: toIsoString(record.created_at),
    result,
    htmlResult: record.source_code || "",
    sourceCode: record.source_code || "",
    visualizationSpec: record.visualization_spec || null,
  };
}

async function loadUserRecord(req) {
  const recordId = parseRecordId(req.params.id);

  if (!recordId) {
    throw createHttpError(400, "记录 ID 不正确。");
  }

  const record = await getSolveRecordForUser({
    userId: req.user.id,
    recordId,
  });

  if (!record) {
    throw createHttpError(404, "记录不存在，或你没有权限访问。");
  }

  return record;
}

router.get("/solve-records", authRequired, async (req, res, next) => {
  try {
    const libraryType = normalizeLibraryType(req.query.libraryType);
    const records = await listSolveRecordsForUser({
      userId: req.user.id,
      libraryType,
      keyword: req.query.keyword,
      questionType: req.query.questionType,
      subject: req.query.subject,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    return sendSuccess(res, {
      ...records,
      libraryType,
      items: records.items.map(toListRecord),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/solve-records/:id", authRequired, async (req, res, next) => {
  try {
    const record = await loadUserRecord(req);

    return sendSuccess(res, toDetailRecord(record));
  } catch (error) {
    return next(error);
  }
});

router.patch("/solve-records/:id/library", authRequired, async (req, res, next) => {
  try {
    const recordId = parseRecordId(req.params.id);

    if (!recordId) {
      throw createHttpError(400, "记录 ID 不正确。");
    }

    const libraryType = normalizeLibraryType(req.body?.libraryType, "");

    const updated = await updateSolveRecordLibrary({
      userId: req.user.id,
      recordId,
      libraryType,
    });

    if (!updated) {
      throw createHttpError(404, "记录不存在，或你没有权限操作。");
    }

    return sendSuccess(res, {
      recordId,
      libraryType,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/solve-records/:id/export/word", authRequired, async (req, res, next) => {
  try {
    const record = await loadUserRecord(req);
    const documentHtml = buildWordHtmlDocument(record);
    const filename = `math-solution-record-${record.id}.doc`;

    res.setHeader("Content-Type", "application/msword; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeDownloadFilename(filename)}`,
    );

    return res.send(documentHtml);
  } catch (error) {
    return next(error);
  }
});

router.get("/solve-records/:id/export/ggb", authRequired, async (req, res, next) => {
  try {
    const record = await loadUserRecord(req);
    const geogebraXml = buildGeoGebraXml(record);
    const filename = `math-solution-record-${record.id}-geogebra.xml`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeDownloadFilename(filename)}`,
    );

    return res.send(geogebraXml);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
