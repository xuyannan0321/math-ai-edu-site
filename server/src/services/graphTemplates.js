"use strict";

const {
  buildFunctionGraphFromText,
  buildCoordinateSystem,
} = require("./graphEngine");
const { normalizeMathQuestionText } = require("./mathTextNormalize");

const FUTURE_TEMPLATE_TYPES = [
  "geometry",
  "circle",
  "similarity",
  "rotation",
  "folding",
  "dynamic_point",
];

function asText(value) {
  return String(value || "");
}

function compactMathText(value) {
  return asText(value)
    .replace(/\u2212/g, "-")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/，/g, ",")
    .replace(/\s+/g, "");
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function sampleCurve(fn, minX, maxX, count) {
  const samples = [];
  const steps = Math.max(2, count || 160);

  for (let index = 0; index <= steps; index += 1) {
    const x = minX + ((maxX - minX) * index) / steps;
    const y = fn(x);

    if (Number.isFinite(x) && Number.isFinite(y)) {
      samples.push({ x: round4(x), y: round4(y) });
    }
  }

  return samples;
}

function normalizeTemplateText(value) {
  return asText(value)
    .replace(/\u2212/g, "-")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/，/g, ",")
    .replace(/：/g, ":");
}

function getTemplateText(questionText, source = {}) {
  return [
    questionText,
    source.problemText,
    source.title,
    source.analysis,
    source.finalAnswer,
  ].map(asText).join("\n");
}

function compactTemplateText(value) {
  return normalizeTemplateText(value).replace(/\s+/g, "");
}

function isOrdinaryFunctionGraphQuestion(text) {
  return /画出|作出|绘制|函数图像|函数的图像|图象|图像|抛物线|双曲线|反比例函数|二次函数|一次函数/.test(text);
}

function parseCoordinatePoints(text) {
  const normalized = normalizeTemplateText(text);
  const points = [];
  const seen = new Set();
  const pattern = /(?:点\s*)?([A-Z][0-9]*)\s*\(\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*\)/g;
  let match;

  while ((match = pattern.exec(normalized)) !== null) {
    const id = match[1];
    const x = Number(match[2]);
    const y = Number(match[3]);

    if (!id || !Number.isFinite(x) || !Number.isFinite(y) || seen.has(id)) {
      continue;
    }

    seen.add(id);
    points.push(createPoint(id, x, y));
  }

  return points;
}

function createPoint(id, x, y, label) {
  const point = {
    id,
    x: round4(x),
    y: round4(y),
  };

  point.label = label || `${id}(${formatCoordinateValue(point.x)},${formatCoordinateValue(point.y)})`;
  return point;
}

function pointMapFromList(points) {
  return points.reduce((map, point) => {
    if (point && point.id) {
      map[point.id] = createPoint(point.id, point.x, point.y, point.label);
    }
    return map;
  }, {});
}

function formatCoordinateValue(value) {
  const rounded = round4(Number(value));
  if (!Number.isFinite(rounded)) {
    return "";
  }
  if (Math.abs(rounded - Math.round(rounded)) < 1e-8) {
    return String(Math.round(rounded));
  }
  return String(rounded).replace(/\.?0+$/, "");
}

function formatIdNumber(value) {
  return formatCoordinateValue(value)
    .replace(/-/g, "negative_")
    .replace(/\./g, "_");
}

function getPointById(points, id) {
  return points.find((point) => point.id === id) || null;
}

function pickPointPair(points, text) {
  if (!Array.isArray(points) || points.length < 2) {
    return null;
  }

  const compact = compactTemplateText(text).toUpperCase();
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const pair1 = `${a.id}${b.id}`.toUpperCase();
      const pair2 = `${b.id}${a.id}`.toUpperCase();
      if (compact.includes(pair1) || compact.includes(pair2)) {
        return [a, b];
      }
    }
  }

  return [points[0], points[1]];
}

function buildCoordinateSystemFromPointMap(points) {
  return buildCoordinateSystem([{ x: 0, y: 0 }].concat(Object.values(points || {})), [], { showGrid: true });
}

function buildFunctionGraphTemplate({
  templateId,
  title,
  description,
  points,
  auxiliaryLines,
  highlightObjects,
  confidence = "high",
}) {
  return {
    type: "function_graph",
    ...baseTemplateMeta(templateId, "coordinate_geometry"),
    confidence,
    title,
    description,
    coordinateSystem: buildCoordinateSystemFromPointMap(points),
    curves: [],
    functions: [],
    points,
    auxiliaryLines: auxiliaryLines || [],
    objects: [],
    views: [
      {
        id: "main",
        title,
        showObjects: {
          curves: [],
          points: Object.keys(points || {}),
          auxiliaryLines: (auxiliaryLines || []).map((line) => line.id).filter(Boolean),
        },
        highlightObjects: highlightObjects || Object.keys(points || {}),
      },
    ],
    steps: [],
  };
}

function makeSegment(id, label, from, to, style = "solid", role = "original", options = {}) {
  return {
    id,
    kind: "segment",
    label,
    from,
    to,
    style,
    role,
    ...options,
  };
}

function makeLine(id, label, from, to, style = "dashed", role = "auxiliary", options = {}) {
  return {
    id,
    kind: "line",
    label,
    from,
    to,
    style,
    role,
    ...options,
  };
}

const NON_MINIMAL_DIAGRAM_LABEL_PATTERNS = [
  /定理|三线合一/,
  /勾股|全等|相似|角平分线|垂直平分线/,
  /^(?:SSS|SAS|ASA|AAS|HL)(?:全等|相似)?$/i,
  /^△[A-Z]{3}[≌∽]△[A-Z]{3}$/,
  /斜边/,
];

function isMinimalDiagramLabel(text, options = {}) {
  const value = asText(text).replace(/\s+/g, "");
  const maxLength = options.maxLength || 12;

  if (!value || value.length > maxLength) {
    return false;
  }

  if (value.includes("/") && value.includes("=")) {
    return false;
  }

  if ((value.match(/=/g) || []).length > 1) {
    return false;
  }

  return !NON_MINIMAL_DIAGRAM_LABEL_PATTERNS.some((pattern) => pattern.test(value));
}

function shouldShowDiagramLabel(text) {
  return isMinimalDiagramLabel(text);
}

function makeDiagramLabel(id, text, x, y, role = "highlight") {
  return {
    kind: "label",
    id,
    text,
    x,
    y,
    role,
  };
}

function makeShortTheoremLabel(text, x, y, id = "label_theorem") {
  return shouldShowDiagramLabel(text)
    ? makeDiagramLabel(id, text, x, y, "highlight")
    : null;
}

function makeConclusionLabel(text, x, y, id = "label_conclusion") {
  return shouldShowDiagramLabel(text)
    ? makeDiagramLabel(id, text, x, y, "highlight")
    : null;
}

function createCleanConditionLabels(labels, idPrefix) {
  return (labels || [])
    .filter((label) => shouldShowDiagramLabel(label.text))
    .map((label, index) => makeDiagramLabel(
      `${idPrefix}_${index + 1}`,
      label.text,
      label.x,
      label.y,
      "highlight",
    ));
}

function baseTemplateMeta(templateId, templateType) {
  return {
    templateId,
    templateType,
    canRender: true,
    notes: [
      "模板只绘制可确定的函数或坐标关系。",
      "后续可扩展 templateType：" + FUTURE_TEMPLATE_TYPES.join("、") + "。",
    ],
  };
}

function hasFunctionIntersectionSignals(text) {
  const compact = compactMathText(text);
  const hasInverse = /y=8\/x/i.test(compact)
    || /y=\\frac\{8\}\{x\}/i.test(compact)
    || /y=\{?8\}?\/x/i.test(compact);
  const hasDoubleLine = /y=2x/i.test(compact);
  const asksIntersection = /交点|双倍比例点|公共点|联立|相交|交于|求解/.test(text);

  return hasInverse && hasDoubleLine && asksIntersection;
}

function buildFunctionIntersectionTemplate(questionText, source = {}) {
  const text = `${asText(questionText)}\n${asText(source.problemText)}\n${asText(source.analysis)}`;

  if (!hasFunctionIntersectionSignals(text)) {
    return null;
  }

  const inversePositive = sampleCurve((x) => 8 / x, 0.4, 8, 180);
  const inverseNegative = sampleCurve((x) => 8 / x, -8, -0.4, 180);
  const line = sampleCurve((x) => 2 * x, -8, 8, 180);
  const points = {
    A: { x: 2, y: 4, label: "A(2,4)" },
    B: { x: -2, y: -4, label: "B(-2,-4)" },
  };
  const allSamples = inversePositive.concat(inverseNegative, line);

  return {
    type: "function_graph",
    ...baseTemplateMeta("function_intersection_v1", "function"),
    confidence: "high",
    title: "函数交点示意图",
    description: "展示 y=8/x 与 y=2x 的交点关系。",
    coordinateSystem: buildCoordinateSystem(Object.values(points), allSamples, { showGrid: true }),
    curves: [
      {
        id: "inverse_y_8_over_x_positive",
        kind: "inverse",
        expression: "y=8/x",
        samples: inversePositive,
      },
      {
        id: "inverse_y_8_over_x_negative",
        kind: "inverse",
        expression: "y=8/x",
        samples: inverseNegative,
      },
      {
        id: "line_y_2x",
        kind: "linear",
        expression: "y=2x",
        samples: line,
      },
    ],
    functions: [
      { id: "inverse_y_8_over_x", label: "y=8/x", expression: "y=8/x", range: [-8, 8], role: "original" },
      { id: "line_y_2x", label: "y=2x", expression: "y=2x", range: [-8, 8], role: "original" },
    ],
    points,
    auxiliaryLines: [],
    objects: [],
    views: [
      {
        id: "q1",
        title: "第 1 问：函数交点",
        showObjects: {
          curves: ["inverse_y_8_over_x_positive", "inverse_y_8_over_x_negative", "line_y_2x"],
          points: ["A", "B"],
          auxiliaryLines: [],
        },
        highlightObjects: ["A", "B"],
      },
    ],
    steps: [],
  };
}

