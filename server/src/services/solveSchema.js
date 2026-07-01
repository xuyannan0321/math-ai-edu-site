const { buildFunctionGraphFromText, buildFunctionGraphFromExpression, buildEquationGraphFromText, enrichFunctionGraphSpec } = require("./graphEngine");
const { buildGraphTemplateSpec } = require("./graphTemplates");
const REQUIRED_CONFIDENCE_VALUES = new Set(["low", "medium", "high"]);
const VISUALIZATION_TYPES = new Set([
  "equation_balance",
  "function_graph",
  "geometry",
  "dynamic_point",
  "number_line",
  "none",
]);
const GEOMETRY_OBJECT_KINDS = new Set([
  "point",
  "segment",
  "line",
  "ray",
  "circle",
  "arc",
  "angle",
  "rightAngle",
  "polygon",
  "auxiliaryLine",
  "label",
  "highlight",
]);
const VISUALIZATION_OBJECT_KINDS = new Set([
  ...GEOMETRY_OBJECT_KINDS,
  "function",
  "axis",
  "term",
  "marker",
]);
const GEOMETRY_ROLES = new Set(["original", "auxiliary", "highlight"]);
const GEOMETRY_KEYWORDS = /三角形|几何|圆|四点共圆|相似|全等|角平分线|垂直|平行|中点|动点|最值|轨迹|辅助线|切线|弦|垂足/;
const DANGEROUS_VISUALIZATION_PATTERN = /<\s*\/?\s*(script|svg|canvas|iframe|html|body|style)\b|javascript:/i;
const POINT_LABEL_DIRECTIONS = new Set([
  "top",
  "bottom",
  "left",
  "right",
  "top-right",
  "bottom-right",
  "top-left",
  "bottom-left",
]);

function asString(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim() || fallback;
}

function asStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasDangerousVisualizationCode(value) {
  if (typeof value === "string") {
    return DANGEROUS_VISUALIZATION_PATTERN.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(hasDangerousVisualizationCode);
  }

  if (isPlainObject(value)) {
    return Object.values(value).some(hasDangerousVisualizationCode);
  }

  return false;
}

function createNoneVisualizationSpec(description = "暂无可靠图示，可查看文字解析。") {
  return {
    type: "none",
    title: "图示讲解",
    description,
    confidence: "low",
    orientation: {
      baseline: "",
      baselineDirection: "left-to-right",
      above: [],
      below: [],
    },
    points: {},
    objects: [],
    views: [],
    steps: [],
  };
}

function hasMultiQuestionMarkers(text = "") {
  const compact = asString(text).replace(/\s+/g, "");
  return (/第[一1]问/.test(compact) && /第[二2]问/.test(compact))
    || /(?:（1）|\(1\)).{0,600}(?:（2）|\(2\))/.test(compact);
}

function getFunctionDefinitionCount(text = "") {
  const matches = asString(text).replace(/\s+/g, "").match(/(?:y|f\([xX]\))=/g);
  return matches ? matches.length : 0;
}

function isComplexFunctionProblem(questionText = "", source = {}) {
  const text = asString(questionText || source.problemText);
  const functions = Array.isArray(source.functions) ? source.functions : [];
  const questionSections = Array.isArray(source.questionSections) ? source.questionSections : [];
  const hasRealMultiQuestion = hasMultiQuestionMarkers(text);

  return hasRealMultiQuestion
    || /L\s*1|L\s*2|y\s*1|y\s*2|y\s*3|中心对称|双倍比例点|面积|平行于\s*x\s*轴/i.test(text)
    || getFunctionDefinitionCount(text) > 1
    || functions.length > 1
    || (questionSections.length >= 2 && hasRealMultiQuestion);
}

