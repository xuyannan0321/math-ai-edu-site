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
    P1: { x: 2 / 3, y: 4 / 3, label: "P1(2/3,4/3)" },
    P2: { x: -8 / 3, y: -16 / 3, label: "P2(-8/3,-16/3)" },
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
      label: "P1 到 y=-2 的距离",
      from: "P1",
      to: { x: 2 / 3, y: -2 },
      style: "dashed",
      role: "auxiliary",
    },
    {
      id: "height_P2_to_y_negative_2",
      kind: "segment",
      label: "P2 到 y=-2 的距离",
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
    description: "本图展示面积方程中的底 QM、高以及两个候选三角形 PQM。P1、P2 对应 m 的两个不同取值情形，并不表示两个点同时属于同一个确定图形。",
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
  const foot = createPoint(footId, b.x, a.y);
  const points = pointMapFromList([a, b, foot]);
  const segmentId = `segment_${a.id}${b.id}`;
  const dx = Math.abs(round4(b.x - a.x));
  const dy = Math.abs(round4(b.y - a.y));

  const auxiliaryLines = [
    makeSegment(segmentId, `${a.id}${b.id}`, a.id, b.id, "solid", "original", { showLabel: true }),
    makeSegment(`segment_${a.id}H`, `Δx=${formatCoordinateValue(dx)}`, a.id, footId, "dashed", "auxiliary", { showLabel: true }),
    makeSegment(`segment_${b.id}H`, `Δy=${formatCoordinateValue(dy)}`, b.id, footId, "dashed", "auxiliary", { showLabel: true }),
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
  const midpoint = createPoint("M", (a.x + b.x) / 2, (a.y + b.y) / 2);
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
    foot = createPoint("H", point.x, y);
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
    foot = createPoint("H", x, point.y);
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
    const foot = createPoint("H", c.x, a.y);
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
    const foot = createPoint("H", a.x, c.y);
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
    {
      kind: "label",
      id: "label_equal_sides_left",
      text: "AB=AC",
      x: -1.15,
      y: 1.75,
      role: "highlight",
    },
    {
      kind: "label",
      id: "label_equal_sides_right",
      text: "AB=AC",
      x: 1.15,
      y: 1.75,
      role: "highlight",
    },
    {
      kind: "label",
      id: "label_midpoint",
      text: "BD=CD",
      x: 0,
      y: -0.38,
      role: "highlight",
    },
    {
      kind: "label",
      id: "label_perpendicular",
      text: "AD ⟂ BC",
      x: 0.66,
      y: 0.62,
      role: "highlight",
    },
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
        highlightObjects: ["segment_AD", "right_angle_AD_BC", "label_perpendicular"],
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
    {
      kind: "label",
      id: "label_midpoint_ab",
      text: "AM=MB",
      x: -1.55,
      y: 1.18,
      role: "highlight",
    },
    {
      kind: "label",
      id: "label_midpoint_ac",
      text: "AN=NC",
      x: 1.55,
      y: 1.18,
      role: "highlight",
    },
    {
      kind: "label",
      id: "label_midline_parallel",
      text: "MN ∥ BC",
      x: 0,
      y: 1.95,
      role: "highlight",
    },
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
        highlightObjects: ["segment_MN", "label_midline_parallel"],
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
    A: { x: -2.8, y: 2.2, label: "A" },
    E: { x: -0.6, y: 2.2, label: "E" },
    B: { x: 2.4, y: 2.2, label: "B" },
    C: { x: -2.4, y: 0, label: "C" },
    F: { x: 0.6, y: 0, label: "F" },
    D: { x: 2.8, y: 0, label: "D" },
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
    {
      kind: "label",
      id: "label_parallel",
      text: "AB ∥ CD",
      x: -2.15,
      y: 1.1,
      role: "highlight",
    },
    {
      kind: "label",
      id: "label_angle_aef",
      text: "∠AEF",
      x: -1.08,
      y: 1.67,
      role: "highlight",
    },
    {
      kind: "label",
      id: "label_angle_efd",
      text: "∠EFD",
      x: 1.18,
      y: 0.58,
      role: "highlight",
    },
    {
      kind: "label",
      id: "label_equal_angles",
      text: "∠AEF = ∠EFD",
      x: 0.18,
      y: 1.18,
      role: "highlight",
    },
  ];

  return {
    type: "geometry",
    ...baseTemplateMeta("parallel_angle_v1", "geometry"),
    confidence: "high",
    title: "平行线内错角示意图",
    description: "本图展示两直线平行时，内错角相等的关系。",
    points,
    objects,
    views: [
      {
        id: "main",
        title: "平行线内错角示意图",
        showObjects: objects.map((object) => object.id),
        highlightObjects: ["angle_AEF", "angle_EFD", "label_parallel", "label_equal_angles"],
      },
    ],
    steps: [],
    notes: [
      "仅用于 AB 平行 CD、直线 EF 分别交 AB 和 CD 于 E、F、求证 ∠AEF = ∠EFD 的稳定结构。",
      "使用初中平行线性质：两直线平行，内错角相等；不使用坐标、斜率、向量或高级方法。",
    ],
  };
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
  buildGraphTemplateSpec,
};
