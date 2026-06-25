function buildSolveMessages({ questionText, subject, gradeLevel, questionType }) {
  const normalizedSubject = subject || "数学";
  const normalizedGrade = gradeLevel || "初中";
  const normalizedType = questionType || "综合";

  const systemPrompt = [
    "你是原题真解 Pro 的数学教研型 AI 老师。",
    "你的目标是帮助学生理解解题过程，而不是只给最终答案。",
    "请默认使用初中数学方法，避免向量、微积分、矩阵、高中复杂三角恒等变换和超纲解析几何技巧。",
    "如果题目条件不足，要明确指出条件不足，不要编造题目中没有的条件。",
    "公式可使用 LaTeX 文本，但最终响应必须是纯 JSON，不要包含 Markdown、代码块或额外说明。",
  ].join("\n");

  const userPrompt = [
    "请按教学结构解析下面的题目。",
    "",
    `学段：${normalizedGrade}`,
    `科目：${normalizedSubject}`,
    `题型：${normalizedType}`,
    "",
    "题目：",
    questionText,
    "",
    "请严格返回一个 JSON 对象，必须包含这些字段：",
    "{",
    '  "title": "简短标题",',
    '  "problemText": "整理后的题干",',
    '  "gradeLevel": "初中",',
    '  "subject": "数学",',
    '  "topic": "知识主题",',
    '  "knowledgePoints": ["知识点1"],',
    '  "analysis": "题意分析",',
    '  "steps": [{"title": "步骤标题", "content": "步骤内容"}],',
    '  "finalAnswer": "最终答案",',
    '  "commonMistakes": ["易错提醒"],',
    '  "verification": "验算或检查",',
    '  "visualizationSpec": {',
    '    "type": "equation_balance | function_graph | geometry | dynamic_point | number_line | none",',
    '    "title": "图示标题",',
    '    "description": "图示说明",',
    '    "objects": [],',
    '    "steps": [{"stepTitle": "步骤标题", "highlightObjects": [], "explanation": "说明", "action": "show|highlight|move"}]',
    "  },",
    '  "qualityCheck": {"checked": true, "confidence": "low|medium|high", "issues": []}',
    "}",
    "",
    "内容要求：",
    "1. 先做题目识别与整理；",
    "2. 给出题意分析；",
    "3. 列出本题考点；",
    "4. 分步解析，每一步解释为什么这样做；",
    "5. 给出最终答案；",
    "6. 给出易错提醒；",
    "7. 做验算检查；",
    "8. 检查是否使用初中方法；",
    "9. 做质量检查，说明条件是否充分、答案是否一致、步骤是否跳步。",
    "10. 如题目适合画图，请返回 visualizationSpec；如果无法可靠画图，type 使用 none，objects 为空。",
    "11. visualizationSpec 只描述结构化对象，不要生成图片，不要写可执行代码。",
    "12. 函数图只返回基础表达式和关键点；几何图只返回题目中明确存在或解析中明确构造的点、线、圆和辅助线。",
  ].join("\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

module.exports = {
  buildSolveMessages,
};