function isComplexFunctionComprehensiveProblem(questionText = "", source = {}) {
  const text = asString(questionText || source.problemText);
  const signals = [
    /双倍比例点/.test(text),
    /抛物线/.test(text),
    /y\s*1|y\s*2|y\s*3/i.test(text),
    /L\s*1|L\s*2/i.test(text),
    /中心对称/.test(text),
    /面积/.test(text),
    /点\s*P|P\s*[（(]/.test(text),
    /点\s*Q|Q\s*[（(]/.test(text),
    /点\s*M|M\s*[（(]/.test(text),
    hasMultiQuestionMarkers(text),
  ].filter(Boolean).length;

  return signals >= 3;
}

function getFunctionCurveCount(spec = {}) {
  const curves = Array.isArray(spec.curves) ? spec.curves.length : 0;
  const functions = Array.isArray(spec.functions) ? spec.functions.length : 0;
  return Math.max(curves, functions);
}

function getFunctionPointCount(spec = {}) {
  const pointMapCount = isPlainObject(spec.points) ? Object.keys(spec.points).length : 0;
  const objectPointCount = Array.isArray(spec.objects)
    ? spec.objects.filter((object) => object && object.kind === "point").length
    : 0;
  return Math.max(pointMapCount, objectPointCount);
}

function hasQuadraticFunctionData(spec = {}) {
  const items = []
    .concat(Array.isArray(spec.curves) ? spec.curves : [])
    .concat(Array.isArray(spec.functions) ? spec.functions : []);

  return items.some((item) => {
    const kind = asString(item.kind || item.type).toLowerCase();
    const expression = asString(item.expression || item.formula || item.equation);
    const coefficients = isPlainObject(item.coefficients) ? item.coefficients : {};

    return kind === "quadratic"
      || kind === "parabola"
      || expression.includes("^2")
      || expression.includes("²")
      || /x\s*\*\s*x/.test(expression)
      || (isFiniteNumber(coefficients.a) && Math.abs(Number(coefficients.a)) > 1e-9);
  });
}

function isComplexFunctionSpecComplete(spec = {}, questionText = "") {
  const text = asString(questionText);
  const curveCount = getFunctionCurveCount(spec);
  const pointCount = getFunctionPointCount(spec);

  if (curveCount <= 1) {
    return false;
  }

  if (/抛物线/.test(text) && !hasQuadraticFunctionData(spec)) {
    return false;
  }

  if (/L\s*1|L\s*2|y\s*1|y\s*2|y\s*3/i.test(text) && curveCount < 2) {
    return false;
  }

  if (/面积|双倍比例点|中心对称/.test(text) && pointCount < 3) {
    return false;
  }

  return true;
}

function isRenderableGraphTemplate(spec) {
  return Boolean(
    spec
    && spec.canRender === true
    && (spec.confidence === "high" || spec.confidence === "medium")
  );
}

function buildRenderableGraphTemplate(questionText = "", source = {}) {
  const templateSpec = buildGraphTemplateSpec(questionText, source);
  return isRenderableGraphTemplate(templateSpec) ? templateSpec : null;
}

function shouldUseTemplateBeforeGraphEngine(templateSpec) {
  return Boolean(
    templateSpec
    && templateSpec.templateId !== "quadratic_key_points_v1"
  );
}

const STABLE_TEMPLATE_OVERRIDE_IDS = new Set([
  "coordinate_distance_v1",
  "coordinate_midpoint_v1",
  "point_to_line_distance_v1",
  "triangle_area_coordinate_v1",
  "parallel_perpendicular_v1",
  "coordinate_area_v1",
  "function_intersection_v1",
  "isosceles_triangle_v1",
  "midpoint_midline_v1",
  "parallel_angle_v1",
  "parallelogram_opposite_sides_equal_v1",
  "parallelogram_opposite_angles_equal_v1",
  "parallelogram_diagonals_bisect_v1",
  "rectangle_diagonals_equal_v1",
  "rhombus_diagonals_perpendicular_v1",
  "trapezoid_midline_v1",
  "congruent_triangle_sss_v1",
  "congruent_triangle_sas_v1",
  "congruent_triangle_asa_v1",
  "congruent_triangle_aas_v1",
  "congruent_triangle_hl_v1",
  "similar_triangle_aa_v1",
  "similar_triangle_sas_v1",
  "similar_triangle_sss_v1",
  "angle_bisector_v1",
  "perpendicular_bisector_v1",
  "pythagorean_right_triangle_v1",
  "radius_equal_v1",
  "diameter_right_angle_v1",
  "tangent_radius_perpendicular_v1",
  "same_arc_equal_inscribed_angles_v1",
  "equal_arcs_equal_inscribed_angles_v1",
  "central_angle_double_inscribed_angle_v1",
  "right_angle_subtends_diameter_v1",
  "equal_chords_equal_arcs_v1",
  "equal_arcs_equal_chords_v1",
  "perpendicular_diameter_bisects_chord_v1",
  "diameter_bisects_chord_perpendicular_v1",
  "equal_chords_equal_distance_to_center_v1",
  "equal_distance_to_center_equal_chords_v1",
]);

function shouldStableTemplateOverrideSource(templateSpec) {
  return Boolean(
    isRenderableGraphTemplate(templateSpec)
    && STABLE_TEMPLATE_OVERRIDE_IDS.has(templateSpec.templateId)
  );
}

function normalizeSteps(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((step, index) => {
      if (typeof step === "string") {
        return {
          title: `步骤 ${index + 1}`,
          content: step.trim(),
        };
      }

      if (!isPlainObject(step)) {
        return null;
      }

      return {
        title: asString(step.title, `步骤 ${index + 1}`),
        content: asString(step.content || step.explanation || step.text),
        thought: asString(step.thought || step.idea || step.method),
        diagramViewId: asString(step.diagramViewId || step.viewId || step.view),
      };
    })
    .filter((step) => step && step.content);
}

function normalizeReasoningLines(rawLines) {
  const lines = Array.isArray(rawLines) ? rawLines : [];
  const validTypes = new Set(["because", "therefore", "normal", "calculation", "conclusion"]);
  return lines
    .filter(function(line) { return line && typeof line === "object" && validTypes.has(line.type) && line.text; })
    .map(function(line) { return { type: line.type, text: asString(line.text) }; });
}

function normalizeEquationBlocks(rawBlocks) {
  const blocks = Array.isArray(rawBlocks) ? rawBlocks : [];
  return blocks
    .filter(function(block) {
      if (!block || typeof block !== "object") return false;
      var lines = Array.isArray(block.lines) ? block.lines.filter(Boolean) : [];
      return lines.length > 0;
    })
    .map(function(block) {
      return {
        title: asString(block.title, ""),
        lines: (Array.isArray(block.lines) ? block.lines : []).filter(Boolean).map(function(l) { return asString(l); }),
      };
    });
}

function normalizeKnown(rawKnown) {
  if (Array.isArray(rawKnown)) return rawKnown.filter(Boolean).map(function(k) { return asString(k); });
  if (typeof rawKnown === "string") return rawKnown ? [rawKnown] : [];
  return [];
}

function normalizeConstruction(rawConstruction) {
  if (Array.isArray(rawConstruction)) return rawConstruction.filter(Boolean).map(function(k) { return asString(k); });
  if (typeof rawConstruction === "string") return rawConstruction ? [rawConstruction] : [];
  return [];
}

function normalizeKeyBasis(rawKeyBasis) {
  if (Array.isArray(rawKeyBasis)) return rawKeyBasis.filter(Boolean).map(function(k) { return asString(k); });
  if (typeof rawKeyBasis === "string") return rawKeyBasis ? [asString(rawKeyBasis)] : [];
  return [];
}

function normalizeQualityCheck(value) {
  const source = isPlainObject(value) ? value : {};
  const confidence = REQUIRED_CONFIDENCE_VALUES.has(source.confidence)
    ? source.confidence
    : "medium";

  return {
    checked: source.checked === undefined ? true : Boolean(source.checked),
    confidence,
    sourceVerificationPassed: Boolean(source.sourceVerificationPassed === true),
    issues: asStringArray(source.issues),
  };
}

function normalizeOrientation(value) {
  const source = isPlainObject(value) ? value : {};
  const direction = source.baselineDirection === "right-to-left" ? "right-to-left" : "left-to-right";

  return {
    baseline: asString(source.baseline),
    baselineDirection: direction,
    above: asStringArray(source.above),
    below: asStringArray(source.below),
  };
}

function normalizePoint(id, value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const x = toFiniteNumber(value.x);
  const y = toFiniteNumber(value.y);

  if (x === null || y === null) {
    return null;
  }

  const point = {
    id,
    x,
    y,
    label: asString(value.label, id),
  };

  const labelDirection = asString(value.labelDirection).toLowerCase();
  const labelOffset = toFiniteNumber(value.labelOffset);
  const dx = toFiniteNumber(value.dx);
  const dy = toFiniteNumber(value.dy);

  if (POINT_LABEL_DIRECTIONS.has(labelDirection)) {
    point.labelDirection = labelDirection;
  }

  if (labelOffset !== null) {
    point.labelOffset = labelOffset;
  }

  if (dx !== null) {
    point.dx = dx;
  }

  if (dy !== null) {
    point.dy = dy;
  }

  if (value.showLabel === false) {
    point.showLabel = false;
  }

  return point;
}

function collectPoints(source) {
  const points = {};

  if (isPlainObject(source.points)) {
    Object.entries(source.points).forEach(([id, value]) => {
      const pointId = asString(id);
      const point = normalizePoint(pointId, value);

      if (pointId && point) {
        points[pointId] = point;
      }
    });
  }

  if (Array.isArray(source.objects)) {
    source.objects.forEach((object) => {
      if (!isPlainObject(object) || asString(object.kind || object.type) !== "point") {
        return;
      }

      const pointId = asString(object.id || object.label);
      const point = normalizePoint(pointId, object);

      if (pointId && point) {
        points[pointId] = point;
      }
    });
  }

  return points;
}

function pointExists(points, id) {
  return Boolean(points[asString(id)]);
}

function getObjectEndpoints(object) {
  if (object.from && object.to) {
    return [asString(object.from), asString(object.to)];
  }

  if (Array.isArray(object.through) && object.through.length >= 2) {
    return [asString(object.through[0]), asString(object.through[1])];
  }

  return [];
}

function normalizeRole(kind, value) {
  if (GEOMETRY_ROLES.has(value)) {
    return value;
  }

  return kind === "auxiliaryLine" ? "auxiliary" : "original";
}

function normalizeVisualizationObject(object, points, index) {
  if (!isPlainObject(object)) {
    return { error: "图形对象格式不正确。" };
  }

  const kind = asString(object.kind || object.type);

  if (!VISUALIZATION_OBJECT_KINDS.has(kind)) {
    return { error: `不支持的图形对象类型：${kind || "未知"}。` };
  }

  if (kind === "point") {
    return null;
  }

  const id = asString(object.id || object.label || `${kind}-${index + 1}`);
  const role = normalizeRole(kind, asString(object.role));
  const base = {
    ...object,
    kind,
    id,
    label: asString(object.label || object.id || ""),
    role,
    style: role === "auxiliary" || kind === "auxiliaryLine"
      ? asString(object.style, "dashed")
      : asString(object.style, "solid"),
    usedIn: asStringArray(object.usedIn),
  };

  if (kind === "segment" || kind === "auxiliaryLine") {
    const [from, to] = getObjectEndpoints(base);
    if (!from || !to || !pointExists(points, from) || !pointExists(points, to)) {
      return { error: `线段 ${id} 引用了不存在的点。` };
    }

    return { ...base, from, to };
  }

  if (kind === "line" || kind === "ray") {
    const [from, to] = getObjectEndpoints(base);
    if (!from || !to || !pointExists(points, from) || !pointExists(points, to)) {
      return { error: `${kind === "ray" ? "射线" : "直线"} ${id} 引用了不存在的点。` };
    }

    return { ...base, from, to, through: [from, to] };
  }

  if (kind === "circle") {
    const center = asString(base.center);
    const radius = toFiniteNumber(base.radius);

    if (!center || !pointExists(points, center) || radius === null || radius <= 0) {
      return { error: `圆 ${id} 的圆心或半径不可靠。` };
    }

    return { ...base, center, radius };
  }

  if (kind === "arc") {
    const center = asString(base.center);
    const radius = toFiniteNumber(base.radius);
    const startAngle = toFiniteNumber(base.startAngle);
    const endAngle = toFiniteNumber(base.endAngle);

    if (!center || !pointExists(points, center) || radius === null || radius <= 0) {
      return { error: `弧 ${id} 的圆心或半径不可靠。` };
    }

    if (startAngle === null || endAngle === null) {
      return { error: `弧 ${id} 缺少可靠角度。` };
    }

    return { ...base, center, radius, startAngle, endAngle };
  }

  if (kind === "angle" || kind === "rightAngle") {
    const anglePoints = Array.isArray(base.points)
      ? base.points.map(asString).slice(0, 3)
      : [asString(base.from), asString(base.vertex), asString(base.to)];

    if (anglePoints.length < 3 || anglePoints.some((pointId) => !pointExists(points, pointId))) {
      return { error: `${kind === "rightAngle" ? "直角" : "角"} ${id} 引用了不存在的点。` };
    }

    return { ...base, points: anglePoints, vertex: anglePoints[1] };
  }

  if (kind === "polygon") {
    const polygonPoints = asStringArray(base.points);

    if (polygonPoints.length < 3 || polygonPoints.some((pointId) => !pointExists(points, pointId))) {
      return { error: `多边形 ${id} 引用了不存在的点。` };
    }

    return { ...base, points: polygonPoints };
  }

  if (kind === "label") {
    const at = asString(base.at || base.point);

    if (at && !pointExists(points, at)) {
      return { error: `标签 ${id} 引用了不存在的点。` };
    }

    return { ...base, at };
  }

  if (kind === "highlight") {
    return { ...base, targets: asStringArray(base.targets || base.highlightObjects) };
  }

  if (kind === "function") {
    const expression = asString(base.expression);

    if (!expression || !/^[+\-0-9.xX^*²=\s()]+$/.test(expression)) {
      return { error: `函数 ${id} 的表达式不安全或过于复杂。` };
    }

    return {
      ...base,
      expression,
      range: Array.isArray(base.range) ? base.range.map(Number).filter(Number.isFinite).slice(0, 2) : [-5, 5],
    };
  }

  return base;
}

function normalizeVisualizationStep(step, index, objectIds) {
  if (!isPlainObject(step)) {
    return null;
  }

  const highlightObjects = asStringArray(step.highlightObjects).filter((id) => objectIds.has(id));

  return {
    stepTitle: asString(step.stepTitle || step.title, `图示步骤 ${index + 1}`),
    highlightObjects,
    explanation: asString(step.explanation || step.content),
    action: asString(step.action, "highlight"),
  };
}

function normalizeCategorizedShowObjects(showObjects) {
  if (!showObjects || typeof showObjects !== "object" || Array.isArray(showObjects)) {
    return null;
  }

  return {
    curves: asStringArray(showObjects.curves),
    functions: asStringArray(showObjects.functions),
    points: asStringArray(showObjects.points),
    auxiliaryLines: asStringArray(showObjects.auxiliaryLines),
    objects: asStringArray(showObjects.objects),
  };
}

function normalizeVisualizationView(view, index, objectIds) {
  if (!isPlainObject(view)) {
    return null;
  }

  let showObjects;

  if (isPlainObject(view.showObjects)) {
    showObjects = normalizeCategorizedShowObjects(view.showObjects);
  } else {
    showObjects = asStringArray(view.showObjects).filter((id) => objectIds.has(id));
  }

  const highlightObjects = asStringArray(view.highlightObjects);

  return {
    id: asString(view.id, `view-${index + 1}`),
    title: asString(view.title, index === 0 ? "原题图" : `图示 ${index + 1}`),
    showObjects,
    highlightObjects,
  };
}

function normalizeGeometrySpec(source, confidence, outputType = "geometry") {
  const points = collectPoints(source);

  if (confidence === "low") {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  if (!Object.keys(points).length) {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  const objects = [];
  const sourceObjects = Array.isArray(source.objects) ? source.objects : [];

  for (let index = 0; index < sourceObjects.length; index += 1) {
    const normalized = normalizeVisualizationObject(sourceObjects[index], points, index);

    if (normalized?.error) {
      return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
    }

    if (normalized) {
      objects.push(normalized);
    }
  }

  if (!objects.length) {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  const objectIds = new Set(objects.map((object) => object.id));
  const views = Array.isArray(source.views)
    ? source.views
        .map((view, index) => normalizeVisualizationView(view, index, objectIds))
        .filter(Boolean)
    : [];
  const safeViews = views.length
    ? views
    : [
        {
          id: "original",
          title: "原题图",
          showObjects: objects
            .filter((object) => object.role !== "auxiliary")
            .map((object) => object.id),
          highlightObjects: [],
        },
      ];

  if (safeViews.some((view) => !view.showObjects.length)) {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  const steps = Array.isArray(source.steps)
    ? source.steps
        .map((step, index) => normalizeVisualizationStep(step, index, objectIds))
        .filter(Boolean)
    : [];

  return {
    type: outputType,
    title: asString(source.title, "图示讲解"),
    description: asString(source.description, "根据题目条件绘制的几何示意图。"),
    confidence,
    orientation: normalizeOrientation(source.orientation),
    points,
    objects,
    views: safeViews,
    steps,
  };
}

function normalizeNonGeometrySpec(source, type, confidence, questionText) {
  if (type === "equation_balance") {
    return normalizeEquationBalanceSpec(source, confidence);
  }

  var objects = Array.isArray(source.objects)
    ? source.objects
        .map(function(object, index) { return normalizeVisualizationObject(object, {}, index); })
        .filter(function(object) { return object && !object.error; })
    : [];
  var steps = Array.isArray(source.steps)
    ? source.steps
        .map(function(step, index) { return normalizeVisualizationStep(step, index, new Set(objects.map(function(o) { return o.id; }))); })
        .filter(Boolean)
    : [];

  // Handle function_graph: preserve functions, auxiliaryLines, points
  // Handle function_graph: ALWAYS enrich via graphEngine after assembly
  if (type === "function_graph") {
    // Assemble normalized spec first
    var normalizedSpec = {
      type: type,
      title: asString(source.title, "函数图像"),
      description: asString(source.description),
      confidence: confidence,
      orientation: normalizeOrientation(source.orientation),
      equation: asString(source.equation || ""),
      coordinateSystem: source.coordinateSystem || null,
      curves: Array.isArray(source.curves) ? source.curves : [],
      functions: Array.isArray(source.functions) ? source.functions.map(function(f) { return { id: asString(f.id), label: asString(f.label), expression: asString(f.expression), range: Array.isArray(f.range) ? f.range.map(Number).filter(Number.isFinite).slice(0, 2) : [-5, 5], role: asString(f.role, "original") }; }) : [],
      points: collectPoints(source),
      auxiliaryLines: Array.isArray(source.auxiliaryLines) ? source.auxiliaryLines.map(function(l) { return { id: asString(l.id), kind: asString(l.kind || l.type, "line"), label: asString(l.label), from: l.from || {}, to: l.to || {}, style: asString(l.style, "dashed"), role: "auxiliary" }; }) : [],
      objects: objects,
      views: Array.isArray(source.views) ? source.views.map(function(v, i) { var allIds = new Set(objects.map(function(o) { return o.id; })); Array.isArray(source.functions) && source.functions.forEach(function(f) { if (f.id) allIds.add(f.id); }); if (source.points) Object.keys(source.points).forEach(function(k) { allIds.add(k); }); Array.isArray(source.auxiliaryLines) && source.auxiliaryLines.forEach(function(l) { if (l.id) allIds.add(l.id); }); return normalizeVisualizationView(v, i, allIds); }).filter(Boolean) : [],
      steps: steps,
    };

    const templateSpec = buildRenderableGraphTemplate(questionText, { ...source, ...normalizedSpec });
    if (shouldUseTemplateBeforeGraphEngine(templateSpec)) {
      return templateSpec;
    }

    if (isComplexFunctionComprehensiveProblem(questionText, source)) {
      return createNoneVisualizationSpec("本题为复杂函数综合题，当前暂不自动重绘完整图，避免误导。请以原题图和文字解析为准。");
    }

    if (isComplexFunctionProblem(questionText, source)) {
      if (!isComplexFunctionSpecComplete(normalizedSpec, questionText)) {
        return createNoneVisualizationSpec("复杂多问题图示数据不足，暂不自动重绘完整图。");
      }

      return {
        ...normalizedSpec,
        description: normalizedSpec.description || "局部示意图：仅展示部分关键关系，不代表整题完整图像。",
        confidence: normalizedSpec.confidence === "high" ? "medium" : normalizedSpec.confidence,
      };
    }

    // Simple function problems can still be enriched deterministically by GraphEngine.
    return enrichFunctionGraphSpec(normalizedSpec, questionText);
  }

  if (type !== "number_line" && !objects.length) {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  return {
    type,
    title: asString(source.title, "图示讲解"),
    description: asString(source.description),
    confidence,
    orientation: normalizeOrientation(source.orientation),
    points: {},
    objects,
    views: [],
    steps,
  };
}


function normalizeEquationBalanceSpec(source, confidence) {
  var equation = asString(source.equation || "");
  var leftTerms = Array.isArray(source.leftTerms)
    ? source.leftTerms.map(function(t) { return asString(t); }).filter(Boolean)
    : [];
  var rightTerms = Array.isArray(source.rightTerms)
    ? source.rightTerms.map(function(t) { return asString(t); }).filter(Boolean)
    : [];

  // Fallback: split from equation string if terms are missing
  if ((!leftTerms.length || !rightTerms.length) && equation && equation.includes("=")) {
    var eqParts = equation.split("=");
    if (eqParts.length >= 2) {
      var leftStr = eqParts[0].replace(/\s+/g, "");
      var rightStr = eqParts[eqParts.length - 1].replace(/\s+/g, "");
      if (!leftTerms.length) leftTerms = leftStr.match(/[+\-]?[^+\-]+/g) || [leftStr];
      if (!rightTerms.length) rightTerms = rightStr.match(/[+\-]?[^+\-]+/g) || [rightStr];
    }
  }

  // Fallback: from objects with side
  if (!leftTerms.length || !rightTerms.length) {
    var objs = Array.isArray(source.objects) ? source.objects : [];
    if (!leftTerms.length) {
      leftTerms = objs.filter(function(o) { return o && o.side !== "right"; }).map(function(o) { return asString(o.label || o.id || ""); }).filter(Boolean);
    }
    if (!rightTerms.length) {
      rightTerms = objs.filter(function(o) { return o && o.side === "right"; }).map(function(o) { return asString(o.label || o.id || ""); }).filter(Boolean);
    }
  }

  // If equation is still empty, derive from leftTerms + rightTerms
  if (!equation && (leftTerms.length || rightTerms.length)) {
    equation = leftTerms.join("") + "=" + rightTerms.join("");
  }

  var rawSteps = Array.isArray(source.steps) ? source.steps : [];

  if (!leftTerms.length && !rightTerms.length) {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  var normalizedSteps = rawSteps.map(function(s, idx) {
    return {
      label: asString(s.label, "步骤 " + (idx + 1)),
      leftTerms: Array.isArray(s.leftTerms) ? s.leftTerms.map(asString).filter(Boolean) : [],
      rightTerms: Array.isArray(s.rightTerms) ? s.rightTerms.map(asString).filter(Boolean) : [],
    };
  });

  return {
    type: "equation_balance",
    title: asString(source.title, "方程平衡示意"),
    description: asString(source.description, "根据等式两边同加同减生成的平衡示意。"),
    confidence,
    equation,
    leftTerms,
    rightTerms,
    steps: normalizedSteps,
    points: {},
    objects: [],
    views: [],
  };
}



function createEquationAsFunctionGraphFallback(text, finalAnswer) {
  // Use deterministic graphEngine first
  var graph = buildEquationGraphFromText(text);
  if (graph && graph.curves && graph.curves.length) {
    return graph;
  }
  var normalized = asString(text).replaceAll("−", "-").replace(/\s+/g, "");
  // Match: ax + b = c  or  ax = c
  var eqMatch = normalized.match(/([\-]?\d*\.?\d*)x\s*([+\-]\s*\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/i)
    || normalized.match(/([\-]?\d*\.?\d*)x\s*=\s*(\d+(?:\.\d+)?)/i);
  if (!eqMatch) return null;

  var hasConstant = eqMatch[3] !== undefined;
  var coeffRaw = eqMatch[1] || "";
  var coeff, constant, rightVal;
  if (hasConstant) {
    if (coeffRaw === "" || coeffRaw === "+") coeff = 1; else if (coeffRaw === "-") coeff = -1; else coeff = Number(coeffRaw);
    constant = Number(eqMatch[2].replace(/\s+/g, ""));
    rightVal = Number(eqMatch[3]);
    if (!isFinite(coeff) || !isFinite(constant) || !isFinite(rightVal)) return null;
  } else {
    if (coeffRaw === "" || coeffRaw === "+") coeff = 1; else if (coeffRaw === "-") coeff = -1; else coeff = Number(coeffRaw);
    constant = 0;
    rightVal = Number(eqMatch[2]);
    if (!isFinite(coeff) || !isFinite(rightVal)) return null;
  }

  var xSolution = (rightVal - constant) / coeff;
  // Build left function expression: y = coeff*x + constant
  var leftExpr = "y=" + (coeff === 1 ? "x" : coeff === -1 ? "-x" : coeff + "x") + (constant >= 0 ? "+" + constant : String(constant));
  var rightExpr = "y=" + rightVal;

  // Compute visible range around intersection
  var padX = Math.max(2, Math.abs(xSolution) * 0.5 + 2);
  var range = [xSolution - padX, xSolution + padX];

  return {
    type: "function_graph",
    title: "方程图像解法",
    description: "两条图像交点的横坐标就是方程的解。",
    functions: [
      { id: "left", label: leftExpr, expression: leftExpr, range: range, role: "original" },
      { id: "right", label: rightExpr, expression: rightExpr, range: range, role: "original" },
    ],
    points: {
      P: { x: xSolution, y: rightVal, label: "P(" + xSolution + "," + rightVal + ")" },
    },
    auxiliaryLines: [
      { id: "x-sol", kind: "segment", label: "x=" + xSolution, from: { x: xSolution, y: 0 }, to: { x: xSolution, y: rightVal }, style: "dashed" },
    ],
    confidence: "high",
    orientation: normalizeOrientation(null),
  };
}

function createEquationBalanceFallback(text) {
  var normalized = asString(text)
    .replaceAll("−", "-")
    .replace(/\s+/g, "");
  // Support: 2x+3=11, 3x-5=10, x/2+1=3, -x+5=0, 2x=10
  var eqMatch = normalized.match(/([\-]?\d*\.?\d*)x\s*([+\-]\s*\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/i)   // ax + b = c  (with explicit constant)
    || normalized.match(/([\-]?\d*\.?\d*)x\s*=\s*(\d+(?:\.\d+)?)/i);                    // ax = c   (no constant)

  if (!eqMatch) {
    return null;
  }

  var hasConstant = eqMatch[3] !== undefined;  // true when 3 capture groups (ax+b=c)
  var coeffRaw = eqMatch[1] || "";
  var coeff, constant, rightVal;

  if (hasConstant) {
    // ax + b = c
    if (coeffRaw === "" || coeffRaw === "+") coeff = 1;
    else if (coeffRaw === "-") coeff = -1;
    else coeff = Number(coeffRaw);
    constant = Number(eqMatch[2].replace(/\s+/g, ""));
    rightVal = Number(eqMatch[3]);
    if (!isFinite(coeff) || !isFinite(constant) || !isFinite(rightVal)) return null;
  } else {
    // ax = c
    if (coeffRaw === "" || coeffRaw === "+") coeff = 1;
    else if (coeffRaw === "-") coeff = -1;
    else coeff = Number(coeffRaw);
    constant = 0;
    rightVal = Number(eqMatch[2]);
    if (!isFinite(coeff) || !isFinite(rightVal)) return null;
  }

  var absCoeff = Math.abs(coeff);
  var coeffLabel = coeff === 1 ? "x" : coeff === -1 ? "-x" : (coeff + "x");
  var constLabel = constant === 0 ? "" : (constant > 0 ? ("+" + constant) : String(constant));

  var leftTerms = [coeffLabel];
  if (constLabel) leftTerms.push(constLabel);
  var rightTerms = [String(rightVal)];

  // Build steps: subtract constant, then divide by coefficient
  var steps = [];
  if (constant !== 0) {
    var newRight = rightVal - constant;
    steps.push({
      label: "等式两边同时" + (constant > 0 ? "减去" + constant : "加上" + (-constant)),
      leftTerms: [coeffLabel],
      rightTerms: [String(newRight)],
    });
  }

  if (absCoeff !== 1) {
    var finalRight = (rightVal - constant) / absCoeff;
    var sign = coeff < 0 ? (-rightVal + constant) / coeff : (rightVal - constant) / absCoeff;
    steps.push({
      label: "等式两边同时除以" + absCoeff,
      leftTerms: [coeff < 0 ? "-x" : "x"],
      rightTerms: [String(finalRight)],
    });
  }

  return {
    type: "equation_balance",
    title: "方程平衡示意",
    description: "根据题目中的一元一次方程生成的基础图示，用来说明等式两边保持平衡。",
    equation: normalized,
    leftTerms: leftTerms,
    rightTerms: rightTerms,
    steps: steps,
    confidence: "high",
    orientation: normalizeOrientation(null),
    points: {},
    objects: [],
    views: [],
  };
}



// --- Balanced-brace LaTeX parser helpers (no eval) ---

// Collapse double-backslashes (e.g. "\\\\frac" → "\\frac", "\\\\\\\\" → "\\\\")
// This repairs LaTeX commands that got string-escaped in transit.
function normalizeBackslashes(text) {
  if (typeof text !== "string") return "";
  var s = text.replace(/\\\\/g, "\x00");
  s = s.replace(/\x00([a-zA-Z]+)/g, "\\$1");
  s = s.replace(/\x00/g, "\\");
  return s;
}

// Read balanced brace content starting at openIndex.
// Returns { content: string, end: number } where end is the closing brace index.
// Returns null if braces are unbalanced.
function readBraceContent(text, openIndex) {
  if (text[openIndex] !== "{") return null;
  var depth = 0;
  var start = openIndex + 1;
  for (var i = openIndex; i < text.length; i++) {
    if (text[i] === "{" && (i === openIndex || text[i - 1] !== "\\")) depth++;
    else if (text[i] === "}" && text[i - 1] !== "\\") {
      depth--;
      if (depth === 0) return { content: text.slice(start, i), end: i };
    }
  }
  return null;
}

// Parse a LaTeX numeric expression: 3, -3, \sqrt{3}, 2\sqrt{3}, \frac{1}{2}, \frac{\sqrt{3}}{3}
// Returns the numeric value or NaN. No eval/Function used.
function parseLatexNumericExpression(text) {
  if (typeof text !== "string") return NaN;
  var s = text.trim();
  if (s === "") return NaN;

  var sign = 1;
  if (s[0] === "-") { sign = -1; s = s.slice(1).trim(); }
  else if (s[0] === "+") { s = s.slice(1).trim(); }

  if (s.startsWith("\\frac")) {
    var numBrace = readBraceContent(s, 5);
    if (!numBrace) {
      var m = s.match(/^\\frac(\d)(\d)/);
      if (m) return sign * Number(m[1]) / Number(m[2]);
      return NaN;
    }
    var denomStart = numBrace.end + 2;
    if (denomStart >= s.length || s[denomStart - 1] !== "{") return NaN;
    var denomBrace = readBraceContent(s, denomStart - 1);
    if (!denomBrace) return NaN;
    var num = parseLatexNumericExpression(numBrace.content);
    var denom = parseLatexNumericExpression(denomBrace.content);
    if (!Number.isFinite(num) || !Number.isFinite(denom) || denom === 0) return NaN;
    return sign * num / denom;
  }

  if (s.startsWith("\\sqrt")) {
    var brace = readBraceContent(s, 5);
    if (!brace) return NaN;
    var inner = parseLatexNumericExpression(brace.content);
    if (!Number.isFinite(inner) || inner < 0) return NaN;
    return sign * Math.sqrt(inner);
  }

  if (/\d/.test(s[0])) {
    var coeffMatch = s.match(/^(\d+(?:\.\d+)?)(.*)/);
    if (coeffMatch) {
      var coeff = Number(coeffMatch[1]);
      var rest = coeffMatch[2].trim();
      if (rest === "") return sign * coeff;
      var restVal = parseLatexNumericExpression(rest);
      if (!Number.isFinite(restVal)) return NaN;
      return sign * coeff * restVal;
    }
  }

  // Handle √ (U+221A) - square root without backslash, e.g. √3, √(3)
  if (s[0] === "√" || s[0] === "u{221A}") {
    var rest = s.slice(1).trim();
    var inner = parseLatexNumericExpression(rest);
    if (!Number.isFinite(inner) || inner < 0) return NaN;
    return sign * Math.sqrt(inner);
  }

  // Handle parenthesized expression: (a/b) or (expr)
  if (s[0] === "(") {
    var parenDepth = 0;
    var closeIdx = -1;
    for (var pi = 0; pi < s.length; pi++) {
      if (s[pi] === "(") parenDepth++;
      else if (s[pi] === ")") { parenDepth--; if (parenDepth === 0) { closeIdx = pi; break; } }
    }
    if (closeIdx > 0 && closeIdx < s.length - 1) {
      // Expression continues after closing paren, e.g. (√3/3)x
      var parenContent = s.slice(1, closeIdx);
      var afterParen = s.slice(closeIdx + 1);
      var parenVal = parseLatexNumericExpression(parenContent);
      if (!Number.isFinite(parenVal)) return NaN;
      if (afterParen.trim() === "") return sign * parenVal;
      // Has trailing content like x or x^2 - try to parse it
      var afterVal = parseLatexNumericExpression(afterParen);
      if (Number.isFinite(afterVal)) return sign * parenVal * afterVal;
      return NaN;
    }
    if (closeIdx === s.length - 1) {
      // Entire string is in parens: (expr) - try division inside
      var innerExpr = s.slice(1, closeIdx);
      // If contains / outside nested parens, treat as division
      var hasDivision = false;
      var divDepth = 0;
      for (var di = 0; di < innerExpr.length; di++) {
        if (innerExpr[di] === "(") divDepth++;
        else if (innerExpr[di] === ")") divDepth--;
        else if (innerExpr[di] === "/" && divDepth === 0) { hasDivision = true; break; }
      }
      if (hasDivision) {
        var slashIdx = -1;
        divDepth = 0;
        for (var si = 0; si < innerExpr.length; si++) {
          if (innerExpr[si] === "(") divDepth++;
          else if (innerExpr[si] === ")") divDepth--;
          else if (innerExpr[si] === "/" && divDepth === 0) { slashIdx = si; break; }
        }
        if (slashIdx > 0) {
          var leftPart = innerExpr.slice(0, slashIdx);
          var rightPart = innerExpr.slice(slashIdx + 1);
          var lv = parseLatexNumericExpression(leftPart);
          var rv = parseLatexNumericExpression(rightPart);
          if (Number.isFinite(lv) && Number.isFinite(rv) && rv !== 0) return sign * lv / rv;
        }
      }
      return sign * parseLatexNumericExpression(innerExpr);
    }
  }

  var num = Number(s);
  if (Number.isFinite(num)) return sign * num;

  return NaN;
}

// Parse quadratic a, b, c from expression like "y=ax^2+bx+c"
// Returns { a, b, c } or null.
function parseQuadraticCoefficientsFromExpression(expression) {
  if (typeof expression !== "string") return null;
  var s = expression.trim();
  s = s.replace(/^y\s*=\s*/i, "").replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, "");
  s = normalizeBackslashes(s);

  var terms = [];
  var depth = 0;
  var current = "";
  for (var i = 0; i < s.length; i++) {
    var ch = s[i];
    if (ch === "{" && s[i - 1] !== "\\") depth++;
    else if (ch === "}" && s[i - 1] !== "\\") depth--;
    if ((ch === "+" || ch === "-") && depth === 0 && current.length > 0) {
      terms.push(current);
      current = ch === "-" ? "-" : "";
    } else if (depth === 0) {
      current += ch;
    } else {
      current += ch;
    }
  }
  if (current) terms.push(current);

  var a = 0, b = 0, c = 0;
  for (var t = 0; t < terms.length; t++) {
    var term = terms[t].replace(/\*/g, "").replace(/\\cdot/g, "").replace(/\s+/g, "");
    if (term === "" || term === "+" || term === "-") continue;
    var termSign = 1;
    if (term[0] === "-") { termSign = -1; term = term.slice(1); }
    else if (term[0] === "+") { term = term.slice(1); }
    if (term === "") continue;
    if (term.includes("^2")) {
      var coeffStr = term.replace(/\^2.*$/, "");
      if (coeffStr === "" || coeffStr === "x") a += termSign;
      else {
        coeffStr = coeffStr.replace(/x/g, "");
        if (coeffStr === "") { a += termSign; }
        else { var val = parseLatexNumericExpression(coeffStr); if (!Number.isFinite(val)) return null; a += termSign * val; }
      }
    } else if (term.includes("x")) {
      var coeffStr = term.replace(/x.*$/, "");
      if (coeffStr === "") b += termSign;
      else { var val = parseLatexNumericExpression(coeffStr); if (!Number.isFinite(val)) return null; b += termSign * val; }
    } else {
      var val = parseLatexNumericExpression(term);
      if (!Number.isFinite(val)) return null;
      c += termSign * val;
    }
  }
  return { a: a, b: b, c: c };
}

// --- End balanced-brace helpers ---

// Extract y=... or f(x)=... from problem text, supporting LaTeX
function extractFunctionExpressionFromText(text) {
  var s = asString(text).replaceAll("−", "-").replaceAll("²", "^2");
  // Match y = ...  or  f(x) = ... until end-of-line or Chinese punctuation
  var m = s.match(/(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+?)(?:\s*$|\s*[,，。；;]|\s*(?:与|x轴|y轴|交于|对称|顶点|其中|where|画出|图像|图象|求|的))/i)
       || s.match(/(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)/i);
  if (!m) return null;
  var expr = m[1].replace(/\s+/g, "");
  // Strip trailing non-math chars
  expr = expr.replace(/[^0-9xX)\}\^\-+*/\\.=√²\\\[\]{}()]+$/, "");
  if (!expr || expr.length < 2 || expr.length > 300) return null;
  return "y=" + expr;
}

// Deterministic quadratic analyzer - no npm deps
function buildQuadraticFunctionGraph(expression, extraPoints) {
  // Parse a, b, c from y = ax^2 + bx + c
  // Use numeric evaluation by sampling
  // Parse coefficients using balanced-brace LaTeX parser (no eval)
  var coeffs = parseQuadraticCoefficientsFromExpression(expression);
  if (!coeffs) return null;
  var a = coeffs.a, b = coeffs.b, c = coeffs.c;

  // Build a safe evaluator using the parsed coefficients
  function safeEval(x) { return a * x * x + b * x + c; }

  // Verify by evaluating at 3 points
  var y0 = safeEval(0);
  var y1 = safeEval(1);
  var y2 = safeEval(2);
  if (!isFinite(y0) || !isFinite(y1) || !isFinite(y2)) return null;


  var isQuadratic = Math.abs(a) > 1e-9;
  // If linear, return a simple spec
  if (!isQuadratic) {
    var slope = b || (y1 - y0);
    return {
      type: "function_graph",
      title: "一次函数图像",
      functions: [{ id: "f", label: expression, expression: expression, range: [-8, 8], role: "original" }],
      points: {},
      auxiliaryLines: [],
      objects: [],
      views: [],
      steps: [],
      confidence: "medium",
    };
  }

  // Quadratic: compute key features
  var h = -b / (2 * a);
  var k = safeEval(h);
  if (!isFinite(k)) return null;

  // y-intercept
  var yIntercept = c;

  // x-intercepts (solve ax^2+bx+c=0)
  var discriminant = b * b - 4 * a * c;
  var xIntercepts = [];
  if (discriminant >= -1e-9) {
    var d = Math.sqrt(Math.max(0, discriminant));
    xIntercepts.push((-b - d) / (2 * a), (-b + d) / (2 * a));
  }

  // Build points
  var points = {};
  xIntercepts.forEach(function(x, i) {
    var name = i === 0 ? "A" : "B";
    points[name] = { x: round4(x), y: 0, label: name + "(" + round4(x) + ",0)" };
  });
  points["C"] = { x: 0, y: round4(yIntercept), label: "C(0," + round4(yIntercept) + ")" };
  points["V"] = { x: round4(h), y: round4(k), label: "V(" + round4(h) + "," + round4(k) + ")" };
  // D: axis intersection with x-axis
  points["D"] = { x: round4(h), y: 0, label: "D(" + round4(h) + ",0)" };

  // Extra points from text
  if (extraPoints && typeof extraPoints === "object") {
    Object.keys(extraPoints).forEach(function(key) {
      var ep = extraPoints[key];
      if (ep && Number.isFinite(ep.x)) {
        var ey = safeEval(ep.x);
        if (isFinite(ey)) {
          points[key] = { x: ep.x, y: round4(ey), label: key + "(" + ep.x + "," + round4(ey) + ")" };
        }
      }
    });
  }

  // Range
  var allXs = Object.values(points).map(function(p) { return p.x; });
  var allYs = Object.values(points).map(function(p) { return p.y; });
  var minX = Math.min.apply(null, allXs.concat(-3));
  var maxX = Math.max.apply(null, allXs.concat(3));
  var minY = Math.min.apply(null, allYs.concat(k - 2));
  var maxY = Math.max.apply(null, allYs.concat(k + 2));
  var padX = Math.max(1, (maxX - minX) * 0.3);
  var padY = Math.max(1, (maxY - minY) * 0.3);
  var range = [Math.floor(minX - padX), Math.ceil(maxX + padX)];

  return {
    type: "function_graph",
    title: "二次函数图像",
    description: "自动分析：对称轴 x=" + round2(h) + "，顶点 V(" + round2(h) + "," + round2(k) + ")。",
    functions: [{ id: "parabola", label: "抛物线", expression: expression, range: range, role: "original" }],
    points: points,
    auxiliaryLines: [
      { id: "symmetry-axis", kind: "line", label: "对称轴 x=" + round2(h), from: { x: h, y: Math.min(-4, minY) }, to: { x: h, y: Math.max(4, maxY) }, style: "dashed" },
    ],
    objects: [],
    views: [{ id: "q1", title: "函数图像", showObjects: ["parabola"], highlightObjects: [] }],
    steps: [],
    confidence: "high",
    orientation: normalizeOrientation(null),
  };
}

function round4(v) { return Math.round(v * 10000) / 10000; }
function round2(v) { return Math.round(v * 100) / 100; }

function createFunctionGraphFallback(text) {
  // Use deterministic graphEngine first
  var graph = buildFunctionGraphFromText(text);
  if (graph && graph.curves && graph.curves.length && graph.curves[0].samples && graph.curves[0].samples.length > 1) {
    return graph;
  }
  // Extract y=expression or f(x)=expression, supporting LaTeX \\frac, \\sqrt
  var raw = asString(text).replaceAll("\u2212", "-").replaceAll("\u00B2", "^2");
  // First try extractFunctionExpressionFromText which handles LaTeX
  var funcExpr = extractFunctionExpressionFromText(raw);
  var expression = funcExpr || null;
  var match;

  if (!expression) {
    match = raw.match(/(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)/i);
    if (!match || !/[xX]/.test(match[1])) return null;
    expression = "y=" + match[1].replace(/\s+/g, "");
  }

  // Strip trailing non-math content
  expression = expression.replace(/[^\d\-+*.xX^\u00B2=\s\\/\(\)\[\]{}\w\u221A$]+$/, "");
  if (!expression || expression.length < 2 || expression.length > 400) return null;

  // Try deterministic quadratic analysis first
  var quadSpec = buildQuadraticFunctionGraph(expression, null);
  if (quadSpec && quadSpec.functions && quadSpec.functions.length) {
    return quadSpec;
  }

  // Fallback: basic function_graph with non-empty functions, enrich via graphEngine
  var minimalSpec = {
    type: "function_graph",
    title: "函数图像",
    description: "根据题干函数表达式生成的图像。",
    functions: [
      {
        id: "f",
        label: (expression || "").replace(/^y=/, ""),
        expression: expression,
        range: [-8, 8],
        role: "original",
      },
    ],
    points: {},
    auxiliaryLines: [],
    objects: [],
    views: [],
    steps: [],
    confidence: "medium",
    orientation: normalizeOrientation(null),
  };
  return enrichFunctionGraphSpec(minimalSpec, text);
}
function createSafeFallbackVisualization(fallback) {
  const questionText = fallback.questionText || "";
  const templateSpec = buildRenderableGraphTemplate(questionText, fallback);

  if (shouldUseTemplateBeforeGraphEngine(templateSpec)) {
    return templateSpec;
  }

  if (GEOMETRY_KEYWORDS.test(questionText) || /几何/.test(fallback.questionType || "")) {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  return createFunctionGraphFallback(questionText)
    || createEquationAsFunctionGraphFallback(questionText)
    || createEquationBalanceFallback(questionText)
    || createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
}

function normalizeVisualizationSpec(value, fallback = {}) {
  const source = isPlainObject(value) ? value : null;
  const candidateTexts = [
    fallback.questionText,
    fallback.rawQuestionText,
    fallback.originalQuestionText,
    fallback.problemText,
    source && source.problemText,
  ].map((item) => asString(item)).filter(Boolean);
  const uniqueCandidateTexts = [...new Set(candidateTexts)];
  const questionText = uniqueCandidateTexts[0] || "";

  for (const candidateText of uniqueCandidateTexts) {
    const stableTemplateSpec = buildRenderableGraphTemplate(candidateText, {
      ...(source || {}),
      ...fallback,
      questionText: candidateText,
    });

    if (shouldStableTemplateOverrideSource(stableTemplateSpec)) {
      return stableTemplateSpec;
    }
  }

  if (!source) {
    return createSafeFallbackVisualization(fallback);
  }

  if (hasDangerousVisualizationCode(source)) {
    return createNoneVisualizationSpec("图示数据包含不安全内容，已安全降级。");
  }

  const rawType = asString(source.type);
  const type = VISUALIZATION_TYPES.has(rawType) ? rawType : "none";
  const confidence = REQUIRED_CONFIDENCE_VALUES.has(source.confidence)
    ? source.confidence
    : "medium";

  // For y= or f(x)= problems, force function_graph even if AI says none
  var isFuncProblem = /y\s*=|f\s*\(\s*x\s*\)\s*=|一次函数|二次函数|抛物线|函数图像|画出函数/i.test(questionText);
  var noneTypeTemplateSpec = type === "none"
    ? buildRenderableGraphTemplate(questionText, { ...source, questionSections: fallback.questionSections })
    : null;
  if (shouldUseTemplateBeforeGraphEngine(noneTypeTemplateSpec)) {
    return noneTypeTemplateSpec;
  }

  if (
    type === "none"
    && isFuncProblem
    && !isComplexFunctionComprehensiveProblem(questionText, { ...source, questionSections: fallback.questionSections })
    && !isComplexFunctionProblem(questionText, { ...source, questionSections: fallback.questionSections })
  ) {
    var funcGraph = createFunctionGraphFallback(questionText);
    if (funcGraph) { return enrichFunctionGraphSpec(funcGraph, questionText); }
  }
  if (type === "none") {
    var fallbackSpec = createSafeFallbackVisualization(fallback);
    if (fallbackSpec && fallbackSpec.type !== "none") {
      return fallbackSpec;
    }
    return createNoneVisualizationSpec(asString(source.description, "暂无可靠图示，可查看文字解析。"));
  }

  if (type === "geometry" || type === "dynamic_point") {
    return normalizeGeometrySpec({ ...source, type }, confidence, type);
  }

  // If AI returns number_line but problem text is a linear equation, override with equation_balance
  if (type === "number_line") {
    var eqOverride = createEquationAsFunctionGraphFallback(questionText) || createEquationBalanceFallback(questionText);
    if (eqOverride) {
      return eqOverride;
    }
  }


  return normalizeNonGeometrySpec(source, type, confidence, questionText);
}


/* 题干中的小问分割标记 */
var SECTION_MARKERS = [
  /[（(](\d+)[)）]/g,   // (1)（1）
  /[①②③④⑤⑥⑦⑧⑨⑩]/g,   // ① ② ③
  /问题探究|问题拓展|问题[一二三四五六七八九十]/g,
  /拓展|延伸|探究|变式/g,
];

function splitProblemIntoSections(problemText) {
  if (!problemText) return [];
  var sections = [];
  var segments = [];
  var pos = 0;

  // 1. Try structured markers like (1),（1）,①,②
  var markerRegex = /[（(](\d+)[)）]|[①②③④⑤⑥⑦⑧⑨⑩]|问题探究|问题拓展|问题[一二三四五六七八九十]/g;
  var lastEnd = 0;
  var match;
  var markers = [];

  while ((match = markerRegex.exec(problemText)) !== null) {
    markers.push({
      index: match.index,
      text: match[0],
    });
  }

  if (markers.length >= 2) {
    // There are at least 2 markers, split by them
    for (var i = 0; i < markers.length; i++) {
      var start = markers[i].index;
      var end = (i + 1 < markers.length) ? markers[i + 1].index : problemText.length;
      var sectionText = problemText.substring(start, end).trim();
      if (sectionText) {
        sections.push({
          id: "q" + (i + 1),
          title: "第 " + (i + 1) + " 问",
          problem: sectionText,
        });
      }
    }
  }

  return sections;
}

function normalizeQuestionSections(rawSections, problemText, steps) {
  // If AI returned valid sections, normalize them
  if (Array.isArray(rawSections) && rawSections.length > 0) {
    return rawSections.map(function(s, idx) {
      return {
        id: s.id || ("q" + (idx + 1)),
        title: s.title || ("第 " + (idx + 1) + " 问"),
        problem: asString(s.problem || s.question || s.text || ""),
        known: normalizeKnown(s.known),
        construction: normalizeConstruction(s.construction),
        idea: asString(s.idea || s.thought || s.method || ""),
        keyBasis: normalizeKeyBasis(s.keyBasis || s.keyPoint || s.basis || ""),
        reasoningLines: normalizeReasoningLines(s.reasoningLines),
        equationBlocks: normalizeEquationBlocks(s.equationBlocks),
        steps: normalizeSteps(s.steps || s.subSteps || []),
        conclusion: asString(s.conclusion || s.result || s.answer || ""),
        diagramViewId: asString(s.diagramViewId || s.viewId || s.view || ""),
      };
    }).filter(function(s) { return s.problem || s.steps.length > 0 || s.conclusion || s.reasoningLines.length > 0; });
  }

  // Try to split problem text by markers
  var sections = splitProblemIntoSections(problemText);
  if (sections.length >= 2) {
    // Map steps to sections if we have enough steps
    var stepArray = normalizeSteps(steps);
    sections.forEach(function(s, idx) {
      if (stepArray[idx]) {
        var step = stepArray[idx];
        s.idea = s.idea || step.thought || step.idea || "";
        s.steps = [step];
        s.conclusion = s.conclusion || step.content || "";
      }
    });
    return sections;
  }

  // Fallback: use steps as sections
  var stepArray = normalizeSteps(steps);
  if (stepArray.length > 0) {
    return stepArray.map(function(step, idx) {
      return {
        id: "q" + (idx + 1),
        title: step.title || ("第 " + (idx + 1) + " 步"),
        problem: "",
        idea: step.thought || step.idea || step.method || "",
        keyBasis: "",
        steps: [step],
        conclusion: step.content || "",
        diagramViewId: step.diagramViewId || step.viewId || step.view || "",
      };
    });
  }

  return [];
}

function normalizeSolution(raw, fallback = {}) {
  const source = isPlainObject(raw) ? raw : {};
  const originalQuestionText = asString(fallback.questionText || "");
  const problemText = asString(source.problemText, originalQuestionText);
  const templateQuestionText = [
    originalQuestionText,
    problemText,
    source.analysis,
    source.finalAnswer,
  ].map(asString).filter(Boolean).join("\n");
  const steps = normalizeSteps(source.steps);
  const knowledgePoints = asStringArray(source.knowledgePoints);
  const commonMistakes = asStringArray(source.commonMistakes);
  const visualizationSource = source.visualizationSpec || source.diagramSpec;

  var questionSections = normalizeQuestionSections(
    source.questionSections,
    problemText,
    steps,
  );

  return {
    title: asString(source.title, problemText.slice(0, 32) || "数学解析"),
    problemText,
    gradeLevel: asString(source.gradeLevel, fallback.gradeLevel || "初中"),
    subject: asString(source.subject, fallback.subject || "数学"),
    topic: asString(source.topic, fallback.questionType || "综合"),
    knowledgePoints: knowledgePoints.length ? knowledgePoints : ["题意分析", "分步推理", "验算检查"],
    analysis: asString(source.analysis, "题目条件需要进一步整理，请结合原题核对。"),
    steps: steps.length
      ? steps
      : [
          {
            title: "整理条件",
            content: "题目条件暂未形成完整步骤，请检查题干是否完整后重新生成。",
          },
        ],
    questionSections: questionSections,
    finalAnswer: asString(source.finalAnswer, "条件不足，暂不能确定唯一答案。"),
    commonMistakes: commonMistakes.length ? commonMistakes : ["不要只抄最终答案，要核对每一步依据。"],
    verification: asString(source.verification, "请将答案代回原题条件进行检查。"),
    visualizationSpec: normalizeVisualizationSpec(visualizationSource, {
      questionText: templateQuestionText,
      rawQuestionText: originalQuestionText,
      originalQuestionText: originalQuestionText,
      problemText: problemText,
      questionType: fallback.questionType || source.topic,
      questionSections: questionSections,
    }),
    qualityCheck: normalizeQualityCheck(source.qualityCheck),
    // hiddenVerification is normalized but NOT returned to frontend
  };
}

function validateQuestionInput(body) {
  const questionText = asString(body.questionText);

  if (!questionText) {
    return { valid: false, message: "请输入需要解析的题目文字。" };
  }

  if (questionText.length > 5000) {
    return { valid: false, message: "题目文字不能超过 5000 字。" };
  }

  const libraryType = asString(body.libraryType, "original");

  if (!["original", "strategy"].includes(libraryType)) {
    return { valid: false, message: "保存位置只能是 original 或 strategy。" };
  }

  return {
    valid: true,
    data: {
      questionText,
      subject: asString(body.subject, "数学"),
      gradeLevel: asString(body.gradeLevel, "初中"),
      questionType: asString(body.questionType, "综合"),
      libraryType,
      preferredProvider: asString(body.preferredProvider, "auto"),
    },
  };
}

module.exports = {
  normalizeSolution,
  validateQuestionInput,
  normalizeVisualizationSpec,
  createEquationBalanceFallback,
  createFunctionGraphFallback,
};
