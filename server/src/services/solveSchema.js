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

  return {
    id,
    x,
    y,
    label: asString(value.label, id),
  };
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

function normalizeVisualizationView(view, index, objectIds) {
  if (!isPlainObject(view)) {
    return null;
  }

  const showObjects = asStringArray(view.showObjects).filter((id) => objectIds.has(id));
  const highlightObjects = asStringArray(view.highlightObjects).filter((id) => objectIds.has(id));

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

function normalizeNonGeometrySpec(source, type, confidence) {
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
  if (type === "function_graph") {
    return {
      type,
      title: asString(source.title, "函数图像"),
      description: asString(source.description),
      confidence,
      orientation: normalizeOrientation(source.orientation),
      equation: asString(source.equation || ""),
      functions: Array.isArray(source.functions) ? source.functions.map(function(f) { return { id: asString(f.id), label: asString(f.label), expression: asString(f.expression), range: Array.isArray(f.range) ? f.range.map(Number).filter(Number.isFinite).slice(0, 2) : [-5, 5], role: asString(f.role, "original") }; }) : [],
      points: collectPoints(source),
      auxiliaryLines: Array.isArray(source.auxiliaryLines) ? source.auxiliaryLines.map(function(l) { return { id: asString(l.id), kind: asString(l.kind || l.type, "line"), label: asString(l.label), from: l.from || {}, to: l.to || {}, style: asString(l.style, "dashed"), role: "auxiliary" }; }) : [],
      objects,
      views: Array.isArray(source.views) ? source.views.map(function(v, i) { return normalizeVisualizationView(v, i, new Set(objects.map(function(o) { return o.id; }))); }).filter(Boolean) : [],
      steps,
    };
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
}


function normalizeEquationBalanceSpec(source, confidence) {
  var equation = asString(source.equation || "");
  var leftTerms = Array.isArray(source.leftTerms)
    ? source.leftTerms.map(function(t) { return asString(t); }).filter(Boolean)
    : [];
  var rightTerms = Array.isArray(source.rightTerms)
    ? source.rightTerms.map(function(t) { return asString(t); }).filter(Boolean)
    : [];

  if ((!leftTerms.length || !rightTerms.length) && equation && equation.includes("=")) {
    var eqParts = equation.split("=");
    if (eqParts.length >= 2) {
      var leftStr = eqParts[0].replace(/\s+/g, "");
      var rightStr = eqParts[eqParts.length - 1].replace(/\s+/g, "");
      if (!leftTerms.length) leftTerms = leftStr.match(/[+\-]?[^+\-]+/g) || [leftStr];
      if (!rightTerms.length) rightTerms = rightStr.match(/[+\-]?[^+\-]+/g) || [rightStr];
    }
  }

  if (!leftTerms.length || !rightTerms.length) {
    var objs = Array.isArray(source.objects) ? source.objects : [];
    if (!leftTerms.length) leftTerms = objs.filter(function(o) { return o && o.side !== "right"; }).map(function(o) { return asString(o.label || o.id || ""); }).filter(Boolean);
    if (!rightTerms.length) rightTerms = objs.filter(function(o) { return o && o.side === "right"; }).map(function(o) { return asString(o.label || o.id || ""); }).filter(Boolean);
  }

  if (!equation && (leftTerms.length || rightTerms.length)) {
    equation = leftTerms.join("") + "=" + rightTerms.join("");
  }

  var rawSteps = Array.isArray(source.steps) ? source.steps : [];
  if (!leftTerms.length && !rightTerms.length) {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  var steps = rawSteps.map(function(step) {
    if (!step || typeof step !== "object") return null;
    return {
      label: asString(step.label || step.stepTitle || step.title || ""),
      leftTerms: Array.isArray(step.leftTerms) ? step.leftTerms.map(function(t) { return asString(t); }).filter(Boolean) : [],
      rightTerms: Array.isArray(step.rightTerms) ? step.rightTerms.map(function(t) { return asString(t); }).filter(Boolean) : [],
    };
  }).filter(Boolean);

  return {
    type: "equation_balance",
    title: asString(source.title, "方程平衡示意"),
    description: asString(source.description, "等式两边保持平衡的图示说明。"),
    confidence: REQUIRED_CONFIDENCE_VALUES.has(confidence) ? confidence : "medium",
    equation,
    leftTerms,
    rightTerms,
    steps,
    orientation: normalizeOrientation(source.orientation),
    points: {},
    objects: [],
    views: [],
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

function createFunctionGraphFallback(text) {
  const match = asString(text)
    .replaceAll("−", "-")
    .replaceAll("²", "^2")
    .match(/(?:y|f\(x\))\s*=\s*([+\-0-9.xX^*²\s]+)/i);

  if (!match || !/[xX]/.test(match[1])) {
    return null;
  }

  const expression = match[1].replace(/\s+/g, "");

  if (!/^[+\-0-9.xX^*²]+$/.test(expression)) {
    return null;
  }

  return {
    type: "function_graph",
    title: "函数图像基础示意",
    description: "根据题目中可识别的函数表达式生成的安全基础图像；复杂表达式会自动跳过。",
    confidence: "medium",
    orientation: normalizeOrientation(null),
    points: {},
    objects: [
      {
        kind: "function",
        id: "f",
        expression,
        range: [-5, 5],
        role: "original",
      },
    ],
    views: [],
    steps: [],
  };
}

function createSafeFallbackVisualization(fallback) {
  const questionText = fallback.questionText || "";

  if (GEOMETRY_KEYWORDS.test(questionText) || /几何/.test(fallback.questionType || "")) {
    return createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
  }

  return createFunctionGraphFallback(questionText)
    || createEquationBalanceFallback(questionText)
    || createNoneVisualizationSpec("暂无可靠图示，可查看文字解析。");
}

function normalizeVisualizationSpec(value, fallback = {}) {
  const source = isPlainObject(value) ? value : null;

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
    var eqOverride = createEquationBalanceFallback(fallback.questionText || "");
    if (eqOverride) {
      return eqOverride;
    }
  }

  // If AI returns number_line but problem is a linear equation, override
  if (type === "number_line") {
    var eqOverride = createEquationBalanceFallback(fallback.questionText || "");
    if (eqOverride) {
      return eqOverride;
    }
  }

  return normalizeNonGeometrySpec(source, type, confidence);
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
  const problemText = asString(source.problemText, fallback.questionText || "");
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
      questionText: problemText || fallback.questionText,
      questionType: fallback.questionType || source.topic,
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