function shouldBuildQuadraticKeyPointsTemplate(questionText, source = {}) {
  const text = `${asText(questionText)}\n${asText(source.problemText)}\n${asText(source.title)}`;
  const compact = compactMathText(text);
  const hasQuadratic = /x\^2|x²|二次函数|抛物线/i.test(compact);
  const asksKeyPoints = /画图|图像|图象|作图|作出|绘制|顶点|对称轴|x轴交点|y轴交点|与x轴|与y轴/.test(text);

  return hasQuadratic && asksKeyPoints;
}

function buildQuadraticKeyPointsTemplate(questionText, source = {}) {
  if (!shouldBuildQuadraticKeyPointsTemplate(questionText, source)) {
    return null;
  }

  const graph = buildFunctionGraphFromText(questionText || source.problemText || "");
  if (!graph || !Array.isArray(graph.curves) || !graph.curves.some((curve) => Array.isArray(curve.samples) && curve.samples.length > 1)) {
    return null;
  }

  const curveIds = graph.curves.map((curve) => curve.id).filter(Boolean);
  const pointIds = Object.keys(graph.points || {});
  const auxiliaryIds = (graph.auxiliaryLines || []).map((line) => line.id).filter(Boolean);

  return {
    ...graph,
    ...baseTemplateMeta("quadratic_key_points_v1", "function"),
    confidence: "high",
    canRender: true,
    title: "二次函数关键点示意图",
    description: "展示抛物线、顶点、对称轴以及坐标轴交点。",
    views: [
      {
        id: "q1",
        title: "二次函数关键点",
        showObjects: {
          curves: curveIds,
          points: pointIds,
          auxiliaryLines: auxiliaryIds,
        },
        highlightObjects: pointIds,
      },
    ],
    notes: baseTemplateMeta("quadratic_key_points_v1", "function").notes,
  };
}

function hasCoordinateAreaSignals(text) {
  const compact = compactMathText(text);
  const hasQ = /Q\(-?1,-?2\)/i.test(compact);
  const hasM = /M\(5,-?2\)/i.test(compact);
  const hasP = /P\(m,2m\)/i.test(compact);
  const hasArea = /面积|S(?:△|\\triangle)?PQM|三角形PQM/.test(compact);

  return hasQ && hasM && hasP && hasArea;
}

function buildCoordinateAreaTemplate(questionText, source = {}) {
  const text = `${asText(questionText)}\n${asText(source.problemText)}\n${asText(source.analysis)}\n${asText(source.finalAnswer)}`;

  if (!hasCoordinateAreaSignals(text)) {
    return null;
  }

  const points = {
    Q: { x: -1, y: -2, label: "Q(-1,-2)" },
    M: { x: 5, y: -2, label: "M(5,-2)" },
    P1: { x: 2 / 3, y: 4 / 3, label: "P1" },
    P2: { x: -8 / 3, y: -16 / 3, label: "P2" },
  };
  const auxiliaryLines = [
    {
      id: "segment_QM",
      kind: "segment",
      label: "QM",
      from: "Q",
      to: "M",
      style: "solid",
      role: "original",
    },
    {
      id: "line_y_negative_2",
      kind: "line",
      label: "y=-2",
      from: { x: -3.5, y: -2 },
      to: { x: 6, y: -2 },
      style: "dashed",
      role: "auxiliary",
    },
    {
      id: "segment_P1Q",
      kind: "segment",
      label: "P1Q",
      from: "P1",
      to: "Q",
      style: "dashed",
      role: "auxiliary",
    },
    {
      id: "segment_P1M",
      kind: "segment",
      label: "P1M",
      from: "P1",
      to: "M",
      style: "dashed",
      role: "auxiliary",
    },
    {
      id: "segment_P2Q",
      kind: "segment",
      label: "P2Q",
      from: "P2",
      to: "Q",
      style: "dashed",
      role: "auxiliary",
    },
    {
      id: "segment_P2M",
      kind: "segment",
      label: "P2M",
      from: "P2",
      to: "M",
      style: "dashed",
      role: "auxiliary",
    },
    {
      id: "height_P1_to_y_negative_2",
      kind: "segment",
      label: "高",
      from: "P1",
      to: { x: 2 / 3, y: -2 },
      style: "dashed",
      role: "auxiliary",
    },
    {
      id: "height_P2_to_y_negative_2",
      kind: "segment",
      label: "高",
      from: "P2",
      to: { x: -8 / 3, y: -2 },
      style: "dashed",
      role: "auxiliary",
    },
  ];

  return {
    type: "function_graph",
    ...baseTemplateMeta("coordinate_area_v1", "coordinate_area"),
    confidence: "high",
    title: "坐标系面积关系示意图",
    description: "本图保留底 QM、直线 y=-2、两条高和候选点 P 的位置关系。",
    coordinateSystem: {
      xMin: -4,
      xMax: 6.5,
      yMin: -6,
      yMax: 2,
      xStep: 1,
      yStep: 1,
      showGrid: true,
      showAxes: true,
      showTicks: true,
      showAxisNumbers: true,
    },
    curves: [],
    functions: [],
    points,
    auxiliaryLines,
    objects: [],
    views: [
      {
        id: "q1",
        title: "面积关系分析",
        showObjects: {
          curves: [],
          points: ["Q", "M", "P1", "P2"],
          auxiliaryLines: [
            "segment_QM",
            "segment_P1Q",
            "segment_P1M",
            "segment_P2Q",
            "segment_P2M",
            "line_y_negative_2",
            "height_P1_to_y_negative_2",
            "height_P2_to_y_negative_2",
          ],
        },
        highlightObjects: ["P1", "P2", "segment_QM"],
      },
    ],
    steps: [],
  };
}

function buildCoordinateDistanceTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);
  const compact = compactTemplateText(text);
  const pointsList = parseCoordinatePoints(text);

  if (pointsList.length < 2 || isOrdinaryFunctionGraphQuestion(text)) {
    return null;
  }

  if (!/(距离|两点间距离|的长|长度|求[A-Z][0-9]*[A-Z][0-9]*)/.test(compact)) {
    return null;
  }

  const pair = pickPointPair(pointsList, text);
  if (!pair) {
    return null;
  }

  const [a, b] = pair;
  const footId = "H";
  const foot = createPoint(footId, b.x, a.y, footId);
  const points = pointMapFromList([a, b, foot]);
  const segmentId = `segment_${a.id}${b.id}`;

  const auxiliaryLines = [
    makeSegment(segmentId, `${a.id}${b.id}`, a.id, b.id, "solid", "original", { showLabel: true }),
    makeSegment(`segment_${a.id}H`, `${a.id}H`, a.id, footId, "dashed", "auxiliary"),
    makeSegment(`segment_${b.id}H`, `${b.id}H`, b.id, footId, "dashed", "auxiliary"),
  ];

  return buildFunctionGraphTemplate({
    templateId: "coordinate_distance_v1",
    title: "两点距离示意图",
    description: "本图展示两点间距离对应的水平差、竖直差和直角三角形关系。",
    points,
    auxiliaryLines,
    highlightObjects: [a.id, b.id, segmentId],
  });
}

function buildCoordinateMidpointTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);
  const compact = compactTemplateText(text);
  const pointsList = parseCoordinatePoints(text);

  if (pointsList.length < 2 || isOrdinaryFunctionGraphQuestion(text) || !/中点/.test(compact)) {
    return null;
  }

  const pair = pickPointPair(pointsList, text);
  if (!pair) {
    return null;
  }

  const [a, b] = pair;
  const midpoint = createPoint("M", (a.x + b.x) / 2, (a.y + b.y) / 2, "M");
  const points = pointMapFromList([a, b, midpoint]);
  const segmentId = `segment_${a.id}${b.id}`;

  return buildFunctionGraphTemplate({
    templateId: "coordinate_midpoint_v1",
    title: "线段中点示意图",
    description: `本图展示线段 ${a.id}${b.id} 及其中点 M 的位置。`,
    points,
    auxiliaryLines: [
      makeSegment(segmentId, `${a.id}${b.id}`, a.id, b.id, "solid", "original"),
    ],
    highlightObjects: ["M", segmentId],
  });
}

function buildPointToLineDistanceTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);
  const normalized = normalizeTemplateText(text);
  const compact = compactTemplateText(text);
  const pointsList = parseCoordinatePoints(text);

  if (!pointsList.length || !/(点到直线|到直线|距离)/.test(compact)) {
    return null;
  }

  const horizontal = compact.match(/y=([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?![xX/])/);
  const vertical = compact.match(/x=([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?![yY/])/);

  if (!horizontal && !vertical) {
    return null;
  }

  const point = getPointById(pointsList, "P") || pointsList[0];
  const points = pointMapFromList([point]);
  const span = 4;
  let line;
  let foot;

  if (horizontal) {
    const y = Number(horizontal[1]);
    const lineLabel = `y=${formatCoordinateValue(y)}`;
    foot = createPoint("H", point.x, y, "H");
    points.H = foot;
    line = makeLine(
      `line_y_${formatIdNumber(y)}`,
      lineLabel,
      { x: point.x - span, y },
      { x: point.x + span, y },
      "referenceStrong",
      "auxiliary",
      { orientation: "horizontal", showLabel: true },
    );
  } else {
    const x = Number(vertical[1]);
    const lineLabel = `x=${formatCoordinateValue(x)}`;
    foot = createPoint("H", x, point.y, "H");
    points.H = foot;
    line = makeLine(
      `line_x_${formatIdNumber(x)}`,
      lineLabel,
      { x, y: point.y - span },
      { x, y: point.y + span },
      "referenceStrong",
      "auxiliary",
      { orientation: "vertical", showLabel: true },
    );
  }

  return buildFunctionGraphTemplate({
    templateId: "point_to_line_distance_v1",
    title: "点到直线距离示意图",
    description: `本图展示点 ${point.id} 到直线 ${line.label} 的垂直距离 PH。`,
    points,
    auxiliaryLines: [
      line,
      makeSegment("segment_PH", "PH", point.id, "H", "dashed", "auxiliary", { showLabel: true }),
    ],
    highlightObjects: [point.id, "H", "segment_PH"],
  });
}

function pickTrianglePoints(pointsList) {
  const a = getPointById(pointsList, "A");
  const b = getPointById(pointsList, "B");
  const c = getPointById(pointsList, "C");

  if (a && b && c) {
    return [a, b, c];
  }

  const p = getPointById(pointsList, "P");
  const q = getPointById(pointsList, "Q");
  const m = getPointById(pointsList, "M");

  if (p && q && m) {
    return [p, q, m];
  }

  return pointsList.slice(0, 3);
}

function buildTriangleHeightAuxiliary(a, b, c) {
  if (Math.abs(a.y - b.y) < 1e-8) {
    const foot = createPoint("H", c.x, a.y, "H");
    return {
      foot,
      lines: [
        makeLine("base_line", `${a.id}${b.id}`, a.id, b.id, "solid", "original"),
        makeSegment("height_CH", "高", c.id, "H", "dashed", "auxiliary"),
      ],
      confidence: "high",
    };
  }

  if (Math.abs(a.x - b.x) < 1e-8) {
    const foot = createPoint("H", a.x, c.y, "H");
    return {
      foot,
      lines: [
        makeLine("base_line", `${a.id}${b.id}`, a.id, b.id, "solid", "original"),
        makeSegment("height_CH", "高", c.id, "H", "dashed", "auxiliary"),
      ],
      confidence: "high",
    };
  }

  return {
    foot: null,
    lines: [],
    confidence: "medium",
  };
}

function buildTriangleAreaCoordinateTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);
  const compact = compactTemplateText(text);
  const pointsList = parseCoordinatePoints(text);

  if (
    pointsList.length < 3
    || isOrdinaryFunctionGraphQuestion(text)
    || !/(三角形|△|\\triangle)/.test(compact)
    || !/(面积|S)/i.test(compact)
  ) {
    return null;
  }

  const [a, b, c] = pickTrianglePoints(pointsList);
  if (!a || !b || !c) {
    return null;
  }

  const height = buildTriangleHeightAuxiliary(a, b, c);
  const points = pointMapFromList([a, b, c].concat(height.foot ? [height.foot] : []));
  const auxiliaryLines = [
    makeSegment(`segment_${a.id}${b.id}`, `${a.id}${b.id}`, a.id, b.id, "solid", "original"),
    makeSegment(`segment_${b.id}${c.id}`, `${b.id}${c.id}`, b.id, c.id, "solid", "original"),
    makeSegment(`segment_${c.id}${a.id}`, `${c.id}${a.id}`, c.id, a.id, "solid", "original"),
    ...height.lines.filter((line) => line.id !== "base_line"),
  ];

  return buildFunctionGraphTemplate({
    templateId: "triangle_area_coordinate_v1",
    title: "坐标三角形面积示意图",
    description: height.foot
      ? "本图展示坐标三角形的底和对应高，便于代入面积公式。"
      : "本图展示坐标三角形的三个顶点和三边；当前底边不水平或竖直，暂不强行绘制高。",
    points,
    auxiliaryLines,
    highlightObjects: [a.id, b.id, c.id, "height_CH"].filter(Boolean),
    confidence: height.confidence,
  });
}

function buildParallelPerpendicularTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);
  const compact = compactTemplateText(text);
  const pointsList = parseCoordinatePoints(text);
  const a = getPointById(pointsList, "A");
  const b = getPointById(pointsList, "B");
  const c = getPointById(pointsList, "C");
  const d = getPointById(pointsList, "D");

  if (!a || !b || !c || !d || isOrdinaryFunctionGraphQuestion(text)) {
    return null;
  }

  if (!/AB.*CD|CD.*AB/.test(compact) || !/(平行|垂直|判断)/.test(compact)) {
    return null;
  }

  const dx1 = b.x - a.x;
  const dy1 = b.y - a.y;
  const dx2 = d.x - c.x;
  const dy2 = d.y - c.y;
  const cross = round4(dx1 * dy2 - dy1 * dx2);
  const dot = round4(dx1 * dx2 + dy1 * dy2);
  const relation = Math.abs(cross) < 1e-8
    ? "平行"
    : Math.abs(dot) < 1e-8
      ? "垂直"
      : "不平行也不垂直";
  const points = pointMapFromList([a, b, c, d]);

  return buildFunctionGraphTemplate({
    templateId: "parallel_perpendicular_v1",
    title: "平行垂直关系示意图",
    description: `本图展示线段 AB 与 CD 的位置关系，可结合斜率或向量点乘判断：${relation}。`,
    points,
    auxiliaryLines: [
      makeSegment("segment_AB", "AB", "A", "B", "solid", "original"),
      makeSegment("segment_CD", "CD", "C", "D", "solid", "original"),
    ],
    highlightObjects: ["segment_AB", "segment_CD"],
  });
}

function hasIsoscelesTriangleSignals(text) {
  const normalizedText = normalizeMathQuestionText(text);
  const compact = compactTemplateText(normalizedText).toUpperCase();

  if (parseCoordinatePoints(text).length > 0 || isOrdinaryFunctionGraphQuestion(text)) {
    return false;
  }

  if (/圆|⊙|旋转|折叠|动点|最值|相似|∽|切线|弧|⌒|半径|直径/.test(normalizedText)) {
    return false;
  }

  const hasTriangleABC = /△ABC|\\TRIANGLEABC/.test(compact);
  const hasEqualSides = /AB=AC|AC=AB/.test(compact);
  const hasMidpoint = /D.{0,10}(是|为).{0,10}BC.{0,6}中点/.test(compact)
    || /BC.{0,10}中点.{0,10}D/.test(compact);
  const hasPerpendicularGoal = /AD.{0,8}(垂直|⊥|\\PERP).{0,8}BC/.test(compact)
    || /求证.{0,20}AD.{0,8}(垂直|⊥|\\PERP).{0,8}BC/.test(compact);

  return hasTriangleABC && hasEqualSides && hasMidpoint && hasPerpendicularGoal;
}

function buildIsoscelesTriangleTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasIsoscelesTriangleSignals(text)) {
    return null;
  }

  const points = {
    A: { x: 0, y: 3.2, label: "A" },
    B: { x: -2.4, y: 0, label: "B" },
    C: { x: 2.4, y: 0, label: "C" },
    D: { x: 0, y: 0, label: "D" },
  };
  const objects = [
    {
      kind: "polygon",
      id: "triangle_ABC",
      label: "△ABC",
      points: ["A", "B", "C"],
      role: "original",
      style: "solid",
    },
    {
      kind: "segment",
      id: "segment_AD",
      label: "AD",
      from: "A",
      to: "D",
      role: "auxiliary",
      style: "dashed",
    },
    {
      kind: "rightAngle",
      id: "right_angle_AD_BC",
      label: "AD ⟂ BC",
      points: ["B", "D", "A"],
      role: "highlight",
    },
    makeDiagramLabel("label_equal_sides", "AB=AC", -1.58, 1.55),
    makeDiagramLabel("label_midpoint", "BD=CD", 0, -0.44),
  ];

  return {
    type: "geometry",
    ...baseTemplateMeta("isosceles_triangle_v1", "geometry"),
    confidence: "high",
    title: "等腰三角形三线合一示意图",
    description: "本图展示等腰三角形中，底边中线与高线重合的关系。",
    points,
    objects,
    views: [
      {
        id: "main",
        title: "等腰三角形三线合一示意图",
        showObjects: objects.map((object) => object.id),
        highlightObjects: ["segment_AD", "right_angle_AD_BC"],
      },
    ],
    steps: [],
    notes: [
      "仅用于 AB=AC、D 是 BC 中点、求证 AD 垂直 BC 的稳定结构。",
      "使用初中全等三角形与三线合一关系，不使用坐标、向量或高级方法。",
    ],
  };
}

