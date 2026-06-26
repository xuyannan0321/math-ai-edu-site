const crypto = require("node:crypto");
const pool = require("../db/pool");


function generateShortTitle(title, problemText, questionType, topic) {
  var t = (title || "").trim();
  // If title is valid (not empty, not too generic, not too long)
  if (t && t.length >= 4 && t.length <= 24 && t !== "数学解析" && t !== "综合") {
    return t;
  }

  var text = problemText || "";
  var lines = text.split(/\n/).filter(Boolean);
  var firstLine = lines[0] || "";
  var cleanText = firstLine.replace(/^[\s\d.)、（）①②③④⑤]+/, "").trim();

  // Try to extract based on type
  var typeInfo = questionType || topic || "";

  // Function problems
  if (/函数/.test(typeInfo || cleanText)) {
    var funcMatch = cleanText.match(/(一次函数|二次函数|反比例函数|正比例函数|三角函数)[^，。]*/);
    if (funcMatch) {
      return truncateTitle(funcMatch[0], 20);
    }
    var funcGoal = cleanText.match(/(求[^，。]{1,12})/);
    if (funcGoal) return truncateTitle("函数" + funcGoal[1], 20);
  }

  // Equation problems
  if (/方程/.test(typeInfo || cleanText)) {
    var eqMatch = cleanText.match(/([一|二]元[一|二]次方程|分式方程|无理方程)[^，。]*/);
    if (eqMatch) {
      return truncateTitle(eqMatch[0], 20);
    }
    var eqSolve = cleanText.match(/(解[^，。]{1,10})/);
    if (eqSolve) return truncateTitle("方程" + eqSolve[1], 20);
    return "方程求解";
  }

  // Geometry problems
  if (/三角形|圆|几何|相似|全等|平行四边形|梯形/.test(typeInfo || cleanText)) {
    var geoMatch = cleanText.match(/(三角形|四边形|圆)[^，。]{0,14}/);
    if (geoMatch) {
      return truncateTitle(geoMatch[0], 20);
    }
    var geoObj = cleanText.match(/[△ABC][^，。]{0,14}/);
    if (geoObj) return truncateTitle(geoObj[0], 20);
    return "几何综合";
  }

  // Use first meaningful line
  if (cleanText) {
    return truncateTitle(cleanText.replace(/[=xXyY\d.\-+^]+/g, "").trim(), 18) || "数学解析";
  }

  return "数学解析";
}

function truncateTitle(text, maxLen) {
  var result = String(text || "").trim();
  if (result.length <= maxLen) return result;
  return result.substring(0, maxLen) + "…";
}

