"use strict";

(function initializeMathVisualization(global) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const WIDTH = 560;
  const HEIGHT = 340;
  const SAFE_TYPES = new Set([
    "equation_balance",
    "function_graph",
    "geometry",
    "dynamic_point",
    "trajectory",
    "max_value",
    "number_line",
    "none",
  ]);
  const GEOMETRY_KINDS = new Set([
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

  function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);

    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, String(value));
      }
    });

    return element;
  }

  function createHtmlElement(name, className, text) {
    const element = document.createElement(name);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function distance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  function midpoint(p1, p2) {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  function lineIntersection(line1, line2) {
    const p = line1.p1;
    const r = { x: line1.p2.x - line1.p1.x, y: line1.p2.y - line1.p1.y };
    const q = line2.p1;
    const s = { x: line2.p2.x - line2.p1.x, y: line2.p2.y - line2.p1.y };
    const cross = r.x * s.y - r.y * s.x;

    if (Math.abs(cross) < 1e-9) {
      return null;
    }

    const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / cross;
    return {
      x: p.x + t * r.x,
      y: p.y + t * r.y,
    };
  }

  function circleLineIntersection(circle, line) {
    const dx = line.p2.x - line.p1.x;
    const dy = line.p2.y - line.p1.y;
    const fx = line.p1.x - circle.center.x;
    const fy = line.p1.y - circle.center.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - circle.radius * circle.radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0 || Math.abs(a) < 1e-9) {
      return [];
    }

    const sqrt = Math.sqrt(discriminant);
    return [(-b - sqrt) / (2 * a), (-b + sqrt) / (2 * a)].map((t) => ({
      x: line.p1.x + t * dx,
      y: line.p1.y + t * dy,
    }));
  }

  function rotatePoints(points, angle) {
    const radians = (Number(angle) * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return points.map((point) => ({
      ...point,
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos,
    }));
  }

  function flipYIfNeeded(points, abovePointIds = []) {
    if (!abovePointIds.length) {
      return points;
    }

    const shouldFlip = abovePointIds
      .map((id) => points.find((point) => point.id === id))
      .filter(Boolean)
      .some((point) => point.y < 0);

    return shouldFlip ? points.map((point) => ({ ...point, y: -point.y })) : points;
  }

  function normalizeToBaseline(points, baseline) {
    if (!baseline || baseline.length < 2) {
      return points;
    }

    const first = points.find((point) => point.id === baseline[0]);
    const second = points.find((point) => point.id === baseline[1]);

    if (!first || !second) {
      return points;
    }

    const angle = -Math.atan2(second.y - first.y, second.x - first.x);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return points.map((point) => {
      const x = point.x - first.x;
      const y = point.y - first.y;
      return {
        ...point,
        x: x * cos - y * sin,
        y: x * sin + y * cos,
      };
    });
  }

  function getAngleBisectorDirection(vertex, p1, p2) {
    const v1 = normalizeVector({ x: p1.x - vertex.x, y: p1.y - vertex.y });
    const v2 = normalizeVector({ x: p2.x - vertex.x, y: p2.y - vertex.y });
    return normalizeVector({ x: v1.x + v2.x, y: v1.y + v2.y });
  }

  function getLabelOffsetDirection(point, connectedPoints = []) {
    if (!connectedPoints.length) {
      return { x: 1, y: -1 };
    }

    const average = connectedPoints.reduce(
      (sum, connectedPoint) => ({
        x: sum.x + connectedPoint.x - point.x,
        y: sum.y + connectedPoint.y - point.y,
      }),
      { x: 0, y: 0 },
    );
    const outward = normalizeVector({ x: -average.x, y: -average.y });
    return outward.x || outward.y ? outward : { x: 1, y: -1 };
  }

  function normalizeVector(vector) {
    const length = Math.hypot(vector.x, vector.y);

    if (length < 1e-9) {
      return { x: 0, y: 0 };
    }

    return {
      x: vector.x / length,
      y: vector.y / length,
    };
  }

  function normalizePointMap(spec) {
    const points = {};

    if (spec?.points && typeof spec.points === "object" && !Array.isArray(spec.points)) {
      Object.entries(spec.points).forEach(([id, value]) => {
        const x = toNumber(value?.x);
        const y = toNumber(value?.y);

        if (x !== null && y !== null) {
          points[id] = {
            id,
            x,
            y,
            label: value.label || id,
          };
        }
      });
    }

    (Array.isArray(spec?.objects) ? spec.objects : []).forEach((object) => {
      if (object?.kind !== "point") {
        return;
      }

      const id = String(object.id || object.label || "").trim();
      const x = toNumber(object.x);
      const y = toNumber(object.y);

      if (id && x !== null && y !== null) {
        points[id] = {
          id,
          x,
          y,
          label: object.label || id,
        };
      }
    });

    return points;
  }

  function normalizeVisualizationSpec(spec) {
    if (!spec || typeof spec !== "object" || !SAFE_TYPES.has(spec.type)) {
      return {
        type: "none",
        title: "图示讲解",
        description: "暂无可靠图示，可查看文字解析。",
        points: {},
        objects: [],
        views: [],
        steps: [],
      };
    }

    var normalized = {
      type: spec.type,
      title: spec.title || "图示讲解",
      description: spec.description || "",
      confidence: spec.confidence || "medium",
      orientation: spec.orientation || {},
      equation: spec.equation || "",
      functions: Array.isArray(spec.functions) ? spec.functions : [],
      auxiliaryLines: Array.isArray(spec.auxiliaryLines) ? spec.auxiliaryLines : [],
      leftTerms: Array.isArray(spec.leftTerms) ? spec.leftTerms : [],
      rightTerms: Array.isArray(spec.rightTerms) ? spec.rightTerms : [],
      coordinateSystem: spec.coordinateSystem || null,
      curves: Array.isArray(spec.curves) ? spec.curves : [],
      points: normalizePointMap(spec),
      objects: Array.isArray(spec.objects) ? spec.objects : [],
      views: Array.isArray(spec.views) ? spec.views : [],
      steps: Array.isArray(spec.steps) ? spec.steps : [],
    };

    if (typeof localStorage !== "undefined" && localStorage.getItem("mathAiEduDebug") === "1") {
      console.log("[MathVisualization] normalized type:", normalized.type, "curves:", normalized.curves.length, "coordinateSystem:", normalized.coordinateSystem ? "present" : "missing");
    }

    return normalized;
  }


  function getViews(spec) {
    return Array.isArray(spec && spec.views) ? spec.views : [];
  }

  function validateGeometrySpec(spec) {
    if (spec.type === "none" || spec.confidence === "low") {
      return {
        valid: false,
        reason: "暂无可靠图示，可查看文字解析。",
      };
    }

    const pointIds = new Set(Object.keys(spec.points));

    if (!pointIds.size) {
      return {
        valid: false,
        reason: "暂无可靠图示，可查看文字解析。",
      };
    }

    const objectIds = new Set();

    for (const object of spec.objects) {
      if (!object || !GEOMETRY_KINDS.has(object.kind)) {
        continue;
      }

      if (object.id) {
        objectIds.add(object.id);
      }

      if (["segment", "auxiliaryLine", "line", "ray"].includes(object.kind)) {
        const endpoints = getObjectPointIds(object);
        if (endpoints.length < 2 || endpoints.some((id) => !pointIds.has(id))) {
          return {
            valid: false,
            reason: "暂无可靠图示，可查看文字解析。",
          };
        }
      } else if (object.kind === "circle" || object.kind === "arc") {
        if (!pointIds.has(object.center) || !Number.isFinite(Number(object.radius)) || Number(object.radius) <= 0) {
          return {
            valid: false,
            reason: "暂无可靠图示，可查看文字解析。",
          };
        }
      } else if (object.kind === "angle" || object.kind === "rightAngle") {
        const points = getAnglePointIds(object);
        if (points.length < 3 || points.some((id) => !pointIds.has(id))) {
          return {
            valid: false,
            reason: "暂无可靠图示，可查看文字解析。",
          };
        }
      } else if (object.kind === "polygon") {
        const points = Array.isArray(object.points) ? object.points : [];
        if (points.length < 3 || points.some((id) => !pointIds.has(id))) {
          return {
            valid: false,
            reason: "暂无可靠图示，可查看文字解析。",
          };
        }
      }
    }

    if (!spec.objects.some((object) => GEOMETRY_KINDS.has(object.kind) && object.kind !== "point")) {
      return {
        valid: false,
        reason: "暂无可靠图示，可查看文字解析。",
      };
    }

    return { valid: true, objectIds };
  }

  function getObjectPointIds(object) {
    if (object.from && object.to) {
      return [object.from, object.to];
    }

    if (Array.isArray(object.through) && object.through.length >= 2) {
      return [object.through[0], object.through[1]];
    }

    return [];
  }

  function getAnglePointIds(object) {
    if (Array.isArray(object.points) && object.points.length >= 3) {
      return object.points.slice(0, 3);
    }

    if (object.from && object.vertex && object.to) {
      return [object.from, object.vertex, object.to];
    }

    return [];
  }

  function getPoint(spec, id) {
    return spec.points[id] || null;
  }

  function getVisibleObjects(spec, view) {
    const allObjects = spec.objects.filter((object) => object.kind !== "point");

    if (!view || !Array.isArray(view.showObjects) || !view.showObjects.length) {
      return allObjects;
    }

    const allowed = new Set(view.showObjects);
    return allObjects.filter((object) => allowed.has(object.id));
  }

  function getBounds(points, padding = 0.18) {
    const safePoints = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    if (!safePoints.length) {
      return { minX: -5, maxX: 5, minY: -3, maxY: 3 };
    }

    const xs = safePoints.map((point) => point.x);
    const ys = safePoints.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);

    return {
      minX: minX - spanX * padding,
      maxX: maxX + spanX * padding,
      minY: minY - spanY * padding,
      maxY: maxY + spanY * padding,
    };
  }

  function createMapper(bounds, width = WIDTH, height = HEIGHT) {
    const spanX = Math.max(1, bounds.maxX - bounds.minX);
    const spanY = Math.max(1, bounds.maxY - bounds.minY);
    const padding = 34;

    return {
      width,
      height,
      project(point) {
        return projectPoint(point, bounds, width, height, padding);
      },
    };
  }

  function projectPoint(point, bounds, width = WIDTH, height = HEIGHT, padding = 34) {
    const spanX = Math.max(1, bounds.maxX - bounds.minX);
    const spanY = Math.max(1, bounds.maxY - bounds.minY);

    return {
      x: padding + ((point.x - bounds.minX) / spanX) * (width - padding * 2),
      y: height - padding - ((point.y - bounds.minY) / spanY) * (height - padding * 2),
    };
  }

  function createBaseSvg(className = "math-visualization-svg") {
    return createSvgElement("svg", {
      viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
      role: "img",
      class: className,
    });
  }

  function getObjectClass(object, extra = "") {
    const classes = [extra || `mv-${object.kind}`];

    if (object.role === "auxiliary" || object.kind === "auxiliaryLine" || object.style === "dashed") {
      classes.push("mv-auxiliary");
    }

    if (object.role === "highlight") {
      classes.push("mv-highlight");
    }

    return classes.filter(Boolean).join(" ");
  }

  function drawPoint(svg, point, mapper, options = {}) {
    const projected = mapper.project(point);
    svg.append(
      createSvgElement("circle", {
        cx: projected.x,
        cy: projected.y,
        r: options.radius || 3.5,
        class: options.className || "mv-point",
        "data-point-id": point.id,
      }),
    );
  }

  function drawSegment(svg, p1, p2, mapper, options = {}) {
    const start = mapper.project(p1);
    const end = mapper.project(p2);
    svg.append(
      createSvgElement("line", {
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        class: options.className || "mv-segment",
        "data-object-id": options.id || "",
      }),
    );
  }

  function drawLine(svg, p1, p2, mapper, bounds, options = {}) {
    const direction = normalizeVector({ x: p2.x - p1.x, y: p2.y - p1.y });

    if (!direction.x && !direction.y) {
      return;
    }

    const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 2;
    drawSegment(
      svg,
      { x: p1.x - direction.x * span, y: p1.y - direction.y * span },
      { x: p1.x + direction.x * span, y: p1.y + direction.y * span },
      mapper,
      options,
    );
  }

  function drawRay(svg, p1, p2, mapper, bounds, options = {}) {
    const direction = normalizeVector({ x: p2.x - p1.x, y: p2.y - p1.y });

    if (!direction.x && !direction.y) {
      return;
    }

    const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 2;
    drawSegment(
      svg,
      p1,
      { x: p1.x + direction.x * span, y: p1.y + direction.y * span },
      mapper,
      options,
    );
  }

  function drawCircle(svg, center, radius, mapper, options = {}) {
    const projectedCenter = mapper.project(center);
    const projectedEdge = mapper.project({ x: center.x + radius, y: center.y });
    svg.append(
      createSvgElement("circle", {
        cx: projectedCenter.x,
        cy: projectedCenter.y,
        r: Math.abs(projectedEdge.x - projectedCenter.x),
        class: options.className || "mv-circle",
        "data-object-id": options.id || "",
      }),
    );
  }

  function polarPoint(center, radius, angle) {
    const radians = (Number(angle) * Math.PI) / 180;
    return {
      x: center.x + radius * Math.cos(radians),
      y: center.y + radius * Math.sin(radians),
    };
  }

  function drawArc(svg, center, radius, startAngle, endAngle, mapper, options = {}) {
    const start = mapper.project(polarPoint(center, radius, startAngle));
    const end = mapper.project(polarPoint(center, radius, endAngle));
    const projectedCenter = mapper.project(center);
    const projectedEdge = mapper.project({ x: center.x + radius, y: center.y });
    const svgRadius = Math.abs(projectedEdge.x - projectedCenter.x);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

    svg.append(
      createSvgElement("path", {
        d: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${svgRadius.toFixed(2)} ${svgRadius.toFixed(2)} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
        class: options.className || "mv-arc",
        "data-object-id": options.id || "",
      }),
    );
  }

  function drawAngle(svg, vertex, p1, p2, mapper, options = {}) {
    const radius = options.radius || Math.max(0.28, Math.min(distance(vertex, p1), distance(vertex, p2)) * 0.22);
    const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
    const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
    const start = mapper.project({
      x: vertex.x + Math.cos(a1) * radius,
      y: vertex.y + Math.sin(a1) * radius,
    });
    const end = mapper.project({
      x: vertex.x + Math.cos(a2) * radius,
      y: vertex.y + Math.sin(a2) * radius,
    });
    const center = mapper.project(vertex);
    const projectedRadius = Math.max(8, Math.hypot(start.x - center.x, start.y - center.y));
    const delta = Math.abs(a2 - a1);
    const largeArc = delta > Math.PI ? 1 : 0;

    svg.append(
      createSvgElement("path", {
        d: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${projectedRadius.toFixed(2)} ${projectedRadius.toFixed(2)} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
        class: options.className || "mv-angle",
        "data-object-id": options.id || "",
      }),
    );
  }

  function drawRightAngle(svg, vertex, p1, p2, mapper, options = {}) {
    const size = options.size || Math.max(0.22, Math.min(distance(vertex, p1), distance(vertex, p2)) * 0.16);
    const v1 = normalizeVector({ x: p1.x - vertex.x, y: p1.y - vertex.y });
    const v2 = normalizeVector({ x: p2.x - vertex.x, y: p2.y - vertex.y });
    const a = { x: vertex.x + v1.x * size, y: vertex.y + v1.y * size };
    const b = { x: a.x + v2.x * size, y: a.y + v2.y * size };
    const c = { x: vertex.x + v2.x * size, y: vertex.y + v2.y * size };
    const pa = mapper.project(a);
    const pb = mapper.project(b);
    const pc = mapper.project(c);

    svg.append(
      createSvgElement("path", {
        d: `M ${pa.x.toFixed(2)} ${pa.y.toFixed(2)} L ${pb.x.toFixed(2)} ${pb.y.toFixed(2)} L ${pc.x.toFixed(2)} ${pc.y.toFixed(2)}`,
        class: options.className || "mv-right-angle",
        "data-object-id": options.id || "",
      }),
    );
  }

  function drawLabel(svg, point, label, mapper, options = {}) {
    if (!label) {
      return;
    }

    const projected = mapper.project(point);
    const direction = options.direction || { x: 1, y: -1 };
    const offset = options.offset || 13;
    const text = createSvgElement("text", {
      x: projected.x + direction.x * offset,
      y: projected.y + direction.y * offset,
      class: options.className || "mv-label",
      "data-label-for": point.id || "",
    });
    text.textContent = label;
    svg.append(text);
  }

  function renderGeometryView(svg, spec, view, mapper, bounds, showGrid) {
    // Draw coordinate grid first (lowest layer)
    if (showGrid !== false) {
      renderCoordinateGrid(svg, mapper, bounds);
    }

    const highlighted = new Set(view?.highlightObjects || []);
    const visibleObjects = getVisibleObjects(spec, view);

    visibleObjects.forEach((object) => {
      if (object.kind === "polygon") {
        const points = object.points.map((id) => getPoint(spec, id)).filter(Boolean);
        points.forEach((point, index) => {
          drawSegment(
            svg,
            point,
            points[(index + 1) % points.length],
            mapper,
            { id: object.id, className: getObjectClass(object, highlighted.has(object.id) ? "mv-highlight" : "mv-segment") },
          );
        });
        return;
      }

      if (object.kind === "segment" || object.kind === "auxiliaryLine") {
        const [fromId, toId] = getObjectPointIds(object);
        const from = getPoint(spec, fromId);
        const to = getPoint(spec, toId);
        drawSegment(
          svg,
          from,
          to,
          mapper,
          { id: object.id, className: getObjectClass(object, highlighted.has(object.id) ? "mv-highlight" : "mv-segment") },
        );
      } else if (object.kind === "line") {
        const [fromId, toId] = getObjectPointIds(object);
        drawLine(
          svg,
          getPoint(spec, fromId),
          getPoint(spec, toId),
          mapper,
          bounds,
          { id: object.id, className: getObjectClass(object, highlighted.has(object.id) ? "mv-highlight" : "mv-line") },
        );
      } else if (object.kind === "ray") {
        const [fromId, toId] = getObjectPointIds(object);
        drawRay(
          svg,
          getPoint(spec, fromId),
          getPoint(spec, toId),
          mapper,
          bounds,
          { id: object.id, className: getObjectClass(object, highlighted.has(object.id) ? "mv-highlight" : "mv-line") },
        );
      } else if (object.kind === "circle") {
        drawCircle(
          svg,
          getPoint(spec, object.center),
          Number(object.radius),
          mapper,
          { id: object.id, className: getObjectClass(object, highlighted.has(object.id) ? "mv-highlight" : "mv-circle") },
        );
      } else if (object.kind === "arc") {
        drawArc(
          svg,
          getPoint(spec, object.center),
          Number(object.radius),
          Number(object.startAngle),
          Number(object.endAngle),
          mapper,
          { id: object.id, className: getObjectClass(object, highlighted.has(object.id) ? "mv-highlight" : "mv-arc") },
        );
      } else if (object.kind === "angle" || object.kind === "rightAngle") {
        const [p1Id, vertexId, p2Id] = getAnglePointIds(object);
        const vertex = getPoint(spec, vertexId);
        const p1 = getPoint(spec, p1Id);
        const p2 = getPoint(spec, p2Id);

        if (object.kind === "rightAngle") {
          drawRightAngle(svg, vertex, p1, p2, mapper, {
            id: object.id,
            className: getObjectClass(object, highlighted.has(object.id) ? "mv-highlight" : "mv-right-angle"),
          });
        } else {
          drawAngle(svg, vertex, p1, p2, mapper, {
            id: object.id,
            className: getObjectClass(object, highlighted.has(object.id) ? "mv-highlight" : "mv-angle"),
          });
        }
      } else if (object.kind === "label") {
        const point = object.at ? getPoint(spec, object.at) : { x: Number(object.x), y: Number(object.y), id: object.id };
        if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
          drawLabel(svg, point, object.text || object.label, mapper, { className: "mv-label mv-custom-label" });
        }
      }
    });

    const connected = new Map();
    visibleObjects.forEach((object) => {
      const [fromId, toId] = getObjectPointIds(object);
      if (fromId && toId) {
        connected.set(fromId, [...(connected.get(fromId) || []), getPoint(spec, toId)].filter(Boolean));
        connected.set(toId, [...(connected.get(toId) || []), getPoint(spec, fromId)].filter(Boolean));
      }
    });

    Object.values(spec.points).forEach((point) => {
      drawPoint(svg, point, mapper);
      drawLabel(svg, point, point.label, mapper, {
        direction: getLabelOffsetDirection(point, connected.get(point.id) || []),
      });
    });
  }

  function renderGeometry(container, spec, options = {}) {
    const validation = validateGeometrySpec(spec);

    if (!validation.valid) {
      renderEmpty(container, validation.reason);
      return;
    }

    const views = getViews(spec).length ? getViews(spec) : [{ id: "original", title: "原题图" }];
    const selectedViews = options.viewId
      ? views.filter((view) => view.id === options.viewId)
      : views;

    if (!selectedViews.length) {
      renderEmpty(container, "暂无可靠图示，可查看文字解析。");
      return;
    }

    const wrapper = createHtmlElement("div", "geometry-view-list");
    const allPoints = Object.values(spec.points);
    const bounds = getBounds(allPoints, 0.22);
    const mapper = createMapper(bounds);

    selectedViews.forEach((view) => {
      const viewCard = createHtmlElement("article", "geometry-view-card");
      const viewTitle = createHtmlElement("h4", "", view.title || "图示");
      const svg = createBaseSvg("math-visualization-svg geometry-svg");
      renderGeometryView(svg, spec, view, mapper, bounds, options && options.showGrid);
      viewCard.append(viewTitle, svg);
      wrapper.append(viewCard);
    });

    container.append(wrapper);
  }

  function renderCoordinateGrid(svg, mapper, bounds) {
    // 1. Draw light gray grid (lowest layer)
    const spanX = bounds.maxX - bounds.minX;
    const spanY = bounds.maxY - bounds.minY;
    const gridStepX = Math.max(1, Math.pow(10, Math.floor(Math.log10(spanX))));
    const gridStepY = Math.max(1, Math.pow(10, Math.floor(Math.log10(spanY))));
    const gridGroup = createSvgElement("g", { class: "mv-grid-layer" });

    for (let x = Math.ceil(bounds.minX / gridStepX) * gridStepX; x <= bounds.maxX; x += gridStepX) {
      const p = mapper.project({ x, y: 0 });
      gridGroup.append(createSvgElement("line", {
        x1: p.x, y1: 0, x2: p.x, y2: mapper.height, class: "mv-grid-line",
      }));
    }
    for (let y = Math.ceil(bounds.minY / gridStepY) * gridStepY; y <= bounds.maxY; y += gridStepY) {
      const p = mapper.project({ x: 0, y });
      gridGroup.append(createSvgElement("line", {
        x1: 0, y1: p.y, x2: mapper.width, y2: p.y, class: "mv-grid-line",
      }));
    }
    svg.prepend(gridGroup);

    // 2. Draw axes with arrows
    const zeroY = Math.min(Math.max(0, bounds.minY), bounds.maxY);
    const zeroX = Math.min(Math.max(0, bounds.minX), bounds.maxX);
    const xStart = mapper.project({ x: bounds.minX, y: zeroY });
    const xEnd = mapper.project({ x: bounds.maxX, y: zeroY });
    const yStart = mapper.project({ x: zeroX, y: bounds.minY });
    const yEnd = mapper.project({ x: zeroX, y: bounds.maxY });

    const axesGroup = createSvgElement("g", { class: "mv-axes-layer" });
    axesGroup.append(
      createSvgElement("line", {
        x1: xStart.x, y1: xStart.y, x2: xEnd.x, y2: xEnd.y,
        class: "mv-axis", "marker-end": "url(#axis-arrow)",
      }),
      createSvgElement("line", {
        x1: yStart.x, y1: yStart.y, x2: yEnd.x, y2: yEnd.y,
        class: "mv-axis", "marker-end": "url(#axis-arrow)",
      }),
    );
    svg.append(axesGroup);

    // 3. Arrow marker defs
    if (!svg.querySelector("defs")) {
      svg.prepend(createSvgElement("defs", {}));
    }
    if (!svg.querySelector("#axis-arrow")) {
      const marker = createSvgElement("marker", {
        id: "axis-arrow", markerWidth: 8, markerHeight: 8,
        refX: 7, refY: 4, orient: "auto", markerUnits: "strokeWidth",
      });
      marker.append(createSvgElement("path", { d: "M0,0 L8,4 L0,8 Z", class: "mv-axis-arrow" }));
      svg.querySelector("defs").append(marker);
    }

    // 4. Axis labels (O, x, y)
    const axisLabelGroup = createSvgElement("g", { class: "mv-axis-labels" });
    if (zeroX >= bounds.minX && zeroX <= bounds.maxX && zeroY >= bounds.minY && zeroY <= bounds.maxY) {
      const oProj = mapper.project({ x: zeroX, y: zeroY });
      const oLabel = createSvgElement("text", {
        x: oProj.x + 6, y: oProj.y - 6, class: "mv-axis-label",
      });
      oLabel.textContent = "O";
      axisLabelGroup.append(oLabel);
    }
    const xLabelP = mapper.project({ x: bounds.maxX, y: zeroY });
    const xLabel = createSvgElement("text", {
      x: xLabelP.x - 15, y: xLabelP.y - 8, class: "mv-axis-label",
    });
    xLabel.textContent = "x";
    axisLabelGroup.append(xLabel);
    const yLabelP = mapper.project({ x: zeroX, y: bounds.maxY });
    const yLabel = createSvgElement("text", {
      x: yLabelP.x + 8, y: yLabelP.y + 4, class: "mv-axis-label",
    });
    yLabel.textContent = "y";
    axisLabelGroup.append(yLabel);
    svg.append(axisLabelGroup);
  }

  function renderAxes(svg, mapper, bounds) {
    renderCoordinateGrid(svg, mapper, bounds);
  }


  function parsePolynomialExpression(expression) {
    const normalized = String(expression || "")
      .replaceAll("²", "^2")
      .replace(/\s+/g, "")
      .replace(/^y=/i, "")
      .replace(/^f\(x\)=/i, "");

    if (!normalized || !/^[+\-0-9.xX^*]+$/.test(normalized)) {
      return null;
    }

    const terms = normalized.match(/[+-]?[^+-]+/g) || [];
    const coefficients = { a: 0, b: 0, c: 0 };

    function parseCoefficient(term, variablePart) {
      const raw = term.replace(variablePart, "").replace("*", "");

      if (raw === "" || raw === "+") return 1;
      if (raw === "-") return -1;

      const value = Number(raw);
      return Number.isFinite(value) ? value : null;
    }

    for (const term of terms) {
      if (/x\^2/i.test(term)) {
        const value = parseCoefficient(term, /x\^2/i);
        if (value === null) return null;
        coefficients.a += value;
      } else if (/x/i.test(term)) {
        const value = parseCoefficient(term, /x/i);
        if (value === null) return null;
        coefficients.b += value;
      } else {
        const value = Number(term);
        if (!Number.isFinite(value)) return null;
        coefficients.c += value;
      }
    }

    return (x) => coefficients.a * x * x + coefficients.b * x + coefficients.c;
  }


  // --- LaTeX math parsing helpers (no eval) ---
  function parseLatexNumber(str) {
    if (!str) return NaN;
    str = String(str).replace(/\s+/g, "");
    // \frac{a}{b}
    var fracM = str.match(/^\\frac\{([^}]+)\}\{([^}]+)\}$/);
    if (fracM) {
      var num = parseLatexNumber(fracM[1]);
      var den = parseLatexNumber(fracM[2]);
      return (Number.isFinite(num) && Number.isFinite(den) && den !== 0) ? num / den : NaN;
    }
    // \sqrt{a}
    var sqrtM = str.match(/^\\sqrt\{([^}]+)\}$/);
    if (sqrtM) {
      var val = parseLatexNumber(sqrtM[1]);
      return Number.isFinite(val) ? Math.sqrt(Math.abs(val)) : NaN;
    }
    // Plain number
    var n = Number(str);
    return Number.isFinite(n) ? n : NaN;
  }

  // Balanced-brace reader for nested LaTeX like \\frac{\\sqrt{3}}{3}
  function readBraceContent(text, openIndex) {
    if (text[openIndex] !== "{") return null;
    var depth = 0;
    var start = openIndex + 1;
    for (var ri = openIndex; ri < text.length; ri++) {
      if (text[ri] === "{" && (ri === openIndex || text[ri - 1] !== "\\")) depth++;
      else if (text[ri] === "}" && text[ri - 1] !== "\\") {
        depth--;
        if (depth === 0) return { content: text.slice(start, ri), end: ri };
      }
    }
    return null;
  }
  // Unified function expression parser - no eval, supports LaTeX and √
  function normalizeMathExpressionForGraph(expr) {
    if (!expr) return null;
    var s = String(expr)
      .replace(/^y\s*=\s*/i, "")
      .replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, "")
      .replace(/\s+/g, "")
      .replace(/\u00B2/g, "^2")
      .replace(/\u2212/g, "-");

    // Convert √ to \sqrt{...} form (handles √3, √(3), (√3/3))
    s = preprocessRadical(s);

    // Convert \frac{...}{...} and \sqrt{...} to numeric values using balanced braces
    s = safeReplaceLaTeX(s);

    // Convert (number/number) style: (\u221A3/3) -> numeric
    s = s.replace(/\(([\-]?[\d.]+)\/([\d.]+)\)/g, function(m, a, b) {
      var na = Number(a), nb = Number(b);
      return (Number.isFinite(na) && Number.isFinite(nb) && nb !== 0) ? String(na / nb) : m;
    });

    // If still has LaTeX commands, return null (can't parse)
    if (/\\[a-zA-Z]/.test(s)) return null;

    return s;
  }

  // Convert √ symbol and various radical notations to \sqrt{...}
  function preprocessRadical(text) {
    var result = "";
    var i = 0;
    while (i < text.length) {
      if (text[i] === "\u221A") {
        i++;
        if (i < text.length && text[i] === "(") {
          var depth = 1, start = i + 1;
          i++;
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

  // Safe LaTeX replacement using balanced-brace reader
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

  // Unified parser: returns { kind, a, b, c, evaluate } or null
  function parseFunctionExpression(expr) {
    var s = normalizeMathExpressionForGraph(expr);
    if (!s) return null;

    // Try to split into terms
    var terms = splitTerms(s);
    if (!terms) return null;

    var a = 0, b = 0, c = 0;
    for (var ti = 0; ti < terms.length; ti++) {
      var term = terms[ti];
      if (/x\^2/.test(term)) {
        var coeff = extractCoeff(term, /x\^2.*$/);
        if (coeff === null) return null;
        a += coeff;
      } else if (/x/.test(term)) {
        var coeff = extractCoeff(term, /x.*$/);
        if (coeff === null) return null;
        b += coeff;
      } else {
        var val = Number(term);
        if (!Number.isFinite(val)) return null;
        c += val;
      }
    }

    var kind = Math.abs(a) > 1e-9 ? "quadratic" : Math.abs(b) > 1e-9 ? "linear" : "constant";
    return {
      kind: kind,
      a: a, b: b, c: c,
      evaluate: function(x) { return a * x * x + b * x + c; }
    };
  }

  // Split expression into terms, respecting sign
  function splitTerms(s) {
    var terms = [];
    var current = "";
    var i = 0;
    while (i < s.length) {
      var ch = s[i];
      if ((ch === "+" || ch === "-") && current.length > 0) {
        terms.push(current);
        current = ch === "-" ? "-" : "";
      } else {
        current += ch;
      }
      i++;
    }
    if (current) terms.push(current);
    return terms;
  }

  // Extract coefficient from term, returns number or null
  function extractCoeff(term, varRegex) {
    var s = term.replace(varRegex, "").replace(/\*/g, "");
    if (s === "" || s === "+") return 1;
    if (s === "-") return -1;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  // Backward-compatible: evaluateMathExpression wraps parseFunctionExpression
  function evaluateMathExpression(expr) {
    var parsed = parseFunctionExpression(expr);
    if (parsed) return parsed.evaluate;
    return null;
  }
  // Resolve a point reference: {x,y} object stays, string looks up in points dict
  function resolveGraphPoint(value, points) {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      var x = Number(value.x);
      var y = Number(value.y);
      if (Number.isFinite(x) && Number.isFinite(y)) return { x: x, y: y };
      return null;
    }
    if (typeof value === "string") {
      var trimmed = value.trim();
      var p = points && points[trimmed];
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return { x: p.x, y: p.y };
      // Try removing quotes
      var unquoted = trimmed.replace(/^['""]+|['""]+$/g, "");
      if (unquoted !== trimmed) {
        p = points && points[unquoted];
        if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return { x: p.x, y: p.y };
      }
    }
    return null;
  }
  // Local sample builder - tries functions expressions when curves.samples missing
  function buildLocalSamples(spec, bounds) {
    var funcs = Array.isArray(spec.functions) ? spec.functions : [];
    if (!funcs.length) return null;
    for (var fi = 0; fi < funcs.length; fi++) {
      var expr = funcs[fi].expression;
      if (!expr || (!/[xX]/.test(expr) && !/\bfunction\b/i.test(expr))) continue;
      var parsed = parseFunctionExpression(expr);
      if (!parsed || !parsed.evaluate) continue;
      var range = Array.isArray(funcs[fi].range) ? funcs[fi].range : [bounds.minX, bounds.maxX];
      var samples = [];
      var count = 200;
      for (var si = 0; si <= count; si++) {
        var x = range[0] + (range[1] - range[0]) * si / count;
        var y = parsed.evaluate(x);
        if (Number.isFinite(y)) samples.push({ x: x, y: y });
      }
      if (samples.length > 1) return samples;
    }
    return null;
  }

  function renderFunctionGraph(container, spec, options) {
    if (options === undefined) options = {};
    var dbg = (typeof localStorage !== "undefined" && localStorage.getItem("mathAiEduDebug") === "1");

    if (dbg) {
      console.log("[FunctionGraph] spec.type:", spec.type);
      console.log("[FunctionGraph] curves:", (spec.curves || []).length, "functions:", (spec.functions || []).length);
      if (spec.coordinateSystem) console.log("[FunctionGraph] coordinateSystem:", spec.coordinateSystem);
      console.log("[FunctionGraph] points:", Object.keys(spec.points || {}).length, "auxLines:", (spec.auxiliaryLines || []).length);
    }

    // HARD RULE: spec.type === "function_graph" MUST try to render
    // Priority: curves.samples > curves.coefficients > functions.expression

    // Compute bounds early (used by fallback too)
    var cs = spec.coordinateSystem || {};
    var bounds = {
      minX: Number.isFinite(cs.xMin) ? cs.xMin : -5,
      maxX: Number.isFinite(cs.xMax) ? cs.xMax : 5,
      minY: Number.isFinite(cs.yMin) ? cs.yMin : -5,
      maxY: Number.isFinite(cs.yMax) ? cs.yMax : 5,
    };

    var curves = Array.isArray(spec.curves) ? spec.curves : [];
    var hasSamples = curves.some(function(c) { return Array.isArray(c.samples) && c.samples.length > 1; });

    if (!hasSamples) {
      // Fallback: try local evaluation from functions expressions
      if (dbg) console.warn("[FunctionGraph] No curves.samples, trying local expression evaluation");

      var localSamples = buildLocalSamples(spec, bounds);
      if (localSamples && localSamples.length > 1) {
        curves = [{ id: "local", kind: "unknown", samples: localSamples }];
        hasSamples = true;
        if (dbg) console.log("[FunctionGraph] local samples generated:", localSamples.length);
      } else {
        // No local samples either - draw coordinate system with warning
        var xStep2 = Number.isFinite(cs.xStep) ? cs.xStep : niceStep(bounds.maxX - bounds.minX);
        var yStep2 = Number.isFinite(cs.yStep) ? cs.yStep : niceStep(bounds.maxY - bounds.minY);
        var mapper2 = createMapper(bounds);
        var svg2 = createBaseSvg("math-visualization-svg function-svg");
        if (cs.showGrid !== false) renderGraphGrid(svg2, mapper2, bounds, xStep2, yStep2);
        renderGraphAxes(svg2, mapper2, bounds);
        if (cs.showTicks !== false || cs.showAxisNumbers !== false) renderGraphTicks(svg2, mapper2, bounds, xStep2, yStep2, cs.showTicks !== false, cs.showAxisNumbers !== false);
        var warningText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        warningText.setAttribute("x", (mapper2.width / 2).toFixed(1));
        warningText.setAttribute("y", (mapper2.height / 2).toFixed(1));
        warningText.setAttribute("text-anchor", "middle");
        warningText.setAttribute("class", "mv-empty-warning");
        warningText.textContent = "后端图形采样数据缺失，请查看文字解析。";
        svg2.append(warningText);
        container.append(svg2);
        if (dbg) console.warn("[FunctionGraph] No renderable data, showing coordinate system with warning");
        return;
      }
    }

    var xStep = Number.isFinite(cs.xStep) ? cs.xStep : niceStep(bounds.maxX - bounds.minX);
    var yStep = Number.isFinite(cs.yStep) ? cs.yStep : niceStep(bounds.maxY - bounds.minY);
    var showGrid = cs.showGrid !== false;
    var showTicks = cs.showTicks !== false;
    var showNumbers = cs.showAxisNumbers !== false;

    var mapper = createMapper(bounds);
    var svg = createBaseSvg("math-visualization-svg function-svg");

    // --- LAYER 1: Grid ---
    if (showGrid) {
      renderGraphGrid(svg, mapper, bounds, xStep, yStep);
    }

    // --- LAYER 2: Axes ---
    renderGraphAxes(svg, mapper, bounds);

    // --- LAYER 3: Ticks and numbers ---
    if (showTicks || showNumbers) {
      renderGraphTicks(svg, mapper, bounds, xStep, yStep, showTicks, showNumbers);
    }

    // --- LAYER 4: Curves (from samples) ---
    curves.forEach(function(curve, ci) {
      if (!Array.isArray(curve.samples) || curve.samples.length < 2) {
        if (dbg) console.warn("[FunctionGraph] curve[" + ci + "] " + (curve.id || "?") + " skipped - no samples");
        return;
      }
      // Build path from samples
      var pathParts = [];
      curve.samples.forEach(function(s) {
        if (s && Number.isFinite(s.x) && Number.isFinite(s.y)) {
          var proj = mapper.project({ x: s.x, y: s.y });
          if (Number.isFinite(proj.x) && Number.isFinite(proj.y)) {
            pathParts.push(proj.x.toFixed(2) + "," + proj.y.toFixed(2));
          }
        }
      });
      if (pathParts.length > 1) {
        var cls = ci === 0 ? "mv-function" : "mv-function-secondary";
        svg.append(createSvgElement("path", { d: "M" + pathParts.join("L"), class: cls }));
        if (dbg) console.log("[FunctionGraph] curve[" + ci + "] " + (curve.id || "?") + " samples:", curve.samples.length, "path pts:", pathParts.length, "APPENDED");
      } else {
        if (dbg) console.warn("[FunctionGraph] curve[" + ci + "] skipped - no valid projected points");
      }
    });

    // --- LAYER 5: Points ---
    var allPoints = collectDrawablePoints(spec);
    allPoints.forEach(function(p) {
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
        drawPoint(svg, { x: p.x, y: p.y, id: p.label || "" }, mapper);
        if (p.label) drawLabel(svg, { x: p.x, y: p.y, id: p.label, label: p.label }, p.label, mapper);
      }
    });
    if (dbg) console.log("[FunctionGraph] drawn points:", allPoints.length);

    // --- LAYER 6: Auxiliary Lines ---
    var auxSkipped = 0;
    (Array.isArray(spec.auxiliaryLines) ? spec.auxiliaryLines : []).forEach(function(l) {
      if (!l || !l.kind) { auxSkipped++; return; }
      var from = resolveGraphPoint(l.from, spec.points || {});
      var to = resolveGraphPoint(l.to, spec.points || {});
      if (!from || !to) { auxSkipped++; return; }
      var dashed = l.style === "dashed" || l.kind === "auxiliaryLine";
      var opts = { className: dashed ? "mv-auxiliary-line" : "mv-segment", dashed: dashed };
      if (l.kind === "segment") { drawSegment(svg, from, to, mapper, opts); }
      else { drawLine(svg, from, to, mapper, bounds, opts); }
    });
    if (dbg && auxSkipped > 0) console.warn("[FunctionGraph] skipped " + auxSkipped + " invalid auxiliary lines");

    container.append(svg);
  }

  // --- Helper: collect drawable points from spec ---
  function collectDrawablePoints(spec) {
    var pts = [];
    var ptMap = spec.points || {};
    if (typeof ptMap === "object") {
      Object.keys(ptMap).forEach(function(id) {
        var p = ptMap[id];
        if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
          pts.push({ x: p.x, y: p.y, label: p.label || id });
        }
      });
    }
    (Array.isArray(spec.objects) ? spec.objects : []).forEach(function(o) {
      if (o && o.kind === "point" && Number.isFinite(o.x) && Number.isFinite(o.y)) {
        if (!pts.some(function(ep) { return Math.abs(ep.x - o.x) < 0.001 && Math.abs(ep.y - o.y) < 0.001; })) {
          pts.push({ x: o.x, y: o.y, label: o.label || o.id || "" });
        }
      }
    });
    return pts;
  }

  // --- Helper: nice step for grid spacing ---
  function niceStep(span) {
    var raw = span / 5;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var res = raw / mag;
    if (res <= 1.5) return mag;
    if (res <= 3) return 2 * mag;
    if (res <= 7) return 5 * mag;
    return 10 * mag;
  }

  // --- Render Graph Grid ---
  function renderGraphGrid(svg, mapper, bounds, xStep, yStep) {
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // Vertical grid lines
    var xStart = Math.ceil(bounds.minX / xStep) * xStep;
    for (var x = xStart; x <= bounds.maxX; x += xStep) {
      var proj = mapper.project({ x: x, y: 0 });
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", proj.x.toFixed(2));
      line.setAttribute("y1", "34");
      line.setAttribute("x2", proj.x.toFixed(2));
      line.setAttribute("y2", (mapper.height - 34).toFixed(2));
      line.setAttribute("class", "mv-grid-line");
      g.append(line);
    }
    // Horizontal grid lines
    var yStart = Math.ceil(bounds.minY / yStep) * yStep;
    for (var y = yStart; y <= bounds.maxY; y += yStep) {
      var proj = mapper.project({ x: 0, y: y });
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "34");
      line.setAttribute("y1", proj.y.toFixed(2));
      line.setAttribute("x2", (mapper.width - 34).toFixed(2));
      line.setAttribute("y2", proj.y.toFixed(2));
      line.setAttribute("class", "mv-grid-line");
      g.append(line);
    }
    svg.append(g);
  }

  // --- Render Graph Axes ---
  function renderGraphAxes(svg, mapper, bounds) {
    var origin = mapper.project({ x: 0, y: 0 });
    var ox = Math.max(34, Math.min(mapper.width - 34, origin.x));
    var oy = Math.max(34, Math.min(mapper.height - 34, origin.y));

    // X axis
    var xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", "34");
    xAxis.setAttribute("y1", oy.toFixed(2));
    xAxis.setAttribute("x2", (mapper.width - 34).toFixed(2));
    xAxis.setAttribute("y2", oy.toFixed(2));
    xAxis.setAttribute("class", "mv-axis");
    svg.append(xAxis);

    // Y axis
    var yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", ox.toFixed(2));
    yAxis.setAttribute("y1", "34");
    yAxis.setAttribute("x2", ox.toFixed(2));
    yAxis.setAttribute("y2", (mapper.height - 34).toFixed(2));
    yAxis.setAttribute("class", "mv-axis");
    svg.append(yAxis);

    // X arrow
    var xArr = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    var ax = mapper.width - 34, ay = oy;
    xArr.setAttribute("points", (ax - 8).toFixed(2) + "," + (ay - 4).toFixed(2) + " " + ax.toFixed(2) + "," + ay.toFixed(2) + " " + (ax - 8).toFixed(2) + "," + (ay + 4).toFixed(2));
    xArr.setAttribute("class", "mv-axis-arrow");
    svg.append(xArr);

    // Y arrow
    var yArr = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    var ax2 = ox, ay2 = 34;
    yArr.setAttribute("points", (ax2 - 4).toFixed(2) + "," + (ay2 + 8).toFixed(2) + " " + ax2.toFixed(2) + "," + ay2.toFixed(2) + " " + (ax2 + 4).toFixed(2) + "," + (ay2 + 8).toFixed(2));
    yArr.setAttribute("class", "mv-axis-arrow");
    svg.append(yArr);

    // Origin O
    var oText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    oText.setAttribute("x", (ox - 6).toFixed(2));
    oText.setAttribute("y", (oy + 14).toFixed(2));
    oText.setAttribute("class", "mv-axis-number");
    oText.textContent = "O";
    svg.append(oText);

    // X label
    var xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xLabel.setAttribute("x", (mapper.width - 30).toFixed(2));
    xLabel.setAttribute("y", (oy + 16).toFixed(2));
    xLabel.setAttribute("class", "mv-axis-number");
    xLabel.textContent = "x";
    svg.append(xLabel);

    // Y label
    var yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yLabel.setAttribute("x", (ox + 6).toFixed(2));
    yLabel.setAttribute("y", "30");
    yLabel.setAttribute("class", "mv-axis-number");
    yLabel.textContent = "y";
    svg.append(yLabel);
  }

  // --- Render Graph Ticks ---
  function renderGraphTicks(svg, mapper, bounds, xStep, yStep, showTicks, showNumbers) {
    var origin = mapper.project({ x: 0, y: 0 });
    var ox = Math.max(34, Math.min(mapper.width - 34, origin.x));
    var oy = Math.max(34, Math.min(mapper.height - 34, origin.y));

    // X ticks
    var xStart = Math.ceil(bounds.minX / xStep) * xStep;
    for (var x = xStart; x <= bounds.maxX; x += xStep) {
      if (Math.abs(x) < xStep * 0.01) continue; // skip origin
      var proj = mapper.project({ x: x, y: 0 });
      if (proj.x >= 34 && proj.x <= mapper.width - 34) {
        if (showTicks) {
          var tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
          tick.setAttribute("x1", proj.x.toFixed(2));
          tick.setAttribute("y1", (oy - 4).toFixed(2));
          tick.setAttribute("x2", proj.x.toFixed(2));
          tick.setAttribute("y2", (oy + 4).toFixed(2));
          tick.setAttribute("class", "mv-axis-tick");
          svg.append(tick);
        }
        if (showNumbers) {
          var num = document.createElementNS("http://www.w3.org/2000/svg", "text");
          num.setAttribute("x", proj.x.toFixed(2));
          num.setAttribute("y", (oy + 16).toFixed(2));
          num.setAttribute("text-anchor", "middle");
          num.setAttribute("class", "mv-axis-number");
          num.textContent = formatAxisNumber(x);
          svg.append(num);
        }
      }
    }

    // Y ticks
    var yStart = Math.ceil(bounds.minY / yStep) * yStep;
    for (var y = yStart; y <= bounds.maxY; y += yStep) {
      if (Math.abs(y) < yStep * 0.01) continue; // skip origin
      var proj = mapper.project({ x: 0, y: y });
      if (proj.y >= 34 && proj.y <= mapper.height - 34) {
        if (showTicks) {
          var tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
          tick.setAttribute("x1", (ox - 4).toFixed(2));
          tick.setAttribute("y1", proj.y.toFixed(2));
          tick.setAttribute("x2", (ox + 4).toFixed(2));
          tick.setAttribute("y2", proj.y.toFixed(2));
          tick.setAttribute("class", "mv-axis-tick");
          svg.append(tick);
        }
        if (showNumbers) {
          var num = document.createElementNS("http://www.w3.org/2000/svg", "text");
          num.setAttribute("x", (ox - 8).toFixed(2));
          num.setAttribute("y", (proj.y + 4).toFixed(2));
          num.setAttribute("text-anchor", "end");
          num.setAttribute("class", "mv-axis-number");
          num.textContent = formatAxisNumber(y);
          svg.append(num);
        }
      }
    }
  }

  function formatAxisNumber(v) {
    if (Math.abs(v) < 1e-9) return "0";
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return Number(v.toFixed(2)).toString();
  }  function renderEquationBalanceLegacy(container, spec) {
    const wrapper = createHtmlElement("div", "equation-balance-board");
    const left = createHtmlElement("div", "equation-side", "左边");
    const beam = createHtmlElement("div", "equation-balance-beam", "=");
    const right = createHtmlElement("div", "equation-side", "右边");
    const objects = Array.isArray(spec.objects) ? spec.objects : [];

    objects.slice(0, 10).forEach((object, index) => {
      const block = createHtmlElement(
        "span",
        "equation-block",
        object.label || object.value || object.id || `块 ${index + 1}`,
      );

      if (object.side === "right") {
        right.append(block);
      } else {
        left.append(block);
      }
    });

    wrapper.append(left, beam, right);
    container.append(wrapper);
  }


  function renderEquationBalance(container, spec) {
    // Prefer leftTerms/rightTerms; fallback to equation splitting; then objects
    function eqSplit(eqStr) {
      if (!eqStr || typeof eqStr !== "string") return { left: [], right: [] };
      var parts = eqStr.split("=");
      if (parts.length < 2) return { left: [], right: [] };
      var left = parts[0].replace(/\s+/g, "");
      var right = parts[parts.length - 1].replace(/\s+/g, "");
      return {
        left: left.match(/[+\-]?[^+\-]+/g) || [left],
        right: right.match(/[+\-]?[^+\-]+/g) || [right],
      };
    }

    var leftTerms = Array.isArray(spec.leftTerms) && spec.leftTerms.length ? spec.leftTerms : null;
    var rightTerms = Array.isArray(spec.rightTerms) && spec.rightTerms.length ? spec.rightTerms : null;

    if (!leftTerms || !rightTerms) {
      var eqSides = eqSplit(spec.equation);
      if (!leftTerms && eqSides.left.length) leftTerms = eqSides.left;
      if (!rightTerms && eqSides.right.length) rightTerms = eqSides.right;
    }

    if (!leftTerms || !rightTerms) {
      var objs = Array.isArray(spec.objects) ? spec.objects : [];
      leftTerms = leftTerms || objs.filter(function(o) { return o && o.side !== "right"; }).map(function(o) { return o.label || o.id || ""; });
      rightTerms = rightTerms || objs.filter(function(o) { return o && o.side === "right"; }).map(function(o) { return o.label || o.id || ""; });
    }

    if (!leftTerms || !leftTerms.length || !rightTerms || !rightTerms.length) {
      renderEmpty(container, "暂无可靠方程图示，可查看文字解析。");
      return;
    }

    var steps = Array.isArray(spec.steps) ? spec.steps : [];
    var flow = createHtmlElement("div", "equation-balance-flow");

    // Helper: build one term card
    function termCard(term) {
      var span = createHtmlElement("span", "equation-block");
      span.textContent = term || "";
      return span;
    }

    // Helper: build one row: left terms | = | right terms
    function buildRow(leftList, rightList) {
      var row = createHtmlElement("div", "equation-row");
      var leftSide = createHtmlElement("div", "equation-side");
      (leftList || []).forEach(function(t) { leftSide.append(termCard(t)); });
      if (!leftSide.children.length) leftSide.textContent = "\u2014";
      var eqSign = createHtmlElement("div", "equation-balance-beam", "=");
      var rightSide = createHtmlElement("div", "equation-side");
      (rightList || []).forEach(function(t) { rightSide.append(termCard(t)); });
      if (!rightSide.children.length) rightSide.textContent = "\u2014";
      row.append(leftSide, eqSign, rightSide);
      return row;
    }

    // Step 0: original equation
    var step0 = createHtmlElement("article", "equation-balance-step");
    var h4 = createHtmlElement("h4", "", "原式");
    step0.append(h4, buildRow(leftTerms, rightTerms));
    flow.append(step0);

    // Step N: each transformation
    steps.forEach(function(step, i) {
      var art = createHtmlElement("article", "equation-balance-step");
      var label = createHtmlElement("h4", "", (i + 1) + ". " + (step.label || step.stepTitle || "步骤 " + (i + 1)));
      art.append(label);

      var slt = Array.isArray(step.leftTerms) ? step.leftTerms : [];
      var srt = Array.isArray(step.rightTerms) ? step.rightTerms : [];
      if ((!slt.length || !srt.length) && step.equation) {
        var ss = eqSplit(step.equation);
        if (!slt.length) slt = ss.left;
        if (!srt.length) srt = ss.right;
      }
      art.append(buildRow(slt, srt));
      flow.append(art);
    });

    container.append(flow);
  }
  function renderNumberLine(container, spec) {
    const values = spec.objects
      .map((object) => Number(object.value ?? object.x))
      .filter(Number.isFinite);

    if (!values.length) {
      renderEmpty(container, "暂无可靠图示，可查看文字解析。");
      return;
    }

    const min = Math.min(...values, -5);
    const max = Math.max(...values, 5);
    const mapper = createMapper({ minX: min, maxX: max, minY: -1, maxY: 1 });
    const svg = createBaseSvg("math-visualization-svg number-line-svg");
    drawSegment(svg, { x: min, y: 0 }, { x: max, y: 0 }, mapper, { className: "mv-axis" });

    values.forEach((value) => {
      drawPoint(svg, { x: value, y: 0, id: String(value), label: String(value) }, mapper);
    });

    container.append(svg);
  }

  function getDynamicSliderConfig(spec) {
    const slider =
      spec.objects.find((object) => object.kind === "slider") ||
      spec.slider ||
      {};
    const min = toNumber(slider.min) ?? 0;
    const max = toNumber(slider.max) ?? 1;
    const value = toNumber(slider.value) ?? min;

    return {
      min,
      max: max > min ? max : min + 1,
      step: 0.001,
      value: Math.min(Math.max(value, min), max > min ? max : min + 1),
      label: slider.label || slider.id || "t",
    };
  }

  function getDynamicPathPoints(spec) {
    const dynamicObject = spec.objects.find((object) =>
      ["dynamicPoint", "trajectory", "path"].includes(object.kind) || object.role === "dynamic",
    );
    const explicitIds = dynamicObject ? getObjectPointIds(dynamicObject) : [];

    if (explicitIds.length >= 2) {
      const first = getPoint(spec, explicitIds[0]);
      const second = getPoint(spec, explicitIds[1]);

      if (first && second) {
        return [first, second];
      }
    }

    const segment = spec.objects.find((object) =>
      ["segment", "auxiliaryLine"].includes(object.kind) &&
      getObjectPointIds(object).every((id) => getPoint(spec, id)),
    );

    if (!segment) {
      return [];
    }

    return getObjectPointIds(segment).map((id) => getPoint(spec, id));
  }

  function drawCanvasLine(context, mapper, p1, p2, options = {}) {
    const start = mapper.project(p1);
    const end = mapper.project(p2);
    context.save();
    context.strokeStyle = options.color || "#2563eb";
    context.lineWidth = options.width || 2;
    context.setLineDash(options.dashed ? [8, 7] : []);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.restore();
  }

  function drawCanvasPoint(context, mapper, point, options = {}) {
    const projected = mapper.project(point);
    context.save();
    context.fillStyle = options.color || "#1d4ed8";
    context.beginPath();
    context.arc(projected.x, projected.y, options.radius || 4, 0, Math.PI * 2);
    context.fill();
    context.font = "13px sans-serif";
    context.fillStyle = "#1e293b";
    context.fillText(point.label || point.id || "", projected.x + 9, projected.y - 9);
    context.restore();
  }

  function renderDynamicPoint(container, spec) {
    const validation = validateGeometrySpec({
      ...spec,
      type: "geometry",
      confidence: spec.confidence || "medium",
    });

    if (!validation.valid) {
      renderEmpty(container, "暂无可靠动态图示，可查看文字解析。");
      return;
    }

    const pathPoints = getDynamicPathPoints(spec);

    if (pathPoints.length < 2) {
      renderEmpty(container, "暂无可靠动态图示，可查看文字解析。");
      return;
    }

    const wrapper = createHtmlElement("div", "dynamic-point-board");
    const canvas = document.createElement("canvas");
    canvas.className = "dynamic-point-canvas";
    canvas.width = 720;
    canvas.height = 420;
    const controls = createHtmlElement("div", "dynamic-point-controls");
    const slider = document.createElement("input");
    const status = createHtmlElement("p", "dynamic-point-status");
    const config = getDynamicSliderConfig(spec);
    const allPoints = Object.values(spec.points);
    const bounds = getBounds(allPoints, 0.25);
    const mapper = createMapper(bounds, canvas.width, canvas.height);
    let pendingFrame = 0;

    slider.type = "range";
    slider.min = String(config.min);
    slider.max = String(config.max);
    slider.step = String(config.step);
    slider.value = String(config.value);
    slider.setAttribute("aria-label", `${config.label} 参数滑块`);

    controls.append(slider, status);
    wrapper.append(canvas, controls);
    container.append(wrapper);

    const context = canvas.getContext("2d");

    if (!context) {
      renderEmpty(container, "暂无可靠动态图示，可查看文字解析。");
      return;
    }

    function draw() {
      pendingFrame = 0;
      const rawValue = Number(slider.value);
      const t = (rawValue - config.min) / (config.max - config.min);
      const clampedT = Math.min(Math.max(t, 0), 1);
      const movingPoint = {
        id: "M",
        label: "M",
        x: pathPoints[0].x + (pathPoints[1].x - pathPoints[0].x) * clampedT,
        y: pathPoints[0].y + (pathPoints[1].y - pathPoints[0].y) * clampedT,
      };
      const snapTarget = (Array.isArray(spec.snapTargets) ? spec.snapTargets : []).find((target) => {
        const targetValue = toNumber(target.value);
        return targetValue !== null && Math.abs(targetValue - rawValue) <= config.step * 4;
      });

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#f8fafc";
      context.fillRect(0, 0, canvas.width, canvas.height);

      var views = getViews(spec);
      getVisibleObjects(spec, views[0]).forEach((object) => {
        if (!["segment", "auxiliaryLine"].includes(object.kind)) {
          return;
        }

        const [fromId, toId] = getObjectPointIds(object);
        const from = getPoint(spec, fromId);
        const to = getPoint(spec, toId);

        if (from && to) {
          drawCanvasLine(context, mapper, from, to, {
            dashed: object.kind === "auxiliaryLine" || object.role === "auxiliary",
            color: object.role === "highlight" ? "#f59e0b" : "#2563eb",
          });
        }
      });

      Object.values(spec.points).forEach((point) => drawCanvasPoint(context, mapper, point));
      drawCanvasPoint(context, mapper, movingPoint, {
        color: snapTarget ? "#f59e0b" : "#16a34a",
        radius: snapTarget ? 6 : 5,
      });

      status.textContent = snapTarget
        ? `${config.label} = ${rawValue.toFixed(3)}，已靠近关键位置：${snapTarget.label || snapTarget.id || "目标"}`
        : `${config.label} = ${rawValue.toFixed(3)}，拖动滑块观察动点变化。`;
    }

    function scheduleDraw() {
      if (!pendingFrame) {
        pendingFrame = requestAnimationFrame(draw);
      }
    }

    slider.addEventListener("input", scheduleDraw);
    scheduleDraw();
  }

  function renderStepControls(container, spec) {
    const steps = Array.isArray(spec.steps) ? spec.steps : [];

    if (!steps.length) {
      return;
    }

    const list = createHtmlElement("ol", "visualization-step-list");
    steps.forEach((step) => {
      const item = createHtmlElement("li", "", "");
      const title = createHtmlElement("strong", "", step.stepTitle || "图示步骤");
      const description = createHtmlElement("p", "", step.explanation || "");
      item.append(title, description);
      list.append(item);
    });
    container.append(list);
  }

  function renderEmpty(container, message = "暂无可靠图示，可查看文字解析。", imageUrl) {
    if (imageUrl) { var img = document.createElement("img"); img.src = imageUrl; img.alt = "上传的题目原图"; img.className = "visualization-fallback-image"; container.append(img); return; }
    container.append(createHtmlElement("p", "visualization-empty", message));
  }

  function renderVisualization(container, rawSpec, options = {}) {
    container.replaceChildren();

    try {
      const spec = normalizeVisualizationSpec(rawSpec);

      if (!spec || spec.type === "none" || !SAFE_TYPES.has(spec.type)) {
        renderEmpty(container, spec?.description || "暂无可靠图示，可查看文字解析。", options && options.uploadedImageUrl ? options.uploadedImageUrl : null);
        return;
      }

      const title = createHtmlElement("h3", "visualization-title", spec.title || "图示讲解");
      const description = createHtmlElement("p", "visualization-description", spec.description || "");
      const board = createHtmlElement("div", "visualization-board");
      container.append(title, description, board);

      if (spec.type === "function_graph") {
        renderFunctionGraph(board, spec, options);
      } else if (spec.type === "geometry") {
        var geomOptions = Object.assign({}, options || {}, { showGrid: false });
        renderGeometry(board, spec, geomOptions);
      } else if (["dynamic_point", "trajectory", "max_value"].includes(spec.type)) {
        renderDynamicPoint(board, spec);
      } else if (spec.type === "equation_balance") {
        renderEquationBalance(board, spec);
      } else if (spec.type === "number_line") {
        renderNumberLine(board, spec);
      }

      renderStepControls(container, spec);
    } catch (error) {
      if (typeof localStorage !== "undefined" && localStorage.getItem("mathAiEduDebug") === "1") {
        console.error("[MathVisualization] render failed:", error && error.message ? error.message : error);
      }
      container.replaceChildren();
      renderEmpty(container, "暂无可靠图示，可查看文字解析。", options && options.uploadedImageUrl);
    }
  }

  function renderView(container, rawSpec, viewId, extraOptions) {
    renderVisualization(container, rawSpec, Object.assign({ viewId: viewId }, extraOptions || {}));
  }

  global.MathVisualization = {
    render: renderVisualization,
    renderVisualization,
    renderView,
    normalizeVisualizationSpec,
    validateGeometrySpec,
    renderGeometry,
    renderGeometryView,
    renderEquationBalance,
    renderFunctionGraph,
    renderDynamicPoint,
    getBounds,
    projectPoint,
    drawPoint,
    drawSegment,
    drawLine,
    drawCircle,
    drawAngle,
    drawRightAngle,
    drawLabel,
    distance,
    midpoint,
    lineIntersection,
    circleLineIntersection,
    rotatePoints,
    flipYIfNeeded,
    normalizeToBaseline,
    getAngleBisectorDirection,
    getLabelOffsetDirection,
  };
})(window);
