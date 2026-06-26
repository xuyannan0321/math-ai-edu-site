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

    return {
      type: spec.type,
      title: spec.title || "图示讲解",
      description: spec.description || "",
      confidence: spec.confidence || "medium",
      orientation: spec.orientation || {},
      points: normalizePointMap(spec),
      objects: Array.isArray(spec.objects) ? spec.objects : [],
      views: Array.isArray(spec.views) ? spec.views : [],
      steps: Array.isArray(spec.steps) ? spec.steps : [],
    };
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

  function renderGeometryView(svg, spec, view, mapper, bounds) {
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

    const views = spec.views.length ? spec.views : [{ id: "original", title: "原题图" }];
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
      renderGeometryView(svg, spec, view, mapper, bounds);
      viewCard.append(viewTitle, svg);
      wrapper.append(viewCard);
    });

    container.append(wrapper);
  }

  function renderAxes(svg, mapper, bounds) {
    const zeroY = Math.min(Math.max(0, bounds.minY), bounds.maxY);
    const zeroX = Math.min(Math.max(0, bounds.minX), bounds.maxX);
    const xStart = mapper.project({ x: bounds.minX, y: zeroY });
    const xEnd = mapper.project({ x: bounds.maxX, y: zeroY });
    const yStart = mapper.project({ x: zeroX, y: bounds.minY });
    const yEnd = mapper.project({ x: zeroX, y: bounds.maxY });

    svg.append(
      createSvgElement("defs", {}),
      createSvgElement("line", {
        x1: xStart.x,
        y1: xStart.y,
        x2: xEnd.x,
        y2: xEnd.y,
        class: "mv-axis",
        "marker-end": "url(#axis-arrow)",
      }),
      createSvgElement("line", {
        x1: yStart.x,
        y1: yStart.y,
        x2: yEnd.x,
        y2: yEnd.y,
        class: "mv-axis",
        "marker-end": "url(#axis-arrow)",
      }),
    );

    const marker = createSvgElement("marker", {
      id: "axis-arrow",
      markerWidth: 8,
      markerHeight: 8,
      refX: 7,
      refY: 4,
      orient: "auto",
      markerUnits: "strokeWidth",
    });
    marker.append(createSvgElement("path", { d: "M0,0 L8,4 L0,8 Z", class: "mv-axis-arrow" }));
    svg.querySelector("defs").append(marker);

    drawLabel(svg, { ...bounds, x: bounds.maxX, y: zeroY, id: "x-axis" }, "x", mapper, { direction: { x: -1, y: -1 }, className: "mv-axis-label" });
    drawLabel(svg, { ...bounds, x: zeroX, y: bounds.maxY, id: "y-axis" }, "y", mapper, { direction: { x: 1, y: 1 }, className: "mv-axis-label" });
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

  function renderFunctionGraph(container, spec) {
    const functionObjects = spec.objects.filter((object) => object.kind === "function");

    if (!functionObjects.length) {
      renderEmpty(container, "暂无可靠图示，可查看文字解析。");
      return;
    }

    const bounds = { minX: -5, maxX: 5, minY: -5, maxY: 5 };
    const mapper = createMapper(bounds);
    const svg = createBaseSvg("math-visualization-svg function-svg");
    renderAxes(svg, mapper, bounds);

    functionObjects.forEach((object) => {
      const evaluate = parsePolynomialExpression(object.expression);
      if (!evaluate) return;

      const range = Array.isArray(object.range) && object.range.length >= 2 ? object.range : [bounds.minX, bounds.maxX];
      const min = Math.max(bounds.minX, Number(range[0]));
      const max = Math.min(bounds.maxX, Number(range[1]));
      const samples = [];

      for (let index = 0; index <= 100; index += 1) {
        const x = min + ((max - min) * index) / 100;
        const y = evaluate(x);

        if (Number.isFinite(y) && y >= bounds.minY - 8 && y <= bounds.maxY + 8) {
          const projected = mapper.project({ x, y });
          samples.push(`${projected.x.toFixed(2)},${projected.y.toFixed(2)}`);
        }
      }

      if (samples.length > 1) {
        svg.append(
          createSvgElement("polyline", {
            points: samples.join(" "),
            class: "mv-function",
            "data-object-id": object.id,
          }),
        );
      }
    });

    container.append(svg);
  }

  function renderEquationBalanceLegacy(container, spec) {
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
    const objects = Array.isArray(spec.objects) ? spec.objects.slice(0, 10) : [];
    const svg = createBaseSvg("math-visualization-svg equation-balance-svg");
    const leftObjects = objects.filter((object) => object.side !== "right");
    const rightObjects = objects.filter((object) => object.side === "right");

    function drawSide(items, startX, label) {
      const labelText = createSvgElement("text", {
        x: startX,
        y: 70,
        class: "mv-equation-label",
      });
      labelText.textContent = label;
      svg.append(labelText);

      if (!items.length) {
        const emptyText = createSvgElement("text", {
          x: startX,
          y: 170,
          class: "mv-equation-term",
        });
        emptyText.textContent = "—";
        svg.append(emptyText);
        return;
      }

      items.forEach((object, index) => {
        const x = startX + (index % 3) * 78;
        const y = 120 + Math.floor(index / 3) * 66;
        svg.append(
          createSvgElement("rect", {
            x,
            y,
            width: 64,
            height: 38,
            rx: 10,
            class: "mv-equation-block",
          }),
        );
        const text = createSvgElement("text", {
          x: x + 32,
          y: y + 24,
          class: "mv-equation-term",
          "text-anchor": "middle",
        });
        text.textContent = object.label || object.value || object.id || `项${index + 1}`;
        svg.append(text);
      });
    }

    svg.append(
      createSvgElement("line", {
        x1: 80,
        y1: 265,
        x2: 480,
        y2: 265,
        class: "mv-segment",
      }),
      createSvgElement("circle", {
        cx: 280,
        cy: 265,
        r: 8,
        class: "mv-point",
      }),
    );

    const equal = createSvgElement("text", {
      x: 280,
      y: 178,
      class: "mv-equation-equal",
      "text-anchor": "middle",
    });
    equal.textContent = "=";
    svg.append(equal);
    drawSide(leftObjects, 86, "左边");
    drawSide(rightObjects, 330, "右边");
    container.append(svg);
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

      getVisibleObjects(spec, spec.views[0]).forEach((object) => {
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
        renderFunctionGraph(board, spec);
      } else if (spec.type === "geometry") {
        renderGeometry(board, spec, options);
      } else if (["dynamic_point", "trajectory", "max_value"].includes(spec.type)) {
        renderDynamicPoint(board, spec);
      } else if (spec.type === "equation_balance") {
        renderEquationBalance(board, spec);
      } else if (spec.type === "number_line") {
        renderNumberLine(board, spec);
      }

      renderStepControls(container, spec);
    } catch {
      container.replaceChildren();
      renderEmpty(container, "暂无可靠图示，可查看文字解析。");
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