async function createSolveRecord({
  userId,
  libraryType,
  solution,
  htmlResult,
  questionType,
  recognizedText = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO solve_records
      (user_id, library_type, title, problem_text, recognized_text, grade_level, subject, topic,
       knowledge_points, analysis, steps, final_answer, common_mistakes, verification,
       visualization_spec, quality_check, source_code, question_type, is_favorite, publish_status)
     VALUES
      (:userId, :libraryType, :title, :problemText, :recognizedText, :gradeLevel, :subject, :topic,
       :knowledgePoints, :analysis, :steps, :finalAnswer, :commonMistakes, :verification,
       :visualizationSpec, :qualityCheck, :sourceCode, :questionType, 0, 'draft')`,
    {
      userId,
      libraryType,
      title: generateShortTitle(solution.title, solution.problemText, questionType, solution.topic),
      problemText: solution.problemText,
      recognizedText,
      gradeLevel: solution.gradeLevel,
      subject: solution.subject,
      topic: solution.topic,
      knowledgePoints: JSON.stringify(solution.knowledgePoints || []),
      analysis: solution.analysis,
      steps: JSON.stringify(solution.steps || []),
      finalAnswer: solution.finalAnswer,
      commonMistakes: JSON.stringify(solution.commonMistakes || []),
      verification: solution.verification,
      visualizationSpec: solution.visualizationSpec
        ? JSON.stringify(solution.visualizationSpec)
        : null,
      qualityCheck: JSON.stringify(solution.qualityCheck || {}),
      sourceCode: htmlResult,
      questionType,
    },
  );

  return result.insertId;
}

async function createAttachmentMetadata({ userId, recordId, file }) {
  const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");

  const [result] = await pool.execute(
    `INSERT INTO attachments
      (user_id, solve_record_id, file_type, original_name, mime_type, size_bytes,
       oss_bucket, oss_key, sha256, status)
     VALUES
      (:userId, :recordId, 'image', :originalName, :mimeType, :sizeBytes,
       NULL, NULL, :sha256, 'used')`,
    {
      userId,
      recordId,
      originalName: file.originalname || "uploaded-image",
      mimeType: file.mimetype,
      sizeBytes: file.size,
      sha256,
    },
  );

  return result.insertId;
}

function parseJsonField(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeRecord(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    knowledge_points: parseJsonField(row.knowledge_points, []),
    steps: parseJsonField(row.steps, []),
    common_mistakes: parseJsonField(row.common_mistakes, []),
    visualization_spec: parseJsonField(row.visualization_spec, null),
    quality_check: parseJsonField(row.quality_check, {}),
  };
}

function clampPageNumber(value, fallback = 1) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function clampPageSize(value, fallback = 20) {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number <= 0) {
    return fallback;
  }

  return Math.min(number, 50);
}

function createBadRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeUserId(value) {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number <= 0) {
    throw createBadRequest("用户身份信息不正确，请重新登录。");
  }

  return number;
}

function normalizeLibraryType(value) {
  const libraryType = String(value || "").trim();

  if (!["original", "strategy"].includes(libraryType)) {
    throw createBadRequest("题库类型只能是 original 或 strategy。");
  }

  return libraryType;
}

function assertSafeLimitOffset(limit, offset) {
  if (
    !Number.isSafeInteger(limit) ||
    limit <= 0 ||
    limit > 50 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    throw createBadRequest("分页参数不正确，请刷新后重试。");
  }
}

async function listSolveRecordsForUser({
  userId,
  libraryType,
  keyword = "",
  questionType = "",
  subject = "",
  page = 1,
  pageSize = 20,
}) {
  const safeUserId = normalizeUserId(userId);
  const safeLibraryType = normalizeLibraryType(libraryType);
  const safePage = clampPageNumber(page);
  const safePageSize = clampPageSize(pageSize);
  const offset = (safePage - 1) * safePageSize;
  assertSafeLimitOffset(safePageSize, offset);
  const where = [
    "user_id = :userId",
    "library_type = :libraryType",
    "deleted_at IS NULL",
  ];
  const params = {
    userId: safeUserId,
    libraryType: safeLibraryType,
  };

  const trimmedKeyword = String(keyword || "").trim();
  const trimmedQuestionType = String(questionType || "").trim();
  const trimmedSubject = String(subject || "").trim();

  if (trimmedKeyword) {
    where.push(
      `(title LIKE :keywordLike
        OR problem_text LIKE :keywordLike
        OR subject LIKE :keywordLike
        OR topic LIKE :keywordLike
        OR question_type LIKE :keywordLike
        OR final_answer LIKE :keywordLike)`,
    );
    params.keywordLike = `%${trimmedKeyword}%`;
  }

  if (trimmedQuestionType) {
    where.push("question_type = :questionType");
    params.questionType = trimmedQuestionType;
  }

  if (trimmedSubject) {
    where.push("subject = :subject");
    params.subject = trimmedSubject;
  }

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM solve_records
      WHERE ${whereSql}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT id, title, problem_text, grade_level, subject, topic, knowledge_points,
            final_answer, library_type, publish_status, is_favorite, visualization_spec,
            question_type, created_at
       FROM solve_records
      WHERE ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${safePageSize} OFFSET ${offset}`,
    params,
  );

  return {
    items: rows.map(normalizeRecord),
    total: Number(countRows[0]?.total || 0),
    page: safePage,
    pageSize: safePageSize,
  };
}

async function getSolveRecordForUser({ userId, recordId }) {
  const [rows] = await pool.execute(
    `SELECT *
       FROM solve_records
      WHERE id = :recordId
        AND user_id = :userId
        AND deleted_at IS NULL
      LIMIT 1`,
    { userId, recordId },
  );

  return normalizeRecord(rows[0]);
}

async function updateSolveRecordLibrary({ userId, recordId, libraryType }) {
  const [result] = await pool.execute(
    `UPDATE solve_records
        SET library_type = :libraryType
      WHERE id = :recordId
        AND user_id = :userId
        AND deleted_at IS NULL`,
    { userId, recordId, libraryType },
  );

  return result.affectedRows > 0;
}

module.exports = {
  createSolveRecord,
  createAttachmentMetadata,
  listSolveRecordsForUser,
  getSolveRecordForUser,
  updateSolveRecordLibrary,
};
