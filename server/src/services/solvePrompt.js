const GEOMETRY_KEYWORDS = [
  "三角形",
  "圆",
  "四点共圆",
  "相似",
  "全等",
  "角平分线",
  "垂直",
  "平行",
  "中点",
  "动点",
  "最值",
  "轨迹",
  "辅助线",
  "证明",
  "切线",
  "弦",
  "垂足",
];

function isGeometryProblem({ questionText, questionType }) {
  const combinedText = `${questionType || ""}\n${questionText || ""}`;

  return /几何/.test(combinedText) || GEOMETRY_KEYWORDS.some((keyword) => combinedText.includes(keyword));
}

function getVisualizationSchemaTemplate() {
  return [
    '  "visualizationSpec": {',
    '    "type": "geometry | equation_balance | function_graph | dynamic_point | number_line | none",',
    '    "title": "图示标题",',
    '    "description": "图示说明；无法可靠绘制时说明原因",',
    '    "confidence": "low | medium | high",',
    '    "orientation": {',
    '      "baseline": "可选，例如 BC",',
    '      "baselineDirection": "left-to-right",',
    '      "above": ["A"],',
    '      "below": []',
    '    },',
    '    "points": {',
    '      "A": { "x": 0, "y": 3, "label": "A" },',
    '      "B": { "x": -2, "y": 0, "label": "B" }',
    '    },',
    '    "objects": [',
    '      { "kind": "segment", "id": "AB", "from": "A", "to": "B", "role": "original" },',
    '      { "kind": "segment", "id": "AH", "from": "A", "to": "H", "role": "auxiliary", "style": "dashed", "usedIn": ["q1"] }',
    '    ],',
    '    "functions": [',
    '      { "id": "f1", "label": "y=x^2-2x-3", "expression": "y=x^2-2x-3", "range": [-5, 5], "role": "original" }',
    '    ],',
    '    "auxiliaryLines": [',
    '      { "id": "symmetry-axis", "kind": "line", "label": "对称轴", "from": { "x": 1, "y": -5 }, "to": { "x": 1, "y": 5 }, "style": "dashed" }',
    '    ],',
    '    "views": [',
    '      { "id": "original", "title": "原题图", "showObjects": ["AB"], "highlightObjects": [] },',
    '      { "id": "q1", "title": "第1问解析图", "showObjects": ["AB", "AH"], "highlightObjects": ["AH"] }',
    '    ],',
    '    "steps": [',
    '      { "stepTitle": "作辅助线", "highlightObjects": ["AH"], "explanation": "过点 A 作 BC 的垂线，垂足为 H。", "action": "highlight" }',
    '    ]',
    '  },',
  ];
}

function getBaseJsonTemplate(includeHiddenVerification = false) {
  return [
    "{",
    '  "title": "简短标题",',
    '  "problemText": "整理后的题干",',
    '  "gradeLevel": "初中",',
    '  "subject": "数学",',
    '  "topic": "知识主题",',
    '  "knowledgePoints": ["知识点1"],',
    '  "analysis": "题意分析",',
    '  "questionSections": [',
    '    { "id": "q1", "title": "第 1 问", "problem": "本问题目", "idea": "解题思路", "keyBasis": "关键依据", "steps": [{"title": "步骤", "content": "推导"}], "conclusion": "本问结论", "diagramViewId": "q1" },',
    '    { "id": "q2", "title": "第 2 问", "problem": "本问题目", "idea": "解题思路", "keyBasis": "关键依据", "steps": [{"title": "步骤", "content": "推导"}], "conclusion": "本问结论", "diagramViewId": "q2" }',
    '  ],',
  '  "steps": [{"title": "步骤标题", "content": "步骤内容"}],',
    '  "finalAnswer": "最终答案",',
    '  "commonMistakes": ["易错提醒"],',
    '  "verification": "验算或检查",',
    ...getVisualizationSchemaTemplate(),
    includeHiddenVerification
      ? '  "qualityCheck": {"checked": true, "confidence": "low|medium|high", "issues": []},'
      : '  "qualityCheck": {"checked": true, "confidence": "low|medium|high", "issues": []}',
    includeHiddenVerification
      ? '  "hiddenVerification": {"constantCheck": [], "branchCheck": [], "independentChecks": [], "diagramCheck": [], "issues": []}'
      : "",
    "}",
  ].filter(Boolean);
}

