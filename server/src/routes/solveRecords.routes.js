const express = require("express");
const { authRequired } = require("../middleware/auth");
const { createHttpError, sendSuccess } = require("../utils/response");
const {
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

router.patch("/solve-records/:id/library", authRequired, async (req, res, next) => {
  try {
    const recordId = parseRecordId(req.params.id);

    if (!recordId) {
      throw createHttpError(400, "记录 ID 不正确。");
    }

    const libraryType = String(req.body?.libraryType || "").trim();

    if (!["original", "strategy"].includes(libraryType)) {
      throw createHttpError(400, "保存位置只能是 original 或 strategy。");
    }

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
