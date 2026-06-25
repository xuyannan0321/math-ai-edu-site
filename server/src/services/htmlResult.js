function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderList(items) {
  const values = Array.isArray(items) ? items : [];

  if (!values.length) {
    return "<p>暂无明确条目。</p>";
  }

  return `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderSteps(steps) {
  const values = Array.isArray(steps) ? steps : [];

  if (!values.length) {
    return "<p>暂无完整步骤。</p>";
  }

  return `<ol class="solution-steps">${values
    .map(
      (step, index) => `
        <li>
          <span class="step-index">${index + 1}</span>
          <div>
            <strong>${escapeHtml(step.title)}</strong>
            <p>${escapeHtml(step.content)}</p>
          </div>
        </li>
      `,
    )
    .join("")}</ol>`;
}

function renderQualityCheck(qualityCheck) {
  const check = qualityCheck || {};
  const issues = Array.isArray(check.issues) ? check.issues : [];
  const confidence = check.confidence || "medium";
  const confidenceText = confidence === "high" ? "高" : confidence === "medium" ? "中" : "低";
  const reminder = confidence === "high"
    ? "已通过结构化校验，仍建议结合原题复核关键条件。"
    : "已完成结构化校验；复杂压轴题建议教师复核关键条件和分支。";

  return `
    <p><strong>校验状态：</strong>${check.checked ? "已通过结构化校验" : "已完成基础校验"}</p>
    <p><strong>置信度：</strong>${escapeHtml(confidenceText)}</p>
    <p class="quality-reminder">${escapeHtml(reminder)}</p>
    ${issues.length ? renderList(issues) : ""}
  `;
}

function renderVisualizationSpec(solution) {
  const spec = solution.visualizationSpec || { type: "none" };
  const safeJson = escapeHtml(JSON.stringify(spec));
  const description = spec.type === "none"
    ? spec.description || "暂无可靠图示，可查看文字解析。"
    : "本解析已保留结构化图示数据，前端会根据 visualizationSpec 渲染图示。";

  return `
    <div class="diagram-placeholder" data-visualization-type="${escapeHtml(spec.type || "none")}">
      <strong>${escapeHtml(spec.title || "图示讲解")}</strong>
      <p>${escapeHtml(description)}</p>
    </div>
    <script type="application/json" id="visualization-spec">${safeJson}</script>
  `;
}

function buildHtmlResult(solution) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(solution.title)}</title>
  <style>
    :root { color-scheme: light; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
    * { box-sizing: border-box; }
    body { max-width: 920px; margin: 0 auto; padding: 28px 18px 52px; color: #243041; background: #f8fafc; font-size: 15px; line-height: 1.78; text-align: left; }
    header { padding: 24px; margin-bottom: 18px; color: #0f172a; background: linear-gradient(135deg, #eff6ff, #ffffff); border: 1px solid #dbeafe; border-radius: 20px; box-shadow: 0 18px 40px rgba(30, 64, 175, 0.08); }
    h1 { margin: 0 0 10px; font-size: 26px; line-height: 1.3; }
    header p { margin: 0; color: #475569; }
    section { padding: 20px; margin-top: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05); }
    h2 { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; color: #1e40af; font-size: 18px; line-height: 1.35; }
    h2 span { display: grid; width: 28px; height: 28px; flex: none; place-items: center; color: #fff; font-size: 13px; background: #2563eb; border-radius: 9px; }
    p { margin: 8px 0; white-space: pre-wrap; word-break: break-word; }
    ol, ul { padding-left: 22px; margin: 8px 0 0; }
    li + li { margin-top: 8px; }
    li p { margin-top: 5px; }
    .solution-steps { display: grid; gap: 12px; padding: 0; list-style: none; }
    .solution-steps li { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 10px; margin: 0; }
    .step-index { display: grid; width: 28px; height: 28px; place-items: center; color: #1d4ed8; font-weight: 800; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9px; }
    .diagram-placeholder { padding: 16px; color: #475569; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 14px; }
    .diagram-placeholder strong { display: block; margin-bottom: 6px; color: #1e40af; }
    .answer { background: #f0fdf4; border-color: #bbf7d0; }
    .answer h2 { color: #166534; }
    .warning { background: #fff7ed; border-color: #fed7aa; }
    .warning h2 { color: #9a3412; }
    .quality { background: #fefce8; border-color: #fde68a; }
    .quality h2 { color: #a16207; }
    .quality-reminder { color: #854d0e; }
    .muted { color: #64748b; font-size: 13px; }
    mjx-container svg { display: inline !important; vertical-align: -0.15em !important; }
    mjx-container[display="true"] { margin: 0.9em 0 !important; }
    @media (max-width: 600px) {
      body { padding: 18px 12px 34px; font-size: 14px; }
      header, section { padding: 16px; border-radius: 15px; }
      h1 { font-size: 22px; }
      h2 { font-size: 16px; }
    }
  </style>
</head>
<body>
  <header>
    <p class="muted">原题真解 Pro · 中考解析结构</p>
    <h1>${escapeHtml(solution.title)}</h1>
    <p>${escapeHtml(solution.problemText)}</p>
  </header>

  <section>
    <h2><span>1</span>题目</h2>
    <p>${escapeHtml(solution.problemText)}</p>
    <p class="muted">学段：${escapeHtml(solution.gradeLevel)} · 科目：${escapeHtml(solution.subject)} · 主题：${escapeHtml(solution.topic)}</p>
  </section>

  <section>
    <h2><span>2</span>图示讲解</h2>
    ${renderVisualizationSpec(solution)}
  </section>

  <section>
    <h2><span>3</span>题意分析</h2>
    <p>${escapeHtml(solution.analysis)}</p>
  </section>

  <section>
    <h2><span>4</span>本题考点</h2>
    ${renderList(solution.knowledgePoints)}
  </section>

  <section>
    <h2><span>5</span>解题步骤</h2>
    ${renderSteps(solution.steps)}
  </section>

  <section class="answer">
    <h2><span>6</span>最终答案</h2>
    <p><strong>${escapeHtml(solution.finalAnswer)}</strong></p>
  </section>

  <section class="warning">
    <h2><span>7</span>易错提醒</h2>
    ${renderList(solution.commonMistakes)}
  </section>

  <section>
    <h2><span>8</span>验算或检查</h2>
    <p>${escapeHtml(solution.verification)}</p>
  </section>

  <section class="quality">
    <h2><span>9</span>质量检查</h2>
    ${renderQualityCheck(solution.qualityCheck)}
  </section>
</body>
</html>`;
}

module.exports = {
  buildHtmlResult,
};
