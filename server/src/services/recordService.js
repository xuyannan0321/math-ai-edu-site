const pool = require("../db/pool");

async function createSolveRecord({
  userId,
  libraryType,
  solution,
  htmlResult,
  questionType,
}) {
  const [result] = await pool.execute(
    `INSERT INTO solve_records
      (user_id, library_type, title, problem_text, grade_level, subject, topic,
       knowledge_points, analysis, steps, final_answer, common_mistakes, verification,
       visualization_spec, quality_check, source_code, question_type, is_favorite, publish_status)
     VALUES
      (:userId, :libraryType, :title, :problemText, :gradeLevel, :subject, :topic,
       :knowledgePoints, :analysis, :steps, :finalAnswer, :commonMistakes, :verification,
       :visualizationSpec, :qualityCheck, :sourceCode, :questionType, 0, 'draft')`,
    {
      userId,
      libraryType,
      title: solution.title,
      problemText: solution.problemText,
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

module.exports = {
  createSolveRecord,
};
