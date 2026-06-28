// graphEngine.js — Deterministic Graph Tool
// No eval/Function, no npm deps, no AI dependency.
// Supports: y=x^2-2x-3, y=2x+3, y=11, LaTeX \frac \sqrt, √, (√3/3), (√3)/3

"use strict";

// --- Core Math Utilities ---

function round4(v) { return Math.round(v * 10000) / 10000; }
function round2(v) { return Math.round(v * 100) / 100; }

// --- Balanced Brace Reader ---

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

// --- Expression Normalizer ---

function normalizeExpression(expression) {
  if (typeof expression !== "string") return "";
  var s = expression
    .replace(/^y\s*=\s*/i, "")
    .replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, "")
    .replace(/\s+/g, "")
    .replace(/\u00B2/g, "^2")
    .replace(/\u2212/g, "-");
  return s;
}

// --- Math Number Parser (LaTeX + √) ---

function parseMathNumber(text) {
  if (typeof text !== "string") return NaN;
  var s = text.trim();
  if (s === "") return NaN;

  var sign = 1;
  if (s[0] === "-") { sign = -1; s = s.slice(1).trim(); }
  else if (s[0] === "+") { s = s.slice(1).trim(); }

  // \frac{a}{b} with balanced braces
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
    var num = parseMathNumber(numBrace.content);
    var denom = parseMathNumber(denomBrace.content);
    if (!Number.isFinite(num) || !Number.isFinite(denom) || denom === 0) return NaN;
    return sign * num / denom;
  }

  // \sqrt{n} with balanced braces
  if (s.startsWith("\\sqrt")) {
    var brace = readBraceContent(s, 5);
    if (!brace) return NaN;
    var inner = parseMathNumber(brace.content);
    if (!Number.isFinite(inner) || inner < 0) return NaN;
    return sign * Math.sqrt(inner);
  }

  // √ symbol (U+221A)
  if (s[0] === "\u221A") {
    var rest = s.slice(1).trim();
    var inner = parseMathNumber(rest);
    if (!Number.isFinite(inner) || inner < 0) return NaN;
    return sign * Math.sqrt(inner);
  }

  // Parenthesized expression: (a/b) or (expr)
  if (s[0] === "(") {
    var parenDepth = 0;
    var closeIdx = -1;
    for (var pi = 0; pi < s.length; pi++) {
      if (s[pi] === "(") parenDepth++;
      else if (s[pi] === ")") { parenDepth--; if (parenDepth === 0) { closeIdx = pi; break; } }
    }
    if (closeIdx === s.length - 1) {
      var innerExpr = s.slice(1, closeIdx);
      // Check for division
      var divDepth = 0, slashIdx = -1;
      for (var di = 0; di < innerExpr.length; di++) {
        if (innerExpr[di] === "(") divDepth++;
        else if (innerExpr[di] === ")") divDepth--;
        else if (innerExpr[di] === "/" && divDepth === 0) { slashIdx = di; break; }
      }
      if (slashIdx > 0) {
        var left = parseMathNumber(innerExpr.slice(0, slashIdx));
        var right = parseMathNumber(innerExpr.slice(slashIdx + 1));
        if (Number.isFinite(left) && Number.isFinite(right) && right !== 0) return sign * left / right;
      }
      return sign * parseMathNumber(innerExpr);
    }
    if (closeIdx > 0 && closeIdx < s.length - 1) {
      var parenContent = s.slice(1, closeIdx);
      var afterParen = s.slice(closeIdx + 1);
      var parenVal = parseMathNumber(parenContent);
      if (!Number.isFinite(parenVal)) return NaN;
      if (afterParen.trim() === "") return sign * parenVal;
      var afterVal = parseMathNumber(afterParen);
      if (Number.isFinite(afterVal)) return sign * parenVal * afterVal;
      return NaN;
    }
  }

  // Coefficient followed by radical: e.g. "2\u221A3" -> 2 * sqrt(3)
  if (/\d/.test(s[0])) {
    var coeffMatch = s.match(/^(\d+(?:\.\d+)?)(.*)/);
    if (coeffMatch) {
      var coeff = Number(coeffMatch[1]);
      var rest = coeffMatch[2].trim();
      if (rest === "") return sign * coeff;
      var restVal = parseMathNumber(rest);
      if (!Number.isFinite(restVal)) return NaN;
      return sign * coeff * restVal;
    }
  }

  var num = Number(s);
  if (Number.isFinite(num)) return sign * num;
  return NaN;
}