function hasMidpointMidlineSignals(text) {
  const normalizedText = normalizeMathQuestionText(text);
  const compact = compactTemplateText(normalizedText).toUpperCase();

  if (parseCoordinatePoints(text).length > 0 || isOrdinaryFunctionGraphQuestion(text)) {
    return false;
  }

  if (/坐标|直角坐标|X轴|Y轴|函数|圆|⊙|旋转|折叠|动点|最值|相似|∽|切线|弧|⌒|半径|直径/.test(compact)) {
    return false;
  }

  const hasTriangleABC = /△ABC|\\TRIANGLEABC/.test(compact);
  const hasMidpointM = /M.{0,10}(是|为).{0,10}AB.{0,6}中点/.test(compact)
    || /AB.{0,10}中点.{0,10}M/.test(compact);
  const hasMidpointN = /N.{0,10}(是|为).{0,10}AC.{0,6}中点/.test(compact)
    || /AC.{0,10}中点.{0,10}N/.test(compact);
  const hasParallelGoal = /MN.{0,8}(平行|∥|\/\/|\\PARALLEL).{0,8}BC/.test(compact)
    || /求证.{0,20}MN.{0,8}(平行|∥|\/\/|\\PARALLEL).{0,8}BC/.test(compact);

  return hasTriangleABC && hasMidpointM && hasMidpointN && hasParallelGoal;
}

function buildMidpointMidlineTemplate(questionText, source = {}) {
  const text = [
    questionText,
    source.problemText,
    source.title,
  ].map(asText).join("\n");

  if (!hasMidpointMidlineSignals(text)) {
    return null;
  }

  const points = {
    A: { x: 0, y: 3.2, label: "A" },
    B: { x: -2.4, y: 0, label: "B" },
    C: { x: 2.4, y: 0, label: "C" },
    M: { x: -1.2, y: 1.6, label: "M" },
    N: { x: 1.2, y: 1.6, label: "N" },
  };
  const objects = [
    {
      kind: "polygon",
      id: "triangle_ABC",
      label: "△ABC",
      points: ["A", "B", "C"],
      role: "original",
      style: "solid",
    },
    {
      kind: "segment",
      id: "segment_MN",
      label: "MN",
      from: "M",
      to: "N",
      role: "highlight",
      style: "solid",
    },
    makeDiagramLabel("label_midpoint_ab", "AM=MB", -1.72, 1.08),
    makeDiagramLabel("label_midpoint_ac", "AN=NC", 1.72, 1.08),
  ];

  return {
    type: "geometry",
    ...baseTemplateMeta("midpoint_midline_v1", "geometry"),
    confidence: "high",
    title: "三角形中位线示意图",
    description: "本图展示三角形两边中点连线平行于第三边的关系。",
    points,
    objects,
    views: [
      {
        id: "main",
        title: "三角形中位线示意图",
        showObjects: objects.map((object) => object.id),
        highlightObjects: ["segment_MN"],
      },
    ],
    steps: [],
    notes: [
      "仅用于 M 是 AB 中点、N 是 AC 中点、求证 MN 平行 BC 的稳定结构。",
      "使用初中三角形中位线定理，不使用坐标、向量或高级方法。",
    ],
  };
}

function hasParallelAngleSignals(text) {
  const normalizedText = normalizeMathQuestionText(text);
  const compact = compactTemplateText(normalizedText).toUpperCase();

  if (parseCoordinatePoints(text).length > 0 || isOrdinaryFunctionGraphQuestion(text)) {
    return false;
  }

  if (/坐标|直角坐标|X轴|Y轴|函数|圆|⊙|旋转|折叠|动点|最值|相似|∽|切线|弧|⌒|半径|直径|角度|度数|多少度|计算/.test(compact)) {
    return false;
  }

  const hasParallelABCD = /AB.{0,4}(∥|\/\/|\|\||平行|\\PARALLEL).{0,4}CD/.test(compact)
    || /CD.{0,4}(∥|\/\/|\|\||平行|\\PARALLEL).{0,4}AB/.test(compact);
  const hasLineEF = /直线EF|截线EF|EF.{0,4}(是|为).{0,4}截线/.test(compact);
  const hasIntersectionEF = /EF.{0,12}(分别)?(交|相交).{0,8}AB.{0,8}CD.{0,12}(点)?E.{0,4}F/.test(compact);
  const hasAngleGoal = /(?:∠|\\ANGLE)AEF={1,2}(?:∠|\\ANGLE)EFD/.test(compact)
    || /角AEF=角EFD/.test(compact)
    || /角AEF等于角EFD/.test(compact)
    || /(?:∠|\\ANGLE)AEF.{0,4}(与|和).{0,4}(?:∠|\\ANGLE)EFD.{0,4}相等/.test(compact)
    || (/(求证|证明)/.test(compact) && /内错角.{0,4}相等/.test(compact));

  return hasParallelABCD && hasLineEF && hasIntersectionEF && hasAngleGoal;
}

function buildParallelAngleTemplate(questionText, source = {}) {
  const text = [
    questionText,
    source.problemText,
    source.title,
  ].map(asText).join("\n");

  if (!hasParallelAngleSignals(text)) {
    return null;
  }

  const points = {
    A: { x: -3.2, y: 2.2, label: "A" },
    E: { x: -0.8, y: 2.2, label: "E" },
    B: { x: 2.8, y: 2.2, label: "B" },
    C: { x: -2.8, y: 0, label: "C" },
    F: { x: 0.8, y: 0, label: "F" },
    D: { x: 3.2, y: 0, label: "D" },
  };
  const objects = [
    {
      kind: "segment",
      id: "segment_AB",
      label: "AB",
      from: "A",
      to: "B",
      role: "original",
      style: "solid",
    },
    {
      kind: "segment",
      id: "segment_CD",
      label: "CD",
      from: "C",
      to: "D",
      role: "original",
      style: "solid",
    },
    {
      kind: "segment",
      id: "segment_EF",
      label: "EF",
      from: "E",
      to: "F",
      role: "original",
      style: "solid",
    },
    {
      kind: "angle",
      id: "angle_AEF",
      label: "∠AEF",
      points: ["A", "E", "F"],
      role: "highlight",
    },
    {
      kind: "angle",
      id: "angle_EFD",
      label: "∠EFD",
      points: ["E", "F", "D"],
      role: "highlight",
    },
    makeDiagramLabel("label_angle_aef", "∠AEF", -1.52, 1.36),
    makeDiagramLabel("label_angle_efd", "∠EFD", 1.18, 0.58),
    makeDiagramLabel("label_parallel", "AB∥CD", 1.72, 1.36),
  ];

  return {
    type: "geometry",
    ...baseTemplateMeta("parallel_angle_v1", "geometry"),
    confidence: "high",
    title: "平行线角关系示意图",
    description: "本图保留两条平行线、截线和题目中的两个目标角。",
    points,
    objects,
    views: [
      {
        id: "main",
        title: "平行线角关系示意图",
        showObjects: objects.map((object) => object.id),
        highlightObjects: ["angle_AEF", "angle_EFD", "label_parallel"],
      },
    ],
    steps: [],
    notes: [
      "仅用于 AB 平行 CD、直线 EF 分别交 AB 和 CD 于 E、F、求证 ∠AEF = ∠EFD 的稳定结构。",
      "使用初中平行线性质：两直线平行，内错角相等；不使用坐标、斜率、向量或高级方法。",
    ],
  };
}

function getCongruentTriangleSignalContext(text) {
  const normalizedText = normalizeMathQuestionText(text);
  const compact = compactTemplateText(normalizedText).toUpperCase();

  if (parseCoordinatePoints(text).length > 0 || isOrdinaryFunctionGraphQuestion(text)) {
    return null;
  }

  if (/坐标|直角坐标|X轴|Y轴|函数|圆|⊙|旋转|折叠|动点|最值|相似|∽|切线|弧|⌒|半径|直径/.test(compact)) {
    return null;
  }

  const hasTriangleABC = /△ABC|\\TRIANGLEABC/.test(compact);
  const hasTriangleDEF = /△DEF|\\TRIANGLEDEF/.test(compact);
  const hasCongruentRelation = /△ABC≌△DEF|△DEF≌△ABC/.test(compact);
  const hasProofIntent = /(求证|证明|证|可得|推出|得到)/.test(compact);
  const hasCongruentGoal = hasCongruentRelation && hasProofIntent;

  if (!hasTriangleABC || !hasTriangleDEF || !hasCongruentGoal) {
    return null;
  }

  return { normalizedText, compact };
}

function hasCongruentEqualPair(compact, first, second) {
  return compact.includes(`${first}=${second}`) || compact.includes(`${second}=${first}`);
}

