"use strict";

const {
  buildFunctionGraphFromText,
  buildCoordinateSystem,
} = require("./graphEngine");

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
    || null;
}

module.exports = {
  buildFunctionIntersectionTemplate,
  buildQuadraticKeyPointsTemplate,
  buildCoordinateAreaTemplate,
  buildGraphTemplateSpec,
};