// --- Term Splitter ---

function splitTerms(expression) {
  var s = expression;
  // Pre-process: convert √ to \sqrt{...} for consistency
  s = preprocessRadical(s);
  // Replace \frac{...}{...} and \sqrt{...} with numeric values
  s = safeReplaceLaTeX(s);
  // Replace (num/num) and (num)/num styles
  s = s.replace(/\(([\-]?[\d.]+)\/([\d.]+)\)/g, function(m, a, b) {
    var na = Number(a), nb = Number(b);
    return (Number.isFinite(na) && Number.isFinite(nb) && nb !== 0) ? String(na / nb) : m;
  });
  s = s.replace(/\(([\-]?[\d.]+)\)\/([\d.]+)/g, function(m, a, b) {
    var na = Number(a), nb = Number(b);
    return (Number.isFinite(na) && Number.isFinite(nb) && nb !== 0) ? String(na / nb) : m;
  });

  // Split by + or -
  var terms = [];
  var current = "";
  for (var i = 0; i < s.length; i++) {
    var ch = s[i];
    if ((ch === "+" || ch === "-") && current.length > 0) {
      terms.push(current);
      current = ch === "-" ? "-" : "";
    } else {
      current += ch;
    }
  }
  if (current) terms.push(current);
  return terms;
}

function preprocessRadical(text) {
  var result = "";
  var i = 0;
  while (i < text.length) {
    if (text[i] === "\u221A") {
      i++;
      if (i < text.length && text[i] === "(") {
        var depth = 1, start = i + 1; i++;
        while (i < text.length && depth > 0) {
          if (text[i] === "(") depth++;
          else if (text[i] === ")") depth--;
          i++;
        }
        result += "\\sqrt{" + text.slice(start, i - 1) + "}";
      } else if (i < text.length && /\d/.test(text[i])) {
        result += "\\sqrt{" + text[i] + "}";
        i++;
      }
    } else {
      result += text[i];
      i++;
    }
  }
  return result;
}

function safeReplaceLaTeX(text) {
  var result = "";
  var i = 0;
  while (i < text.length) {
    if (text.slice(i, i + 5) === "\\frac" && text[i + 5] === "{") {
      var numBr = readBraceContent(text, i + 5);
      if (!numBr) { result += text[i]; i++; continue; }
      var denIdx = numBr.end + 1;
      if (text[denIdx] !== "{") { result += text[i]; i++; continue; }
      var denBr = readBraceContent(text, denIdx);
      if (!denBr) { result += text[i]; i++; continue; }
      var numStr = safeReplaceLaTeX(numBr.content);
      var denStr = safeReplaceLaTeX(denBr.content);
      var na = Number(numStr), nb = Number(denStr);
      if (Number.isFinite(na) && Number.isFinite(nb) && nb !== 0) {
        result += String(na / nb);
      } else {
        result += text.slice(i, denBr.end + 1);
      }
      i = denBr.end + 1;
    } else if (text.slice(i, i + 5) === "\\sqrt" && text[i + 5] === "{") {
      var sqBr = readBraceContent(text, i + 5);
      if (!sqBr) { result += text[i]; i++; continue; }
      var inner = safeReplaceLaTeX(sqBr.content);
      var nv = Number(inner);
      if (Number.isFinite(nv) && nv >= 0) {
        result += String(Math.sqrt(nv));
      } else {
        result += text.slice(i, sqBr.end + 1);
      }
      i = sqBr.end + 1;
    } else {
      result += text[i];
      i++;
    }
  }
  return result;
}

// --- Polynomial ABC Parser ---