function buildCongruentTriangleTemplateBase(options) {
  const points = options.rightTriangle
    ? {
        A: { x: -3.4, y: 2.4, label: "A" },
        B: { x: -5.4, y: 0, label: "B" },
        C: { x: -3.4, y: 0, label: "C" },
        D: { x: 2.2, y: 2.4, label: "D" },
        E: { x: 0.2, y: 0, label: "E" },
        F: { x: 2.2, y: 0, label: "F" },
      }
    : {
        A: { x: -4.4, y: 2.4, label: "A" },
        B: { x: -5.8, y: 0, label: "B" },
        C: { x: -3.0, y: 0, label: "C" },
        D: { x: 1.4, y: 2.4, label: "D" },
        E: { x: 0.0, y: 0, label: "E" },
        F: { x: 2.8, y: 0, label: "F" },
      };
  const angleObjects = (options.angleObjects || []).map((angle) => ({
    kind: "angle",
    id: angle.id,
    label: angle.label,
    points: angle.points,
    role: "highlight",
  }));
  const rightAngleObjects = (options.rightAngleObjects || []).map((angle) => ({
    kind: "rightAngle",
    id: angle.id,
    label: angle.label,
    points: angle.points,
    role: "highlight",
  }));
  const conditionLabels = options.showConditionLabels === true
    ? createCleanConditionLabels(options.conditionLabels, "label_congruent_condition")
    : [];
  const theoremLabel = makeShortTheoremLabel(
    options.diagramLabel,
    -1.45,
    2.92,
    "label_congruent_theorem",
  );
  const conclusionLabel = makeConclusionLabel(
    "△ABC≌△DEF",
    -1.45,
    -0.52,
    "label_congruent_conclusion",
  );
  const objects = [
    {
      kind: "polygon",
      id: "triangle_ABC",
      label: "△ABC",
      points: ["A", "B", "C"],
      role: "original",
      style: "solid",
    },
    {
      kind: "polygon",
      id: "triangle_DEF",
      label: "△DEF",
      points: ["D", "E", "F"],
      role: "original",
      style: "solid",
    },
    ...angleObjects,
    ...rightAngleObjects,
    theoremLabel,
    ...conditionLabels,
    conclusionLabel,
  ].filter(Boolean);
  const highlightObjects = objects
    .filter((object) => object.role === "highlight")
    .map((object) => object.id);

  return {
    type: "geometry",
    ...baseTemplateMeta(options.templateId, "geometry"),
    confidence: "high",
    title: options.title,
    description: options.description,
    points,
    objects,
    views: [
      {
        id: "main",
        title: options.title,
        showObjects: objects.map((object) => object.id),
        highlightObjects,
      },
    ],
    steps: [],
    notes: [
      options.scopeNote,
      `使用初中三角形全等判定：${options.theoremName}。`,
      ...(options.conditionNotes || []),
      "不使用坐标、向量、高中三角或复杂综合方法。",
    ].filter(Boolean),
  };
}

function hasCongruentTriangleSssSignals(text) {
  const context = getCongruentTriangleSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  return hasCongruentEqualPair(compact, "AB", "DE")
    && hasCongruentEqualPair(compact, "AC", "DF")
    && hasCongruentEqualPair(compact, "BC", "EF");
}

function buildCongruentTriangleSssTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasCongruentTriangleSssSignals(text)) {
    return null;
  }

  return buildCongruentTriangleTemplateBase({
    templateId: "congruent_triangle_sss_v1",
    title: "两个三角形结构示意图",
    description: "本图保留两个三角形和对应顶点，条件关系留在解析文字中。",
    theoremName: "SSS（三边对应相等）",
    diagramLabel: "SSS 全等",
    scopeNote: "仅用于 AB=DE、AC=DF、BC=EF，求证 △ABC≌△DEF 的稳定结构。",
    conditionNotes: [
      "已知条件：AB=DE、AC=DF、BC=EF。",
    ],
  });
}

function hasCongruentTriangleSasSignals(text) {
  const context = getCongruentTriangleSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  return hasCongruentEqualPair(compact, "AB", "DE")
    && hasCongruentEqualPair(compact, "AC", "DF")
    && hasCongruentEqualPair(compact, "∠BAC", "∠EDF");
}

function buildCongruentTriangleSasTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasCongruentTriangleSasSignals(text)) {
    return null;
  }

  return buildCongruentTriangleTemplateBase({
    templateId: "congruent_triangle_sas_v1",
    title: "三角形全等 SAS 示意图",
    description: "本图展示两边及夹角对应相等时，两个三角形全等的关系。",
    theoremName: "SAS（两边及夹角对应相等）",
    diagramLabel: "SAS 全等",
    scopeNote: "仅用于 AB=DE、AC=DF、∠BAC=∠EDF，求证 △ABC≌△DEF 的稳定结构。",
    angleObjects: [
      { id: "angle_BAC", label: "∠BAC", points: ["B", "A", "C"] },
      { id: "angle_EDF", label: "∠EDF", points: ["E", "D", "F"] },
    ],
    conditionNotes: [
      "已知条件：AB=DE、AC=DF、∠BAC=∠EDF。",
    ],
  });
}

function hasCongruentTriangleAsaSignals(text) {
  const context = getCongruentTriangleSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  const simpleAsa = hasCongruentEqualPair(compact, "∠A", "∠D")
    && hasCongruentEqualPair(compact, "AB", "DE")
    && hasCongruentEqualPair(compact, "∠B", "∠E");
  const fullAsa = hasCongruentEqualPair(compact, "∠CAB", "∠FDE")
    && hasCongruentEqualPair(compact, "AB", "DE")
    && hasCongruentEqualPair(compact, "∠CBA", "∠FED");

  return simpleAsa || fullAsa;
}

function buildCongruentTriangleAsaTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasCongruentTriangleAsaSignals(text)) {
    return null;
  }

  return buildCongruentTriangleTemplateBase({
    templateId: "congruent_triangle_asa_v1",
    title: "三角形全等 ASA 示意图",
    description: "本图展示两角及夹边对应相等时，两个三角形全等的关系。",
    theoremName: "ASA（两角及夹边对应相等）",
    diagramLabel: "ASA 全等",
    scopeNote: "仅用于 ∠A=∠D、AB=DE、∠B=∠E，求证 △ABC≌△DEF 的稳定结构。",
    angleObjects: [
      { id: "angle_A", label: "∠A", points: ["B", "A", "C"] },
      { id: "angle_D", label: "∠D", points: ["E", "D", "F"] },
      { id: "angle_B", label: "∠B", points: ["A", "B", "C"] },
      { id: "angle_E", label: "∠E", points: ["D", "E", "F"] },
    ],
    conditionNotes: [
      "已知条件：∠A=∠D、AB=DE、∠B=∠E。",
    ],
  });
}

function hasCongruentTriangleAasSignals(text) {
  const context = getCongruentTriangleSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  return hasCongruentEqualPair(compact, "∠A", "∠D")
    && hasCongruentEqualPair(compact, "∠B", "∠E")
    && hasCongruentEqualPair(compact, "AC", "DF");
}

function buildCongruentTriangleAasTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasCongruentTriangleAasSignals(text)) {
    return null;
  }

  return buildCongruentTriangleTemplateBase({
    templateId: "congruent_triangle_aas_v1",
    title: "三角形全等 AAS 示意图",
    description: "本图展示两角及其中一角的对边对应相等时，两个三角形全等的关系。",
    theoremName: "AAS（两角及其中一角的对边对应相等）",
    diagramLabel: "AAS 全等",
    scopeNote: "仅用于 ∠A=∠D、∠B=∠E、AC=DF，求证 △ABC≌△DEF 的稳定结构。",
    angleObjects: [
      { id: "angle_A", label: "∠A", points: ["B", "A", "C"] },
      { id: "angle_D", label: "∠D", points: ["E", "D", "F"] },
      { id: "angle_B", label: "∠B", points: ["A", "B", "C"] },
      { id: "angle_E", label: "∠E", points: ["D", "E", "F"] },
    ],
    conditionNotes: [
      "已知条件：∠A=∠D、∠B=∠E、AC=DF。",
    ],
  });
}

function hasCongruentTriangleHlSignals(text) {
  const context = getCongruentTriangleSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  const hasRightTriangles = /RT△ABC/.test(compact) && /RT△DEF/.test(compact);
  const hasSharedRightAngle = /∠C=∠F=90(?:°|度)?/.test(compact)
    || /∠F=∠C=90(?:°|度)?/.test(compact);
  const hasSeparateRightAngles = /∠C=90(?:°|度)?/.test(compact)
    && /∠F=90(?:°|度)?/.test(compact);

  return hasRightTriangles
    && (hasSharedRightAngle || hasSeparateRightAngles)
    && hasCongruentEqualPair(compact, "AB", "DE")
    && hasCongruentEqualPair(compact, "AC", "DF");
}

function buildCongruentTriangleHlTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasCongruentTriangleHlSignals(text)) {
    return null;
  }

  return buildCongruentTriangleTemplateBase({
    templateId: "congruent_triangle_hl_v1",
    title: "直角三角形全等 HL 示意图",
    description: "本图展示斜边和一条直角边对应相等时，两个直角三角形全等的关系。",
    theoremName: "HL（斜边和一条直角边对应相等）",
    diagramLabel: "HL 全等",
    scopeNote: "仅用于 Rt△ABC 和 Rt△DEF 中，∠C=∠F=90°、AB=DE、AC=DF，求证 △ABC≌△DEF 的稳定结构。",
    rightTriangle: true,
    rightAngleObjects: [
      { id: "right_angle_C", label: "∠C=90°", points: ["A", "C", "B"] },
      { id: "right_angle_F", label: "∠F=90°", points: ["D", "F", "E"] },
    ],
    conditionNotes: [
      "已知条件：∠C=∠F=90°、AB=DE、AC=DF。",
    ],
  });
}

function getSimilarTriangleSignalContext(text) {
  const normalizedText = normalizeMathQuestionText(text);
  const compact = compactTemplateText(normalizedText).toUpperCase();

  if (parseCoordinatePoints(text).length > 0 || isOrdinaryFunctionGraphQuestion(text)) {
    return null;
  }

  if (/坐标|直角坐标|X轴|Y轴|函数|圆|⊙|旋转|折叠|动点|最值|全等|≌|切线|弧|⌒|半径|直径/.test(compact)) {
    return null;
  }

  const hasTriangleABC = /△ABC|\\TRIANGLEABC/.test(compact);
  const hasTriangleDEF = /△DEF|\\TRIANGLEDEF/.test(compact);
  const hasSimilarRelation = /△ABC∽△DEF|△DEF∽△ABC/.test(compact);
  const hasProofIntent = /(求证|证明|证|可得|推出|得到)/.test(compact);
  const hasSimilarGoal = hasSimilarRelation && hasProofIntent;

  if (!hasTriangleABC || !hasTriangleDEF || !hasSimilarGoal) {
    return null;
  }

  return { normalizedText, compact };
}