function buildBaseSystemPrompt() {
  return [
    "你是原题真解 Pro 的数学教研型 AI 老师。",
    "你的目标是帮助学生理解解题过程，而不是只给最终答案。",
    "默认使用初中数学方法，避免向量、微积分、矩阵、高中复杂三角恒等变换和超纲解析几何技巧。",
    "如果题目条件不足，要明确指出条件不足，不要编造题目中没有的条件。",
    "公式可使用 LaTeX 文本，但最终响应必须是纯 JSON，不要包含 Markdown、代码块或额外说明。",
    "LaTeX 严格规范（必须遵守）：",
    "  - 所有行内公式必须用 \\( ... \\) 完整包裹，独立公式必须用 \\[ ... \\] 完整包裹。",
    "  - 禁止输出裸露的 \\frac、\\sqrt、\\angle、\\triangle 等命令（必须包裹在公式分隔符内）。",
    "  - 禁止使用 \\left 和 \\right 控制符，统一使用普通括号。",
    "  - 禁止将一个公式拆成多个碎片（如把 \\frac{\\sqrt{3}}{3} 拆成 \\frac{ (\\sqrt{3}) }{3}）。一个 \\frac 结构内部必须完整包含分子和分母。",
    "  - 禁止在 \\frac 的分子/分母外部再额外包裹括号，例如不要写 \\frac{(\\sqrt{3})}{3}，应写 \\frac{\\sqrt{3}}{3}。",
    "  - 结论文本示例：顶点为 \\(V(1,-\\frac{4\\sqrt{3}}{3})\\)，对称轴为 \\(x=1\\)。",
    "  - 不要输出类似于 \\(\\frac{4\\sqrt{3}}{3}\\) 被拆成两段 (\\(\\frac{4\\) 和 \\(\\sqrt{3}}{3}\\)) 的坏公式。",
    "  - 普通几何名称不要过度 LaTeX 化：点 P、直线 CE、三角形 PCE 写为普通文字，不要写成 \\(P\\)、\\(CE\\)、\\(\\triangle PCE\\)。仅数学公式数值需要 LaTeX。",
    "  - 仅在确实需要数学排版时使用 LaTeX，例如 \\(\\sqrt{3}\\)、\\(\\frac{4\\sqrt{3}}{3}\\)、\\(x=1\\)。线段名、点名称、三角形名称使用普通文字即可。",
    "  - 坐标必须写成点 P(m, 2m)、点 Q(-1, n)、顶点 V(1, -4)，禁止写点 Pm, 2m、点 Q-1, n。",
    "  - 普通名称保持纯文本：点 P、直线 CE、三角形 PCE；只有坐标、方程、面积表达式等数学内容使用 LaTeX。",
    "  - 数学表达式使用标准 LaTeX，例如 \\(m=\\frac{2}{3}\\)、\\(S_{PQM}=6|m+1|\\)。",
    "  - 分数必须写成 LaTeX，例如 \\(\\frac{1}{2}\\)、\\(\\frac{10}{3}\\)、\\(\\frac{2}{3}\\)，禁止把 1/2、10/3、2/3 当普通文本输出。",
    "  - 平方必须在公式分隔符内写成 LaTeX，例如 \\(x^2\\)、\\(m^2\\)、\\(a^2\\)，禁止把 x^2、m^2、a^2 当普通文本输出。",
    "  - 代入负数必须加括号，例如 \\(Q(-1,-2)\\)、\\(2\\times(-1)=-2\\)、\\(5-(-1)=6\\)、\\(2m-(-2)=2m+2\\)。",
    "  - 坐标必须完整带括号：点 P(m, 2m)、点 Q(-1, -2)、点 M(5, -2)、顶点 V(1, -\\frac{4\\sqrt{3}}{3})。",
    "  - 禁止输出 Pm, 2m、Q-1, -2、M5, -2、a m^2、y=ax^2-4ax+c 这类普通文本数学式。",
    "  - 特殊点坐标必须写成 V(1, -\\frac{4\\sqrt{3}}{3})、P1(0, -\\sqrt{3})、P2(2, -\\sqrt{3})、Q(-1, -2)、M(5, -2)。",
    "  - 禁止输出 V1, -4√3/3、P10, -√3、P22, -√3、M5, -2、Q-1, -2 这类缺括号坐标。",
    "  - 禁止输出 \\y、\\x、\\V、\\P、\\Q、\\M、\\A、\\B、\\C、\\D 这类非法反斜杠；普通变量和点名直接写 x、y、P、Q、V。",
    "  - 只有真正 LaTeX 命令才加反斜杠，例如 \\frac、\\sqrt、\\times、\\cdot、\\triangle、\\angle。",
    "  - 推导公式尽量放入 equationBlocks.lines，且每一行用 \\[ ... \\] 包裹。",
    "  - 不要在普通正文中输出长 LaTeX 公式；较长公式必须放入 equationBlocks.lines，每行只放一个完整公式。",
    "AI 只允许输出结构化 JSON；严禁输出 <svg>、<canvas>、<script>、完整 HTML 或任何可执行绘图代码。",
    "visualizationSpec / diagramSpec 只能描述点、线、圆、角、视图和高亮等结构化数据。",
    "函数题、方程题、平面直角坐标题优先使用 function_graph，必须包含 functions、points、auxiliaryLines、views 字段。",
    "多问复杂函数题必须按第 1 问、第 2 问、第 3 问组织 questionSections；图示说明必须明确对应哪一问。",
    "如果无法完整可靠绘制复杂图，不要输出误导性的完整 visualizationSpec；应使用 type none，或明确标注“局部示意图：仅展示部分关键关系，不代表整题完整图像”。",
    "几何题不要强行猜 coordinates；无法可靠绘制几何图时 type 用 none，前端会显示原题图兜底。",
  ].join("\n");
}