function parsePolynomialABC(expression) {
  var normalized = normalizeExpression(expression);
  if (!normalized) return null;
  var terms = splitTerms(normalized);
  if (!terms || !terms.length) return null;

  var a = 0, b = 0, c = 0;
  for (var ti = 0; ti < terms.length; ti++) {
    var term = terms[ti].replace(/\*/g, "").replace(/\\cdot/g, "").replace(/\s+/g, "");
    if (term === "" || term === "+" || term === "-") continue;

    var termSign = 1;
    if (term[0] === "-") { termSign = -1; term = term.slice(1); }
    else if (term[0] === "+") { term = term.slice(1); }
    if (term === "") continue;

    if (term.includes("^2")) {
      var coeffStr = term.replace(/\^2.*$/, "").replace(/x/g, "");
      if (coeffStr === "") a += termSign;
      else {
        var val = parseMathNumber(coeffStr);
        if (!Number.isFinite(val)) return null;
        a += termSign * val;
      }
    } else if (term.includes("x")) {
      var coeffStr = term.replace(/x.*$/, "").replace(/x/g, "");
      if (coeffStr === "") b += termSign;
      else {
        var val = parseMathNumber(coeffStr);
        if (!Number.isFinite(val)) return null;
        b += termSign * val;
      }
    } else {
      var val = parseMathNumber(term);
      if (!Number.isFinite(val)) return null;
      c += termSign * val;
    }
  }

  var kind = Math.abs(a) > 1e-9 ? "quadratic" : Math.abs(b) > 1e-9 ? "linear" : "constant";
  return { kind: kind, a: a, b: b, c: c };
}

// --- Polynomial Evaluator ---

function evaluatePolynomial(coefficients, x) {
  return coefficients.a * x * x + coefficients.b * x + coefficients.c;
}

// --- Sample Polynomial ---

function samplePolynomial(coefficients, range, sampleCount) {
  sampleCount = sampleCount || 200;
  var minX = range[0], maxX = range[1];
  var samples = [];
  for (var i = 0; i <= sampleCount; i++) {
    var x = minX + (maxX - minX) * i / sampleCount;
    var y = evaluatePolynomial(coefficients, x);
    if (Number.isFinite(y) && Math.abs(y) < 1e6) {
      samples.push({ x: round4(x), y: round4(y) });
    }
  }
  return samples;
}

// --- Build Coordinate System ---

function buildCoordinateSystem(points, samples, options) {
  options = options || {};
  var allXs = [], allYs = [];

  if (Array.isArray(points)) {
    points.forEach(function(p) {
      if (p && Number.isFinite(p.x)) allXs.push(p.x);
      if (p && Number.isFinite(p.y)) allYs.push(p.y);
    });
  }
  if (Array.isArray(samples)) {
    samples.forEach(function(s) {
      if (s && Number.isFinite(s.x)) allXs.push(s.x);
      if (s && Number.isFinite(s.y)) allYs.push(s.y);
    });
  }

  var minX = allXs.length ? Math.min.apply(null, allXs) : -5;
  var maxX = allXs.length ? Math.max.apply(null, allXs) : 5;
  var minY = allYs.length ? Math.min.apply(null, allYs) : -5;
  var maxY = allYs.length ? Math.max.apply(null, allYs) : 5;

  // Ensure reasonable range and padding
  if (maxX - minX < 1) { maxX = minX + 5; }
  if (maxY - minY < 1) { maxY = minY + 5; }

  var padX = Math.max(1, (maxX - minX) * 0.25);
  var padY = Math.max(1, (maxY - minY) * 0.25);

  var xMin = round4(minX - padX);
  var xMax = round4(maxX + padX);
  var yMin = round4(minY - padY);
  var yMax = round4(maxY + padY);

  // Compute step sizes (nice numbers)
  var xSpan = xMax - xMin;
  var ySpan = yMax - yMin;
  var xStep = niceStep(xSpan, 5);
  var yStep = niceStep(ySpan, 5);

  return {
    xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax,
    xStep: xStep, yStep: yStep,
    showGrid: options.showGrid !== false,
    showAxes: options.showAxes !== false,
    showTicks: options.showTicks !== false,
    showAxisNumbers: options.showAxisNumbers !== false,
  };
}