function hasSimilarRatioPair(compact) {
  return /AB\/DE=AC\/DF|AC\/DF=AB\/DE/.test(compact)
    || /AB:DE=AC:DF|AC:DF=AB:DE/.test(compact);
}

function hasSimilarRatioTriple(compact) {
  return /AB\/DE=AC\/DF=BC\/EF/.test(compact)
    || /AB:DE=AC:DF=BC:EF/.test(compact);
}

function buildSimilarTriangleTemplateBase(options) {
  const points = {
    A: { x: -4.4, y: 2.4, label: "A" },
    B: { x: -5.8, y: 0, label: "B" },
    C: { x: -3.0, y: 0, label: "C" },
    D: { x: 1.4, y: 2.0, label: "D" },
    E: { x: 0.2, y: 0, label: "E" },
    F: { x: 2.4, y: 0, label: "F" },
  };
  const angleObjects = (options.angleObjects || []).map((angle) => ({
    kind: "angle",
    id: angle.id,
    label: angle.label,
    points: angle.points,
    role: "highlight",
  }));
  const conditionLabels = options.showConditionLabels === true
    ? createCleanConditionLabels(options.conditionLabels, "label_similar_condition")
    : [];
  const theoremLabel = makeShortTheoremLabel(
    options.diagramLabel,
    -1.45,
    2.72,
    "label_similar_theorem",
  );
  const conclusionLabel = makeConclusionLabel(
    "△ABC∽△DEF",
    -1.45,
    -0.52,
    "label_similar_conclusion",
  );
  const objects = [
    {
      kind: "polygon",
      id: "triangle_ABC",
      label: "△ABC",
      points: ["A", "B", "C"],
      role: "original",
      style: "solid",
    },
    {
      kind: "polygon",
      id: "triangle_DEF",
      label: "△DEF",
      points: ["D", "E", "F"],
      role: "original",
      style: "solid",
    },
    ...angleObjects,
    theoremLabel,
    ...conditionLabels,
    conclusionLabel,
  ].filter(Boolean);
  const highlightObjects = objects
    .filter((object) => object.role === "highlight")
    .map((object) => object.id);

  return {
    type: "geometry",
    ...baseTemplateMeta(options.templateId, "geometry"),
    confidence: "high",
    title: options.title,
    description: options.description,
    points,
    objects,
    views: [
      {
        id: "main",
        title: options.title,
        showObjects: objects.map((object) => object.id),
        highlightObjects,
      },
    ],
    steps: [],
    notes: [
      options.scopeNote,
      `使用初中三角形相似判定：${options.theoremName}。`,
      ...(options.conditionNotes || []),
      "不使用坐标、向量、高中方法，不自动推导题干没有给出的隐藏比例。",
    ].filter(Boolean),
  };
}

function hasSimilarTriangleAaSignals(text) {
  const context = getSimilarTriangleSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  return hasCongruentEqualPair(compact, "∠A", "∠D")
    && hasCongruentEqualPair(compact, "∠B", "∠E");
}

function buildSimilarTriangleAaTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasSimilarTriangleAaSignals(text)) {
    return null;
  }

  return buildSimilarTriangleTemplateBase({
    templateId: "similar_triangle_aa_v1",
    title: "三角形 AA 相似示意图",
    description: "本图展示两角对应相等时，两个三角形相似的关系。",
    theoremName: "AA（两角对应相等）",
    diagramLabel: "AA 相似",
    scopeNote: "仅用于 ∠A=∠D、∠B=∠E，求证 △ABC∽△DEF 的稳定结构。",
    angleObjects: [
      { id: "angle_A", label: "∠A", points: ["B", "A", "C"] },
      { id: "angle_D", label: "∠D", points: ["E", "D", "F"] },
      { id: "angle_B", label: "∠B", points: ["A", "B", "C"] },
      { id: "angle_E", label: "∠E", points: ["D", "E", "F"] },
    ],
    conditionNotes: [
      "已知条件：∠A=∠D、∠B=∠E。",
    ],
  });
}

function hasSimilarTriangleSasSignals(text) {
  const context = getSimilarTriangleSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  return hasSimilarRatioPair(compact)
    && hasCongruentEqualPair(compact, "∠A", "∠D");
}

function buildSimilarTriangleSasTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasSimilarTriangleSasSignals(text)) {
    return null;
  }

  return buildSimilarTriangleTemplateBase({
    templateId: "similar_triangle_sas_v1",
    title: "三角形 SAS 相似示意图",
    description: "本图展示两边对应成比例且夹角相等时，两个三角形相似的关系。",
    theoremName: "SAS（两边对应成比例且夹角相等）",
    diagramLabel: "SAS 相似",
    scopeNote: "仅用于 AB/DE=AC/DF、∠A=∠D，求证 △ABC∽△DEF 的稳定结构。",
    angleObjects: [
      { id: "angle_A", label: "∠A", points: ["B", "A", "C"] },
      { id: "angle_D", label: "∠D", points: ["E", "D", "F"] },
    ],
    conditionNotes: [
      "已知条件：AB/DE=AC/DF、∠A=∠D。",
    ],
  });
}

function hasSimilarTriangleSssSignals(text) {
  const context = getSimilarTriangleSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  return hasSimilarRatioTriple(compact);
}

function buildSimilarTriangleSssTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasSimilarTriangleSssSignals(text)) {
    return null;
  }

  return buildSimilarTriangleTemplateBase({
    templateId: "similar_triangle_sss_v1",
    title: "两个三角形形状关系示意图",
    description: "本图保留两个大小不同的三角形和对应顶点，比例关系留在解析文字中。",
    theoremName: "SSS（三边对应成比例）",
    diagramLabel: "SSS 相似",
    scopeNote: "仅用于 AB/DE=AC/DF=BC/EF，求证 △ABC∽△DEF 的稳定结构。",
    conditionNotes: [
      "已知条件：AB/DE=AC/DF=BC/EF。",
    ],
  });
}

function getGeometryPropertySignalContext(text) {
  const normalizedText = normalizeMathQuestionText(text);
  const compact = compactTemplateText(normalizedText).toUpperCase();

  if (parseCoordinatePoints(text).length > 0 || isOrdinaryFunctionGraphQuestion(text)) {
    return null;
  }

  if (/坐标|直角坐标|X轴|Y轴|函数|圆|⊙|旋转|折叠|动点|最值|相似|∽|全等|≌|切线|弧|⌒|半径|直径/.test(compact)) {
    return null;
  }

  return { normalizedText, compact };
}

function hasAngleBisectorSignals(text) {
  const context = getGeometryPropertySignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  const hasTriangleABC = /△ABC|\\TRIANGLEABC/.test(compact);
  const hasBisector = /AD(?:是|为)?∠BAC的角平分线/.test(compact)
    || /AD平分∠BAC/.test(compact);
  const hasPointDOnBC = /(?:点)?D在(?:线段)?BC上/.test(compact)
    || /D.{0,6}BC上/.test(compact);
  const hasAngleGoal = hasCongruentEqualPair(compact, "∠BAD", "∠DAC");
  const hasProofIntent = /(求证|证明|证)/.test(compact);

  return hasTriangleABC && hasBisector && hasPointDOnBC && hasAngleGoal && hasProofIntent;
}

function buildAngleBisectorTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasAngleBisectorSignals(text)) {
    return null;
  }

  const points = {
    A: { x: 0, y: 3.2, label: "A" },
    B: { x: -2.6, y: 0, label: "B" },
    C: { x: 2.6, y: 0, label: "C" },
    D: { x: 0, y: 0, label: "D" },
  };
  const objects = [
    {
      kind: "polygon",
      id: "triangle_ABC",
      label: "△ABC",
      points: ["A", "B", "C"],
      role: "original",
      style: "solid",
    },
    makeSegment("segment_AD", "AD", "A", "D", "solid", "highlight"),
    {
      kind: "angle",
      id: "angle_BAD",
      label: "∠BAD",
      points: ["B", "A", "D"],
      role: "highlight",
    },
    {
      kind: "angle",
      id: "angle_DAC",
      label: "∠DAC",
      points: ["D", "A", "C"],
      role: "highlight",
    },
  ].filter(Boolean);

  return {
    type: "geometry",
    ...baseTemplateMeta("angle_bisector_v1", "geometry"),
    confidence: "high",
    title: "角平分线性质示意图",
    description: "本图展示角平分线把一个角分成两个相等角的关系。",
    points,
    objects,
    views: [
      {
        id: "main",
        title: "角平分线性质示意图",
        showObjects: objects.map((object) => object.id),
        highlightObjects: ["segment_AD", "angle_BAD", "angle_DAC"],
      },
    ],
    steps: [],
    notes: [
      "仅用于 AD 是 ∠BAC 的角平分线、点 D 在 BC 上、求证 ∠BAD=∠DAC 的稳定结构。",
      "使用初中角平分线定义，不使用坐标、向量或高中方法。",
    ],
  };
}