function buildGeometrySystemPrompt() {
  return [
    buildBaseSystemPrompt(),
    "",
    "几何压轴专用规则：",
    "1. 学生可见解析只使用初中几何方法；禁止向学生展示坐标系、向量、导数、高中三角、复杂解析几何。",
    "2. 你可以在 hiddenVerification 中做 algebraCheck（坐标/代数验证）和 geometryCheck（纯几何逻辑验证）进行双源验算；两者一致时 consistency 写 passed；但 hiddenVerification 不得写入学生可见解析。",
    "3. 不要输出 <draft> 标签；所有双源校验结果浓缩到 hiddenVerification 的 algebraCheck 和 geometryCheck 字段。",
    "4. 辅助线必须先用标准作法声明，例如“连接 AD”“过点 A 作 BC 的垂线，垂足为 H”“延长 AB 至点 E，使 BE = CD”。",
    "5. 一问一图：每个 views 项只展示本问需要的原题元素和辅助线，不要把上一问辅助线强行带入下一问。",
    "6. 几何证明必须严谨写出依据，不能直接抛结论，不使用“神来之笔”“联动模型”等解说体语言。",
    "7. 若无法可靠确定图形点位或对象关系，visualizationSpec.type 必须为 none，并在 description 说明“暂无可靠图示，可查看文字解析”。",
    "8. 几何图只输出题目明确给出或解析中明确构造的点、线、圆、角、辅助线；不要自动编造中点、交点、圆心、垂足。",
    "9. 原题元素 role 使用 original；辅助线 role 使用 auxiliary 且 style 使用 dashed；重点对象可使用 highlight。",
    "10. 不要承诺“100% 零失误”。qualityCheck 可写“已通过结构化校验”“复杂压轴题建议教师复核”等温和表述。",
  ].join("\n");
}

function buildGenericUserPrompt({
  questionText,
  normalizedSubject,
  normalizedGrade,
  normalizedType,
}) {
  return [
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
    ...getBaseJsonTemplate(false),
    "",
    "内容要求：",
    "1. 先做题目识别与整理；",
    "2. 给出题意分析；",
    "3. 列出本题考点；",
    "4. 分步解析，如果题目有多个小问，请使用 questionSections 数组按问拆分，每个小问绑定对应的 diagramViewId；",
    "5. 给出最终答案；",
    "6. 给出易错提醒；",
    "7. 做验算检查；",
    "8. 检查是否使用初中方法；",
    "9. 做质量检查，说明条件是否充分、答案是否一致、步骤是否跳步。",
    "10. 如题目适合画图，请返回 visualizationSpec；如果无法可靠画图，type 使用 none，objects 为空。",
    "11. visualizationSpec 只描述结构化对象，不要生成图片，不要写可执行代码。",
    "12. 函数图只返回安全基础表达式和关键点；几何图只返回题目中明确存在或解析中明确构造的点、线、圆和辅助线。",
    "13. 多问复杂函数题必须按第 1 问、第 2 问、第 3 问拆分；每个小问的 diagramViewId 要对应 visualizationSpec.views 中的具体视图。",
    "14. 如果图示数据不足以表达完整题目，visualizationSpec.type 使用 none；不要为了图示效果把复杂题简化成一条直线或一个单点。",
    "15. 复杂函数压轴题每一问必须单独成 section，并完整展开题意、设点、代入、建方程、求解、验证和本问结论。",
    "16. 第 1 问常见结构：题意 / 设点 / 建立方程 / 求解 / 本问结论。",
    "17. 第 2 问常见结构：代入抛物线 / 求对称轴 / 求点 M 坐标 / 面积方程 / 解绝对值 / 验证 / 本问结论。",
    "18. 第 3 问常见结构：写出 L1 / 中心对称得到 L2 / 与目标直线联立 / 判别式 / 求参数 / 检查所有双倍比例点 / 本问结论。",
    "19. 不能省略关键计算；不能只写口语化结论；每一问必须包含 conclusion 字段。",
    "20. 方程推导必须使用 equationBlocks，按行输出公式，例如 \\[S_{\\triangle PQM}=\\frac{1}{2}\\times 6\\times |2m+2|\\]、\\[3|2m+2|=10\\]、\\[m=\\frac{2}{3}\\text{ 或 }m=-\\frac{8}{3}\\]。",
    "21. 双倍比例点问题必须先写 \\[y=2x\\]，再与函数联立，例如 \\[2x=\\frac{8}{x}\\]、\\[2x^2=8\\]、\\[x=2\\text{ 或 }x=-2\\]，再求对应 y 值。",
    "22. 面积问题必须写出点 P(m, 2m)、点 Q(-1, -2)、点 M(5, -2)、\\[MQ=5-(-1)=6\\]、\\[|2m-(-2)|=|2m+2|\\] 和面积方程。",
    "23. 中心对称抛物线问题必须写出 \\(L_1:y=-(x+1)^2+6\\)、顶点 \\((-1,6)\\)、关于 \\(T(0,t)\\) 对称后的顶点 \\((1,2t-6)\\)、\\(L_2\\) 表达式，并与 \\(y=2x\\) 联立用判别式求参数。",
  ].join("\n");
}