function niceStep(span, targetTicks) {
  var raw = span / targetTicks;
  var magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  var residual = raw / magnitude;
  var nice;
  if (residual <= 1.5) nice = 1;
  else if (residual <= 3) nice = 2;
  else if (residual <= 7) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

// --- Build Quadratic Key Points ---

function buildQuadraticKeyPoints(coefficients) {
  var a = coefficients.a, b = coefficients.b, c = coefficients.c;
  var points = {};

  // y-intercept: C(0, c)
  points["C"] = { x: 0, y: round4(c), label: "C(0," + round2(c) + ")" };

  // Vertex: V(h, k)
  var h = -b / (2 * a);
  var k = evaluatePolynomial(coefficients, h);
  points["V"] = { x: round4(h), y: round4(k), label: "V(" + round2(h) + "," + round2(k) + ")" };

  // D: axis ∩ x-axis
  points["D"] = { x: round4(h), y: 0, label: "D(" + round2(h) + ",0)" };

  // x-intercepts: solve ax^2+bx+c=0
  var disc = b * b - 4 * a * c;
  if (disc >= -1e-9) {
    var d = Math.sqrt(Math.max(0, disc));
    var x1 = (-b - d) / (2 * a);
    var x2 = (-b + d) / (2 * a);
    points["A"] = { x: round4(x1), y: 0, label: "A(" + round2(x1) + ",0)" };
    points["B"] = { x: round4(x2), y: 0, label: "B(" + round2(x2) + ",0)" };
  }

  return points;
}

// --- Build Linear Key Points ---

function buildLinearKeyPoints(coefficients) {
  var b = coefficients.b, c = coefficients.c;
  var points = {};
  // y-intercept
  points["C"] = { x: 0, y: round4(c), label: "C(0," + round2(c) + ")" };
  // x-intercept (if b != 0)
  if (Math.abs(b) > 1e-9) {
    var xInt = -c / b;
    points["A"] = { x: round4(xInt), y: 0, label: "A(" + round2(xInt) + ",0)" };
  }
  return points;
}

// --- Build Function Graph from Expression ---

function buildFunctionGraphFromExpression(expression) {
  if (!expression || typeof expression !== "string") return null;
  var normalized = normalizeExpression(expression);
  if (!normalized) return null;

  var coeffs = parsePolynomialABC(expression);
  if (!coeffs) return null;

  var range, points, auxLines;

  if (coeffs.kind === "quadratic") {
    // Wider range for quadratic to show the parabola shape
    var h = -coeffs.b / (2 * coeffs.a);
    range = [h - 4, h + 4];
    points = buildQuadraticKeyPoints(coeffs);
    auxLines = [{
      id: "symmetry-axis",
      kind: "line",
      label: "对称轴 x=" + round2(h),
      from: { x: h, y: evaluatePolynomial(coeffs, h) - 3 },
      to: { x: h, y: evaluatePolynomial(coeffs, h) + 3 },
      style: "dashed",
    }];
  } else if (coeffs.kind === "linear") {
    range = [-8, 8];
    points = buildLinearKeyPoints(coeffs);
    auxLines = [];
  } else {
    // constant: y = c
    range = [-5, 5];
    points = {};
    auxLines = [];
  }

  var samples = samplePolynomial(coeffs, range, 200);
  var coordSys = buildCoordinateSystem(
    Object.values(points),
    samples,
    coeffs.kind === "quadratic" ? {} : { showGrid: coeffs.kind !== "constant" }
  );

  var curveId = coeffs.kind === "quadratic" ? "parabola" : "f";
  return {
    type: "function_graph",
    title: coeffs.kind === "quadratic" ? "二次函数图像" : coeffs.kind === "linear" ? "一次函数图像" : "常函数图像",
    description: "由 graphEngine 确定性生成。",
    coordinateSystem: coordSys,
    curves: [{
      id: curveId,
      kind: coeffs.kind,
      expression: expression,
      coefficients: coeffs,
      samples: samples,
    }],
    points: points,
    auxiliaryLines: auxLines,
    functions: [{
      id: curveId,
      label: expression.replace(/^y=/, ""),
      expression: expression,
      range: range,
      role: "original",
    }],
    objects: [],
    views: [{
      id: "q1",
      title: "函数图像",
      showObjects: [curveId].concat(Object.keys(points)).concat(auxLines.map(function(l) { return l.id; })),
      highlightObjects: [],
    }],
    steps: [],
    confidence: "high",
  };
}

// --- Build Function Graph from Question Text ---

function buildFunctionGraphFromText(questionText) {
  if (!questionText || typeof questionText !== "string") return null;
  // Find y= or f(x)= expression
  var normalized = questionText.replace(/\u2212/g, "-").replace(/\u00B2/g, "^2");
  // Match: y = ... or f(x) = ... extracting the full expression
  var match = normalized.match(/(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+?)(?:\s*$|\s*[,，。；;]|\s*(?:与|x轴|y轴|交于|对称|顶点|其中|where|画出|图像|图象|求|的))/i)
    || normalized.match(/(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)/i);
  if (!match) return null;
  var expr = match[1].replace(/\s+/g, "");
  expr = expr.replace(/[^\d\-+*.xX^²=\s\\/()\[\]{}\w\u221A$]+$/, "");
  if (expr.length < 2 || expr.length > 400) return null;
  return buildFunctionGraphFromExpression("y=" + expr);
}

// --- Build Equation Graph (two-function intersection) ---

function buildEquationGraphFromText(questionText) {
  if (!questionText || typeof questionText !== "string") return null;
  var normalized = String(questionText).replace(/\u2212/g, "-").replace(/\s+/g, "");

  // Match: ax + b = c  or  ax = c
  var eqMatch = normalized.match(/([\-]?\d*\.?\d*)x\s*([+\-]\s*\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/i)
    || normalized.match(/([\-]?\d*\.?\d*)x\s*=\s*(\d+(?:\.\d+)?)/i);
  if (!eqMatch) return null;

  var hasConstant = eqMatch[3] !== undefined;
  var coeffRaw = eqMatch[1] || "";
  var coeff, constant, rightVal;
  if (hasConstant) {
    coeff = (coeffRaw === "" || coeffRaw === "+") ? 1 : (coeffRaw === "-") ? -1 : Number(coeffRaw);
    constant = Number(eqMatch[2].replace(/\s+/g, ""));
    rightVal = Number(eqMatch[3]);
    if (!isFinite(coeff) || !isFinite(constant) || !isFinite(rightVal)) return null;
  } else {
    coeff = (coeffRaw === "" || coeffRaw === "+") ? 1 : (coeffRaw === "-") ? -1 : Number(coeffRaw);
    constant = 0;
    rightVal = Number(eqMatch[2]);
    if (!isFinite(coeff) || !isFinite(rightVal)) return null;
  }

  var xSol = (rightVal - constant) / coeff;
  var leftExpr = "y=" + (coeff === 1 ? "x" : coeff === -1 ? "-x" : coeff + "x") + (constant >= 0 ? "+" + constant : String(constant));
  var rightExpr = "y=" + rightVal;

  // Left line coefficients
  var leftCoeffs = { kind: "linear", a: 0, b: coeff, c: constant };
  var rightCoeffs = { kind: "constant", a: 0, b: 0, c: rightVal };

  // Range around intersection
  var padX = Math.max(3, Math.abs(xSol) * 0.5 + 3);
  var range = [xSol - padX, xSol + padX];

  var leftSamples = samplePolynomial(leftCoeffs, range, 200);
  var rightSamples = samplePolynomial(rightCoeffs, range, 200);

  var allSamples = leftSamples.concat(rightSamples);
  var points = {
    P: { x: round4(xSol), y: round4(rightVal), label: "P(" + round2(xSol) + "," + round2(rightVal) + ")" },
  };

  var coordSys = buildCoordinateSystem(
    Object.values(points),
    allSamples,
    { showGrid: true, showAxes: true }
  );

  return {
    type: "function_graph",
    title: "方程图像解法",
    description: "两条图像交点的横坐标就是方程的解。",
    coordinateSystem: coordSys,
    curves: [
      { id: "left", kind: "linear", expression: leftExpr, coefficients: leftCoeffs, samples: leftSamples },
      { id: "right", kind: "constant", expression: rightExpr, coefficients: rightCoeffs, samples: rightSamples },
    ],
    points: points,
    auxiliaryLines: [
      { id: "x-sol", kind: "segment", label: "x=" + round2(xSol), from: { x: xSol, y: 0 }, to: { x: xSol, y: rightVal }, style: "dashed" },
    ],
    functions: [
      { id: "left", label: leftExpr, expression: leftExpr, range: range, role: "original" },
      { id: "right", label: rightExpr, expression: rightExpr, range: range, role: "original" },
    ],
    objects: [],
    views: [{ id: "q1", title: "方程图像", showObjects: ["left", "right", "P", "x-sol"], highlightObjects: [] }],
    steps: [],
    confidence: "high",
  };
}

// --- Enrich Existing Function Graph Spec ---

function enrichFunctionGraphSpec(spec, fallbackQuestionText) {
  if (!spec || spec.type !== "function_graph") return spec;
  var enriched = JSON.parse(JSON.stringify(spec));

  // If curves is missing or has no samples, try to build from functions or questionText
  if (!Array.isArray(enriched.curves) || !enriched.curves.length || !enriched.curves.some(function(c) { return Array.isArray(c.samples) && c.samples.length > 1; })) {
    // Try from functions
    if (Array.isArray(enriched.functions) && enriched.functions.length > 0) {
      var funcExpr = enriched.functions[0].expression;
      if (funcExpr && /[xX]/.test(funcExpr)) {
        var graph = buildFunctionGraphFromExpression(funcExpr);
        if (graph && graph.curves && graph.curves.length) {
          enriched.curves = graph.curves;
          if (!enriched.coordinateSystem) enriched.coordinateSystem = graph.coordinateSystem;
          if (!enriched.points || !Object.keys(enriched.points || {}).length) enriched.points = graph.points;
          if (!enriched.auxiliaryLines || !enriched.auxiliaryLines.length) enriched.auxiliaryLines = graph.auxiliaryLines;
        }
      }
    }
    // Fallback to questionText
    if ((!Array.isArray(enriched.curves) || !enriched.curves.length) && fallbackQuestionText) {
      var eqGraph = buildEquationGraphFromText(fallbackQuestionText);
      if (eqGraph && eqGraph.curves && eqGraph.curves.length) {
        enriched.curves = eqGraph.curves;
        if (!enriched.coordinateSystem) enriched.coordinateSystem = eqGraph.coordinateSystem;
        if (!enriched.points || !Object.keys(enriched.points || {}).length) enriched.points = eqGraph.points;
      } else {
        var funcGraph = buildFunctionGraphFromText(fallbackQuestionText);
        if (funcGraph && funcGraph.curves && funcGraph.curves.length) {
          enriched.curves = funcGraph.curves;
          if (!enriched.coordinateSystem) enriched.coordinateSystem = funcGraph.coordinateSystem;
          if (!enriched.points || !Object.keys(enriched.points || {}).length) enriched.points = funcGraph.points;
          if (!enriched.auxiliaryLines || !enriched.auxiliaryLines.length) enriched.auxiliaryLines = funcGraph.auxiliaryLines;
        }
      }
    }
  }

  return enriched;
}

module.exports = {
  normalizeExpression,
  readBraceContent,
  parseMathNumber,
  splitTerms,
  parsePolynomialABC,
  evaluatePolynomial,
  samplePolynomial,
  buildCoordinateSystem,
  buildQuadraticKeyPoints,
  buildLinearKeyPoints,
  buildFunctionGraphFromExpression,
  buildFunctionGraphFromText,
  buildEquationGraphFromText,
  enrichFunctionGraphSpec,
};