function hasPerpendicularBisectorSignals(text) {
  const context = getGeometryPropertySignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  const hasSegmentAB = /线段AB|AB/.test(compact);
  const hasPerpendicularBisector = /(?:直线)?L(?:是|为)(?:线段)?AB的垂直平分线/.test(compact)
    || /(?:直线)?L垂直平分(?:线段)?AB/.test(compact);
  const hasPointPOnLine = /(?:点)?P在(?:直线)?L上/.test(compact);
  const hasDistanceGoal = hasCongruentEqualPair(compact, "PA", "PB");
  const hasProofIntent = /(求证|证明|证)/.test(compact);

  return hasSegmentAB && hasPerpendicularBisector && hasPointPOnLine && hasDistanceGoal && hasProofIntent;
}

function buildPerpendicularBisectorTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasPerpendicularBisectorSignals(text)) {
    return null;
  }

  const points = {
    A: { x: -2.2, y: 0, label: "A" },
    M: { x: 0, y: 0, label: "M" },
    B: { x: 2.2, y: 0, label: "B" },
    P: { x: 0, y: 2.4, label: "P" },
  };
  const objects = [
    makeSegment("segment_AB", "AB", "A", "B", "solid", "original"),
    makeLine("line_l", "l", "M", "P", "solid", "highlight"),
    makeSegment("segment_PA", "PA", "P", "A", "solid", "highlight"),
    makeSegment("segment_PB", "PB", "P", "B", "solid", "highlight"),
    {
      kind: "rightAngle",
      id: "right_angle_l_AB",
      label: "l ⊥ AB",
      points: ["A", "M", "P"],
      role: "highlight",
    },
    makeDiagramLabel("label_line_l", "l", 0.28, 2.58),
    makeDiagramLabel("label_equal_distances", "PA=PB", 0, -0.48),
  ].filter(Boolean);

  return {
    type: "geometry",
    ...baseTemplateMeta("perpendicular_bisector_v1", "geometry"),
    confidence: "high",
    title: "线段垂线关系示意图",
    description: "本图保留线段 AB、中点 M、直线 l、点 P 以及 PA、PB。",
    points,
    objects,
    views: [
      {
        id: "main",
        title: "线段垂线关系示意图",
        showObjects: objects.map((object) => object.id),
        highlightObjects: ["line_l", "segment_PA", "segment_PB", "right_angle_l_AB", "label_equal_distances"],
      },
    ],
    steps: [],
    notes: [
      "仅用于 l 是线段 AB 的垂直平分线、点 P 在 l 上、求证 PA=PB 的稳定结构。",
      "使用初中垂直平分线性质，不使用坐标、向量或高中方法。",
    ],
  };
}

function parsePositiveLength(compact, segment) {
  const match = compact.match(new RegExp(`${segment}=([0-9]+(?:\\.[0-9]+)?)`));
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getPythagoreanSignalContext(text) {
  const context = getGeometryPropertySignalContext(text);
  if (!context) {
    return null;
  }

  const { compact } = context;
  const acLength = parsePositiveLength(compact, "AC");
  const bcLength = parsePositiveLength(compact, "BC");
  const hasRightTriangle = /RT△ABC/.test(compact) || /直角△ABC/.test(compact);
  const hasRightAngleC = /∠C=90(?:°|度)?/.test(compact)
    || /∠ACB=90(?:°|度)?/.test(compact)
    || /∠BCA=90(?:°|度)?/.test(compact);
  const asksAB = /求AB|求出AB|AB的长|求斜边AB/.test(compact);

  if (!hasRightTriangle || !hasRightAngleC || !acLength || !bcLength || !asksAB) {
    return null;
  }

  return {
    ...context,
    acLength,
    bcLength,
    abLength: Math.sqrt(acLength * acLength + bcLength * bcLength),
  };
}

function hasPythagoreanRightTriangleSignals(text) {
  return Boolean(getPythagoreanSignalContext(text));
}

function buildPythagoreanRightTriangleTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);
  const context = getPythagoreanSignalContext(text);

  if (!context) {
    return null;
  }

  const { acLength, bcLength, abLength } = context;
  const scale = 3.2 / Math.max(acLength, bcLength, 1);
  const scaledAC = acLength * scale;
  const scaledBC = bcLength * scale;
  const abText = formatCoordinateValue(abLength);
  const points = {
    A: { x: 0, y: scaledAC, label: "A" },
    C: { x: 0, y: 0, label: "C" },
    B: { x: scaledBC, y: 0, label: "B" },
  };
  const objects = [
    {
      kind: "polygon",
      id: "triangle_ABC",
      label: "Rt△ABC",
      points: ["A", "C", "B"],
      role: "original",
      style: "solid",
    },
    {
      kind: "rightAngle",
      id: "right_angle_C",
      label: "∠C=90°",
      points: ["A", "C", "B"],
      role: "highlight",
    },
    makeDiagramLabel("label_ac", `AC=${formatCoordinateValue(acLength)}`, -0.48, scaledAC * 0.5),
    makeDiagramLabel("label_bc", `BC=${formatCoordinateValue(bcLength)}`, scaledBC * 0.5, -0.38),
    makeDiagramLabel("label_ab_unknown", "AB=?", scaledBC * 0.52 + 0.22, scaledAC * 0.5 + 0.18),
  ].filter(Boolean);

  return {
    type: "geometry",
    ...baseTemplateMeta("pythagorean_right_triangle_v1", "geometry"),
    confidence: "high",
    title: "直角三角形边长示意图",
    description: "本图保留直角三角形的已知边和未知边。",
    points,
    objects,
    views: [
      {
        id: "main",
        title: "直角三角形边长示意图",
        showObjects: objects.map((object) => object.id),
        highlightObjects: ["right_angle_C", "label_ac", "label_bc", "label_ab_unknown"],
      },
    ],
    steps: [],
    notes: [
      `仅用于 Rt△ABC 中，∠C=90°，AC=${formatCoordinateValue(acLength)}，BC=${formatCoordinateValue(bcLength)}，求 AB 的稳定结构。`,
      `使用勾股定理：AB²=AC²+BC²，可得 AB=${abText}。`,
      "不使用坐标、向量或高中方法。",
    ],
  };
}

function getCircleBasicSignalContext(text) {
  const normalizedText = normalizeMathQuestionText(text);
  const compact = compactTemplateText(normalizedText).toUpperCase();

  if (parseCoordinatePoints(text).length > 0 || isOrdinaryFunctionGraphQuestion(text)) {
    return null;
  }

  if (/坐标|直角坐标|X轴|Y轴|函数|四点共圆|圆幂|切割线|弦切角|旋转|折叠|动点|最值|轨迹|相似|∽|全等|≌/.test(compact)) {
    return null;
  }

  return { normalizedText, compact };
}

function hasCircleOSignal(compact) {
  return /⊙O|圆O|同圆|圆心O/.test(compact);
}

function hasProofIntent(compact) {
  return /(求证|证明|证)/.test(compact);
}

function circlePoint(radius, angleDegrees) {
  const radians = (Number(angleDegrees) * Math.PI) / 180;
  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  };
}

function hasRadiusSegment(compact, segment) {
  return new RegExp(`${segment}(?:是|为)?(?:⊙O的)?半径`).test(compact)
    || new RegExp(`半径${segment}`).test(compact);
}

function hasRadiusEqualSignals(text) {
  const context = getCircleBasicSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  const hasCircle = hasCircleOSignal(compact);
  const hasPairRadius = /OA[、,，和与]?OB(?:是|为)?(?:⊙O的|同圆)?半径/.test(compact)
    || /OA和OB(?:是|为)?(?:⊙O的|同圆)?半径/.test(compact);
  const hasTwoRadii = hasPairRadius || (hasRadiusSegment(compact, "OA") && hasRadiusSegment(compact, "OB"));
  const hasGoal = hasCongruentEqualPair(compact, "OA", "OB");

  return hasCircle && hasTwoRadii && hasGoal && hasProofIntent(compact);
}

function buildCircleBaseTemplate(options) {
  const objects = (options.objects || []).filter(Boolean);

  return {
    type: "geometry",
    ...baseTemplateMeta(options.templateId, "circle"),
    confidence: "high",
    title: options.title,
    description: options.description,
    points: options.points,
    objects,
    views: [
      {
        id: "main",
        title: options.title,
        showObjects: objects.map((object) => object.id),
        highlightObjects: options.highlightObjects || [],
      },
    ],
    steps: [],
    notes: options.notes || [],
  };
}

function buildRadiusEqualTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasRadiusEqualSignals(text)) {
    return null;
  }

  const radius = 1.55;
  const pointA = circlePoint(radius, 20);
  const pointB = circlePoint(radius, 138);
  const points = {
    O: { x: 0, y: 0, label: "O" },
    A: { ...pointA, label: "A" },
    B: { ...pointB, label: "B" },
  };
  const objects = [
    {
      kind: "circle",
      id: "circle_O",
      label: "⊙O",
      center: "O",
      radius,
      role: "original",
      style: "solid",
    },
    makeSegment("segment_OA", "OA", "O", "A", "solid", "highlight"),
    makeSegment("segment_OB", "OB", "O", "B", "solid", "highlight"),
  ];

  return buildCircleBaseTemplate({
    templateId: "radius_equal_v1",
    title: "圆的半径示意图",
    description: "本图保留圆 O、圆心 O、圆上点 A、B 以及半径 OA、OB。",
    points,
    objects,
    highlightObjects: ["segment_OA", "segment_OB"],
    notes: [
      "仅用于 OA、OB 是 ⊙O 的半径，求证 OA=OB 的稳定结构。",
      "使用初中圆的基础性质：同一个圆中，所有半径相等。",
    ],
  });
}

