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

  return `<ol>${values
    .map(
      (step) => `
        <li>
          <strong>${escapeHtml(step.title)}</strong>
          <p>${escapeHtml(step.content)}</p>
        </li>
      `,
    )
    .join("")}</ol>`;
}

function renderQualityCheck(qualityCheck) {
  const check = qualityCheck || {};
  const issues = Array.isArray(check.issues) ? check.issues : [];
  const issueHtml = issues.length
    ? renderList(issues)
    : "<p>暂未发现明显问题，仍建议核对题干条件和最终答案。</p>";

  return `
    <p><strong>已检查：</strong>${check.checked ? "是" : "否"}</p>
    <p><strong>置信度：</strong>${escapeHtml(check.confidence || "medium")}</p>
    ${issueHtml}
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
    body { max-width: 920px; margin: 0 auto; padding: 36px 24px 56px; color: #334155; background: #f8fafc; line-height: 1.75; }
    header { padding: 26px; margin-bottom: 18px; color: #0f172a; background: linear-gradient(135deg, #eff6ff, #ffffff); border: 1px solid #dbeafe; border-radius: 20px; box-shadow: 0 18px 40px rgba(30, 64, 175, 0.08); }
    h1 { margin: 0 0 10px; font-size: 28px; }
    header p { margin: 0; color: #475569; }
    section { padding: 22px; margin-top: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05); }
    h2 { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; color: #1e40af; font-size: 19px; }
    h2 span { display: grid; width: 28px; height: 28px; place-items: center; color: #fff; font-size: 13px; background: #2563eb; border-radius: 9px; }
    p { margin: 8px 0; white-space: pre-wrap; }
    ol, ul { padding-left: 22px; margin: 8px 0 0; }
    li + li { margin-top: 10px; }
    li p { margin-top: 5px; }
    .answer { background: #f0fdf4; border-color: #bbf7d0; }
    .answer h2 { color: #166534; }
    .warning { background: #fff7ed; border-color: #fed7aa; }
    .warning h2 { color: #9a3412; }
    .muted { color: #64748b; font-size: 13px; }
    @media (max-width: 600px) { body { padding: 22px 14px 36px; } header, section { padding: 18px; border-radius: 15px; } h1 { font-size: 23px; } }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(solution.title)}</h1>
    <p>${escapeHtml(solution.problemText)}</p>
  </header>

  <section>
    <h2><span>1</span>题目</h2>
    <p>${escapeHtml(solution.problemText)}</p>
    <p class="muted">学段：${escapeHtml(solution.gradeLevel)} · 科目：${escapeHtml(solution.subject)} · 主题：${escapeHtml(solution.topic)}</p>
  </section>

  <section>
    <h2><span>2</span>考点</h2>
    ${renderList(solution.knowledgePoints)}
  </section>

  <section>
    <h2><span>3</span>题意分析</h2>
    <p>${escapeHtml(solution.analysis)}</p>
  </section>

  <section>
    <h2><span>4</span>分步解析</h2>
    ${renderSteps(solution.steps)}
  </section>

  <section class="answer">
    <h2><span>5</span>最终答案</h2>
    <p><strong>${escapeHtml(solution.finalAnswer)}</strong></p>
  </section>

  <section class="warning">
    <h2><span>6</span>易错提醒</h2>
    ${renderList(solution.commonMistakes)}
  </section>

  <section>
    <h2><span>7</span>验算检查</h2>
    <p>${escapeHtml(solution.verification)}</p>
  </section>

  <section>
    <h2><span>8</span>质量检查</h2>
    ${renderQualityCheck(solution.qualityCheck)}
  </section>
</body>
</html>`;
}

module.exports = {
  buildHtmlResult,
};
