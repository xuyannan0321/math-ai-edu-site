const crypto = require("node:crypto");
const pool = require("../db/pool");

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
      title: solution.title,
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

module.exports = {
  createSolveRecord,
  createAttachmentMetadata,
};
