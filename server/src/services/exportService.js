function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function renderList(items) {
  const values = asArray(items);

  if (!values.length) {
    return "<p>暂无明确条目。</p>";
  }

  return `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderSteps(steps) {
  const values = asArray(steps);

  if (!values.length) {
    return "<p>暂无完整步骤。</p>";
  }

  return `<ol>${values
    .map((step) => `<li><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.content)}</p></li>`)
    .join("")}</ol>`;
}

function renderQualityCheck(qualityCheck) {
  const check = qualityCheck || {};
  return `
    <p><strong>已检查：</strong>${check.checked ? "是" : "否"}</p>
    <p><strong>置信度：</strong>${escapeHtml(check.confidence || "medium")}</p>
    ${renderList(check.issues)}
  `;
}

function buildWordHtmlDocument(record) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(record.title)}</title>
  <style>
    body { font-family: "Microsoft YaHei", SimSun, sans-serif; color: #1f2937; line-height: 1.75; }
    h1 { color: #1d4ed8; font-size: 24px; }
    h2 { padding-bottom: 4px; color: #1e40af; border-bottom: 1px solid #dbeafe; font-size: 18px; }
    p { margin: 6px 0; }
    li { margin: 5px 0; }
    .answer { color: #166534; font-weight: 700; }
    .muted { color: #64748b; }
  </style>
</head>
<body>
  <h1>${escapeHtml(record.title)}</h1>
  <p class="muted">导出记录 ID：${escapeHtml(record.id)}</p>

  <h2>原题</h2>
  <p>${escapeHtml(record.problem_text)}</p>

  <h2>图片识别文本</h2>
  <p>${record.recognized_text ? escapeHtml(record.recognized_text) : "无"}</p>

  <h2>考点</h2>
  ${renderList(record.knowledge_points)}

  <h2>题意分析</h2>
  <p>${escapeHtml(record.analysis)}</p>

  <h2>分步解析</h2>
  ${renderSteps(record.steps)}

  <h2>最终答案</h2>
  <p class="answer">${escapeHtml(record.final_answer)}</p>

  <h2>易错提醒</h2>
  ${renderList(record.common_mistakes)}

  <h2>验算检查</h2>
  <p>${escapeHtml(record.verification)}</p>

  <h2>质量检查</h2>
  ${renderQualityCheck(record.quality_check)}
</body>
</html>`;
}

const GGB_SUPPORTED_KINDS = new Set([
  "point",
  "segment",
  "line",
  "circle",
  "angle",
  "function",
  "auxiliaryLine",
]);

function isSafeLabel(value) {
  return /^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(String(value || ""));
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function isSafeExpression(value) {
  const text = String(value || "").trim();
  return text.length > 0
    && text.length <= 120
    && /^[A-Za-z0-9_xXyY+\-*/^().,=\s]+$/.test(text);
}

function renderPoint(object) {
  const label = object.label || object.id;

  if (!isSafeLabel(label) || !isFiniteNumber(object.x) || !isFiniteNumber(object.y)) {
    return "";
  }

  return `<element type="point" label="${escapeXml(label)}"><coords x="${Number(object.x)}" y="${Number(object.y)}" z="1"/></element>`;
}

function renderSegment(object) {
  const label = object.label || object.id;

  if (!isSafeLabel(label) || !isSafeLabel(object.from) || !isSafeLabel(object.to)) {
    return "";
  }

  return `<command name="Segment"><input a0="${escapeXml(object.from)}" a1="${escapeXml(object.to)}"/><output a0="${escapeXml(label)}"/></command>`;
}

function renderLine(object) {
  const label = object.label || object.id;
  const through = Array.isArray(object.through) ? object.through : [];

  if (!isSafeLabel(label) || through.length < 2 || !through.every(isSafeLabel)) {
    return "";
  }

  return `<command name="Line"><input a0="${escapeXml(through[0])}" a1="${escapeXml(through[1])}"/><output a0="${escapeXml(label)}"/></command>`;
}

function renderCircle(object) {
  const label = object.label || object.id;

  if (!isSafeLabel(label) || !isSafeLabel(object.center) || !isFiniteNumber(object.radius)) {
    return "";
  }

  return `<command name="Circle"><input a0="${escapeXml(object.center)}" a1="${Number(object.radius)}"/><output a0="${escapeXml(label)}"/></command>`;
}

function renderAngle(object) {
  const label = object.label || object.id;
  const points = Array.isArray(object.points) ? object.points : [];

  if (!isSafeLabel(label) || points.length < 3 || !points.slice(0, 3).every(isSafeLabel)) {
    return "";
  }

  return `<command name="Angle"><input a0="${escapeXml(points[0])}" a1="${escapeXml(points[1])}" a2="${escapeXml(points[2])}"/><output a0="${escapeXml(label)}"/></command>`;
}

function renderFunction(object) {
  const label = object.label || object.id || "f";
  const expression = String(object.expression || "").trim();

  if (!isSafeLabel(label) || !isSafeExpression(expression)) {
    return "";
  }

  const exp = expression.includes("=") ? expression : `${label}(x)=${expression}`;
  return `<expression label="${escapeXml(label)}" exp="${escapeXml(exp)}"/>`;
}

function renderGeoGebraObject(object) {
  switch (object.kind) {
    case "point":
      return renderPoint(object);
    case "segment":
      return renderSegment(object);
    case "line":
    case "auxiliaryLine":
      return renderLine(object);
    case "circle":
      return renderCircle(object);
    case "angle":
      return renderAngle(object);
    case "function":
      return renderFunction(object);
    default:
      return "";
  }
}

function buildGeoGebraXml(record) {
  const spec = record.visualization_spec;
  const objects = Array.isArray(spec?.objects)
    ? spec.objects.filter((object) => GGB_SUPPORTED_KINDS.has(object.kind))
    : [];
  const renderedObjects = objects.map(renderGeoGebraObject).filter(Boolean);

  if (!spec || spec.type === "none" || !renderedObjects.length) {
    const error = new Error("当前题目暂无可导出的 GGB 图形，请先生成图示数据。");
    error.statusCode = 422;
    throw error;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="5.0" app="geometry" version="基础导出">
  <construction title="${escapeXml(record.title)}">
    ${renderedObjects.join("\n    ")}
  </construction>
</geogebra>`;
}

module.exports = {
  buildWordHtmlDocument,
  buildGeoGebraXml,
};