function hasDiameterRightAngleSignals(text) {
  const context = getCircleBasicSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  const hasCircle = hasCircleOSignal(compact);
  const hasDiameter = /AB(?:是|为)?(?:⊙O的)?直径/.test(compact)
    || /直径AB/.test(compact);
  const hasPointCOnCircle = /(?:点)?C在⊙O上/.test(compact)
    || /C是⊙O上一点/.test(compact)
    || /C在⊙O上/.test(compact);
  const hasGoal = /∠ACB=90(?:°|度)?/.test(compact)
    || /∠ACB(?:是|为)?直角/.test(compact);

  return hasCircle && hasDiameter && hasPointCOnCircle && hasGoal && hasProofIntent(compact);
}

function buildDiameterRightAngleTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasDiameterRightAngleSignals(text)) {
    return null;
  }

  const radius = 1.6;
  const pointC = circlePoint(radius, 66);
  const points = {
    O: { x: 0, y: 0, label: "O" },
    A: { x: -radius, y: 0, label: "A" },
    B: { x: radius, y: 0, label: "B" },
    C: { ...pointC, label: "C" },
  };
  const objects = [
    {
      kind: "circle",
      id: "circle_O",
      label: "⊙O",
      center: "O",
      radius,
      role: "original",
      style: "solid",
    },
    makeSegment("segment_AB", "AB", "A", "B", "solid", "original"),
    makeSegment("segment_AC", "AC", "A", "C", "solid", "original"),
    makeSegment("segment_BC", "BC", "B", "C", "solid", "original"),
    {
      kind: "rightAngle",
      id: "right_angle_ACB",
      label: "∠ACB",
      points: ["A", "C", "B"],
      role: "highlight",
    },
  ];

  return buildCircleBaseTemplate({
    templateId: "diameter_right_angle_v1",
    title: "圆周角直角示意图",
    description: "本图保留圆 O、直径 AB、圆上点 C、AC、BC 和 C 处直角标记。",
    points,
    objects,
    highlightObjects: ["right_angle_ACB"],
    notes: [
      "仅用于 AB 是 ⊙O 的直径、点 C 在 ⊙O 上、求证 ∠ACB=90° 的稳定结构。",
      "使用初中圆的基础性质：直径所对的圆周角是直角。",
    ],
  });
}

function hasTangentRadiusPerpendicularSignals(text) {
  const context = getCircleBasicSignalContext(text);
  if (!context) {
    return false;
  }

  const { compact } = context;
  const hasCircle = hasCircleOSignal(compact);
  const hasTangent = /PA(?:是|为)?(?:⊙O的)?切线/.test(compact)
    || /切线PA/.test(compact)
    || /PA(?:与|和)?⊙O相切/.test(compact)
    || /(?:直线)?PA切⊙O于A/.test(compact);
  const hasTangentPointA = /A(?:是|为)切点/.test(compact)
    || /切点(?:是|为)A/.test(compact)
    || /切于A/.test(compact)
    || /于A/.test(compact);
  const hasRadiusOA = hasRadiusSegment(compact, "OA") || hasCircle;
  const hasGoal = /OA⊥PA|PA⊥OA/.test(compact);

  return hasCircle && hasTangent && hasTangentPointA && hasRadiusOA && hasGoal && hasProofIntent(compact);
}

function buildTangentRadiusPerpendicularTemplate(questionText, source = {}) {
  const text = getTemplateText(questionText, source);

  if (!hasTangentRadiusPerpendicularSignals(text)) {
    return null;
  }

  const radius = 1.55;
  const points = {
    O: { x: 0, y: 0, label: "O" },
    A: { x: radius, y: 0, label: "A" },
    P: { x: radius, y: 1.85, label: "P" },
  };
  const objects = [
    {
      kind: "circle",
      id: "circle_O",
      label: "⊙O",
      center: "O",
      radius,
      role: "original",
      style: "solid",
    },
    makeSegment("segment_OA", "OA", "O", "A", "solid", "highlight"),
    makeSegment("segment_PA", "PA", "P", "A", "solid", "original"),
    {
      kind: "rightAngle",
      id: "right_angle_OAP",
      label: "∠OAP",
      points: ["O", "A", "P"],
      role: "highlight",
    },
  ];

  return buildCircleBaseTemplate({
    templateId: "tangent_radius_perpendicular_v1",
    title: "切线与半径示意图",
    description: "本图保留圆 O、圆心 O、切点 A、圆外点 P、半径 OA、切线 PA 和 A 处直角标记。",
    points,
    objects,
    highlightObjects: ["segment_OA", "segment_PA", "right_angle_OAP"],
    notes: [
      "仅用于 PA 是 ⊙O 的切线、A 为切点、求证 OA⊥PA 的稳定结构。",
      "使用初中圆的基础性质：圆的切线垂直于过切点的半径。",
    ],
  });
}

function mergeTemplateSpecs(intersectionSpec, areaSpec) {
  if (!intersectionSpec || !areaSpec) {
    return null;
  }

  const areaView = {
    ...areaSpec.views[0],
    id: "q2",
    title: "第 2 问：面积关系",
  };

  return {
    type: "function_graph",
    ...baseTemplateMeta("complex_function_template_v1", "function"),
    confidence: "high",
    title: "复杂函数压轴分问图示",
    description: "第 1 问展示函数交点，第 2 问展示面积关系，第 3 问暂不自动重绘完整图。",
    coordinateSystem: {
      xMin: -8,
      xMax: 8,
      yMin: -20,
      yMax: 20,
      xStep: 2,
      yStep: 4,
      showGrid: true,
      showAxes: true,
      showTicks: true,
      showAxisNumbers: true,
    },
    curves: intersectionSpec.curves,
    functions: intersectionSpec.functions,
    points: {
      ...intersectionSpec.points,
      ...areaSpec.points,
    },
    auxiliaryLines: areaSpec.auxiliaryLines,
    objects: [],
    views: [
      intersectionSpec.views[0],
      areaView,
      {
        id: "q3",
        type: "notice",
        title: "第 3 问：图示状态",
        description: "第 3 问涉及中心对称和参数判别，本阶段暂不自动重绘完整图，请以文字解析和原题图为准。",
        showObjects: {
          curves: [],
          points: [],
          auxiliaryLines: [],
        },
      },
    ],
    steps: [],
    notes: [
      "第 1 问和第 2 问为可确定关系图示。",
      "第 3 问暂不绘制，避免误导。",
      "后续可扩展 templateType：" + FUTURE_TEMPLATE_TYPES.join("、") + "。",
    ],
  };
}

function buildGraphTemplateSpec(questionText, source = {}) {
  const intersectionSpec = buildFunctionIntersectionTemplate(questionText, source);
  const areaSpec = buildCoordinateAreaTemplate(questionText, source);

  if (intersectionSpec && areaSpec) {
    return mergeTemplateSpecs(intersectionSpec, areaSpec);
  }

  return intersectionSpec
    || buildQuadraticKeyPointsTemplate(questionText, source)
    || areaSpec
    || buildCoordinateDistanceTemplate(questionText, source)
    || buildCoordinateMidpointTemplate(questionText, source)
    || buildPointToLineDistanceTemplate(questionText, source)
    || buildTriangleAreaCoordinateTemplate(questionText, source)
    || buildParallelPerpendicularTemplate(questionText, source)
    || buildIsoscelesTriangleTemplate(questionText, source)
    || buildMidpointMidlineTemplate(questionText, source)
    || buildParallelAngleTemplate(questionText, source)
    || buildCongruentTriangleSssTemplate(questionText, source)
    || buildCongruentTriangleSasTemplate(questionText, source)
    || buildCongruentTriangleAsaTemplate(questionText, source)
    || buildCongruentTriangleAasTemplate(questionText, source)
    || buildCongruentTriangleHlTemplate(questionText, source)
    || buildSimilarTriangleAaTemplate(questionText, source)
    || buildSimilarTriangleSasTemplate(questionText, source)
    || buildSimilarTriangleSssTemplate(questionText, source)
    || buildAngleBisectorTemplate(questionText, source)
    || buildPerpendicularBisectorTemplate(questionText, source)
    || buildPythagoreanRightTriangleTemplate(questionText, source)
    || buildRadiusEqualTemplate(questionText, source)
    || buildDiameterRightAngleTemplate(questionText, source)
    || buildTangentRadiusPerpendicularTemplate(questionText, source)
    || null;
}

module.exports = {
  buildFunctionIntersectionTemplate,
  buildQuadraticKeyPointsTemplate,
  buildCoordinateAreaTemplate,
  parseCoordinatePoints,
  buildCoordinateDistanceTemplate,
  buildCoordinateMidpointTemplate,
  buildPointToLineDistanceTemplate,
  buildTriangleAreaCoordinateTemplate,
  buildParallelPerpendicularTemplate,
  buildIsoscelesTriangleTemplate,
  buildMidpointMidlineTemplate,
  buildParallelAngleTemplate,
  buildCongruentTriangleSssTemplate,
  buildCongruentTriangleSasTemplate,
  buildCongruentTriangleAsaTemplate,
  buildCongruentTriangleAasTemplate,
  buildCongruentTriangleHlTemplate,
  buildSimilarTriangleAaTemplate,
  buildSimilarTriangleSasTemplate,
  buildSimilarTriangleSssTemplate,
  buildAngleBisectorTemplate,
  buildPerpendicularBisectorTemplate,
  buildPythagoreanRightTriangleTemplate,
  buildRadiusEqualTemplate,
  buildDiameterRightAngleTemplate,
  buildTangentRadiusPerpendicularTemplate,
  buildGraphTemplateSpec,
};