function buildGeometryUserPrompt({
  questionText,
  normalizedSubject,
  normalizedGrade,
  normalizedType,
}) {
  return [
    "请按辽宁中考几何压轴题的满分解析标准，解析下面题目。",
    "",
    `学段：${normalizedGrade}`,
    `科目：${normalizedSubject}`,
    `题型：${normalizedType}`,
    "",
    "题目：",
    questionText,
    "",
    "请严格返回一个 JSON 对象，必须包含这些字段：",
    ...getBaseJsonTemplate(true),
    "",
    "几何输出要求：",
    "1. 学生端解析只呈现初中方法：全等、相似、勾股定理、圆的基础性质、角平分线、平行垂直、中点、锐角三角函数等。",
    "2. 学生端禁止出现坐标系、向量、导数、高中三角、复杂解析几何、点到直线距离公式。",
    "3. hiddenVerification 用于后端校验：提取并核对题干常量、列出合法分支、说明双源验算或几何逻辑自检、检查辅助线与图示是否一致。",
    "4. hiddenVerification 内部可进行 algebraCheck（坐标/代数校验）和 geometryCheck（纯几何逻辑校验），两者一致时 consistency 写 passed，否则写 failed。",
    "5. hiddenVerification 不得包含学生端要显示的正文，不得输出 <draft> 标签。",
    "6. qualityCheck.sourceVerificationPassed 仅在双源交叉验证通过时写 true，否则写 false。",
    "5. 每一步要短而严谨：先讲主思路，再说明依据，再推进结论。",
    "6. 凡用辅助线，必须在对应步骤开头先写清作法。",
    "7. visualizationSpec.points 中只放可靠点位；objects 中只放可靠对象；无法可靠定位时不要猜点。",
    "8. 几何 views 至少包含 original；有辅助线时按 q1、q2 等分问输出视图。questionSections 每个 section 的 diagramViewId 与 views 的 id 对应。",
    "9. 如果原题信息不足以画图，visualizationSpec.type 使用 none，description 写“暂无可靠图示，可查看文字解析”。",
    "10. 不要输出 HTML、SVG、Canvas、script 或绘图代码。",
    "11. 函数题/平面直角坐标题必须输出 visualizationSpec.type = \"function_graph\"，至少包含 functions、points、auxiliaryLines、views。无法可靠解析时 type 使用 none。",
    "11. reasoningLines 每条需填写 type：because（因为/已知）、therefore（所以/推出）、normal（普通叙述）、calculation（代数计算）、conclusion（阶段性结论）。",
    "12. equationBlocks 每块含 title（如\"方程推导\"）和 lines（纯 LaTeX 公式行，用 \\\\[ \\\\] 包裹）。",
    "11. qualityCheck 不要写绝对承诺；可以写“已通过结构化校验”“已通过几何逻辑自检”“复杂压轴题建议教师复核”。",
  ].join("\n");
}

function buildSolveMessages({ questionText, subject, gradeLevel, questionType }) {
  const normalizedSubject = subject || "数学";
  const normalizedGrade = gradeLevel || "初中";
  const normalizedType = questionType || "综合";
  const geometryMode = isGeometryProblem({ questionText, questionType: normalizedType });

  const systemPrompt = geometryMode ? buildGeometrySystemPrompt() : buildBaseSystemPrompt();
  const userPrompt = geometryMode
    ? buildGeometryUserPrompt({
        questionText,
        normalizedSubject,
        normalizedGrade,
        normalizedType,
      })
    : buildGenericUserPrompt({
        questionText,
        normalizedSubject,
        normalizedGrade,
        normalizedType,
      });

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

module.exports = {
  buildSolveMessages,
  isGeometryProblem,
};
