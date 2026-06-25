"use strict";

(function initializeMathVisualization(global) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SAFE_TYPES = new Set([
    "equation_balance",
    "function_graph",
    "geometry",
    "dynamic_point",
    "number_line",
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

  function getObjects(spec) {
    return Array.isArray(spec?.objects) ? spec.objects : [];
  }

  function findObject(objects, id) {
    return objects.find((object) => object.id === id || object.label === id) || null;
  }

  function getPoint(objects, id) {
    const object = findObject(objects, id);

    if (!object || object.kind !== "point") {
      return null;
    }

    const x = Number(object.x);
    const y = Number(object.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return {
      id: object.id,
      label: object.label || object.id,
      x,
      y,
    };
  }

  function getBounds(points) {
    if (!points.length) {
      return { minX: -5, maxX: 5, minY: -5, maxY: 5 };
    }

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const paddingX = Math.max(1, (maxX - minX) * 0.18);
    const paddingY = Math.max(1, (maxY - minY) * 0.18);

    return {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY,
    };
  }

  function createMapper(bounds, width = 560, height = 320) {
    const spanX = Math.max(1, bounds.maxX - bounds.minX);
    const spanY = Math.max(1, bounds.maxY - bounds.minY);
    const padding = 36;

    return {
      width,
      height,
      x(value) {
        return padding + ((value - bounds.minX) / spanX) * (width - padding * 2);
      },
      y(value) {
        return height - padding - ((value - bounds.minY) / spanY) * (height - padding * 2);
      },
    };
  }

  function appendLabel(svg, mapper, point, offsetX = 8, offsetY = -8) {
    if (!point.label) {
      return;
    }

    svg.append(
      createSvgElement("text", {
        x: mapper.x(point.x) + offsetX,
        y: mapper.y(point.y) + offsetY,
        class: "mv-label",
      }),
    );
    svg.lastChild.textContent = point.label;
  }

  function renderAxes(svg, mapper, bounds) {
    const zeroY = Math.min(Math.max(0, bounds.minY), bounds.maxY);
    const zeroX = Math.min(Math.max(0, bounds.minX), bounds.maxX);

    svg.append(
      createSvgElement("line", {
        x1: mapper.x(bounds.minX),
        y1: mapper.y(zeroY),
        x2: mapper.x(bounds.maxX),
        y2: mapper.y(zeroY),
        class: "mv-axis",
      }),
      createSvgElement("line", {
        x1: mapper.x(zeroX),
        y1: mapper.y(bounds.minY),
        x2: mapper.x(zeroX),
        y2: mapper.y(bounds.maxY),
        class: "mv-axis",
      }),
    );

    const xLabel = createSvgElement("text", {
      x: mapper.x(bounds.maxX) - 12,
      y: mapper.y(zeroY) - 8,
      class: "mv-axis-label",
    });
    xLabel.textContent = "x";
    const yLabel = createSvgElement("text", {
      x: mapper.x(zeroX) + 8,
      y: mapper.y(bounds.maxY) + 14,
      class: "mv-axis-label",
    });
    yLabel.textContent = "y";
    svg.append(xLabel, yLabel);
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

      if (raw === "" || raw === "+") {
        return 1;
      }

      if (raw === "-") {
        return -1;
      }

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

  function createBaseSvg() {
    return createSvgElement("svg", {
      viewBox: "0 0 560 320",
      role: "img",
      class: "math-visualization-svg",
    });
  }

  function renderGeometry(container, spec, dynamic = false) {
    const objects = getObjects(spec);
    const points = objects
      .filter((object) => object.kind === "point")
      .map((object) => getPoint(objects, object.id))
      .filter(Boolean);
    const bounds = getBounds(points);
    const mapper = createMapper(bounds);
    const svg = createBaseSvg();

    objects.forEach((object) => {
      if (object.kind === "segment") {
        const from = getPoint(objects, object.from);
        const to = getPoint(objects, object.to);

        if (from && to) {
          svg.append(
            createSvgElement("line", {
              x1: mapper.x(from.x),
              y1: mapper.y(from.y),
              x2: mapper.x(to.x),
              y2: mapper.y(to.y),
              class: "mv-segment",
              "data-object-id": object.id,
            }),
          );
        }
      } else if (object.kind === "line" || object.kind === "auxiliaryLine") {
        const through = Array.isArray(object.through) ? object.through : [];
        const first = getPoint(objects, through[0]);
        const second = getPoint(objects, through[1]);

        if (first && second) {
          svg.append(
            createSvgElement("line", {
              x1: mapper.x(first.x),
              y1: mapper.y(first.y),
              x2: mapper.x(second.x),
              y2: mapper.y(second.y),
              class: object.kind === "auxiliaryLine" ? "mv-auxiliary" : "mv-line",
              "data-object-id": object.id,
            }),
          );
        }
      } else if (object.kind === "circle") {
        const center = getPoint(objects, object.center);
        const radius = Number(object.radius);

        if (center && Number.isFinite(radius) && radius > 0) {
          svg.append(
            createSvgElement("circle", {
              cx: mapper.x(center.x),
              cy: mapper.y(center.y),
              r: Math.abs(mapper.x(center.x + radius) - mapper.x(center.x)),
              class: "mv-circle",
              "data-object-id": object.id,
            }),
          );
        }
      }
    });

    points.forEach((point) => {
      svg.append(
        createSvgElement("circle", {
          cx: mapper.x(point.x),
          cy: mapper.y(point.y),
          r: dynamic ? 5 : 4,
          class: dynamic ? "mv-point mv-point-dynamic" : "mv-point",
          "data-object-id": point.id,
        }),
      );
      appendLabel(svg, mapper, point);
    });

    container.append(svg);

    if (dynamic && points.length >= 2) {
      animateBetweenPoints(svg, mapper, points[0], points[1]);
    }
  }

  function animateBetweenPoints(svg, mapper, start, end) {
    const point = svg.querySelector(".mv-point-dynamic");

    if (!point) {
      return;
    }

    let startTime = null;

    function frame(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = ((timestamp - startTime) % 2600) / 2600;
      const t = progress <= 0.5 ? progress * 2 : (1 - progress) * 2;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      point.setAttribute("cx", mapper.x(x));
      point.setAttribute("cy", mapper.y(y));
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function renderFunctionGraph(container, spec) {
    const objects = getObjects(spec);
    const keyPoints = objects
      .flatMap((object) => (Array.isArray(object.points) ? object.points : []))
      .filter((point) => Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)))
      .map((point) => ({ ...point, x: Number(point.x), y: Number(point.y), label: point.label || "" }));
    const bounds = getBounds(keyPoints.length ? keyPoints : [{ x: -5, y: -5 }, { x: 5, y: 5 }]);
    bounds.minX = Math.min(bounds.minX, -5);
    bounds.maxX = Math.max(bounds.maxX, 5);
    bounds.minY = Math.min(bounds.minY, -5);
    bounds.maxY = Math.max(bounds.maxY, 5);

    const mapper = createMapper(bounds);
    const svg = createBaseSvg();
    renderAxes(svg, mapper, bounds);

    objects
      .filter((object) => object.kind === "function")
      .forEach((object) => {
        const evaluate = parsePolynomialExpression(object.expression);

        if (!evaluate) {
          return;
        }

        const samples = [];
        const min = Array.isArray(object.range) && Number.isFinite(Number(object.range[0]))
          ? Number(object.range[0])
          : bounds.minX;
        const max = Array.isArray(object.range) && Number.isFinite(Number(object.range[1]))
          ? Number(object.range[1])
          : bounds.maxX;

        for (let index = 0; index <= 80; index += 1) {
          const x = min + ((max - min) * index) / 80;
          const y = evaluate(x);

          if (Number.isFinite(y) && y >= bounds.minY - 5 && y <= bounds.maxY + 5) {
            samples.push(`${mapper.x(x).toFixed(2)},${mapper.y(y).toFixed(2)}`);
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

    keyPoints.forEach((point) => {
      svg.append(
        createSvgElement("circle", {
          cx: mapper.x(point.x),
          cy: mapper.y(point.y),
          r: 4,
          class: "mv-point mv-key-point",
        }),
      );
      appendLabel(svg, mapper, point);
    });

    container.append(svg);
  }

  function renderEquationBalance(container, spec) {
    const wrapper = createHtmlElement("div", "equation-balance-board");
    const left = createHtmlElement("div", "equation-side", "左边");
    const beam = createHtmlElement("div", "equation-balance-beam", "=");
    const right = createHtmlElement("div", "equation-side", "右边");
    const objects = getObjects(spec);

    objects.slice(0, 8).forEach((object, index) => {
      const block = createHtmlElement(
        "span",
        "equation-block",
        object.label || object.value || object.id || `块 ${index + 1}`,
      );
      (index % 2 === 0 ? left : right).append(block);
    });

    wrapper.append(left, beam, right);
    container.append(wrapper);
  }

  function renderNumberLine(container, spec) {
    const objects = getObjects(spec);
    const values = objects
      .map((object) => Number(object.value ?? object.x))
      .filter(Number.isFinite);
    const min = values.length ? Math.min(...values, -5) : -5;
    const max = values.length ? Math.max(...values, 5) : 5;
    const svg = createBaseSvg();
    const mapper = createMapper({ minX: min, maxX: max, minY: -1, maxY: 1 });

    svg.append(
      createSvgElement("line", {
        x1: mapper.x(min),
        y1: 160,
        x2: mapper.x(max),
        y2: 160,
        class: "mv-axis",
      }),
    );

    values.forEach((value) => {
      svg.append(
        createSvgElement("circle", {
          cx: mapper.x(value),
          cy: 160,
          r: 5,
          class: "mv-point",
        }),
      );
    });

    container.append(svg);
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

  function render(container, spec) {
    container.replaceChildren();

    if (!spec || spec.type === "none" || !SAFE_TYPES.has(spec.type)) {
      container.append(
        createHtmlElement(
          "p",
          "visualization-empty",
          spec?.description || "暂无图示",
        ),
      );
      return;
    }

    const title = createHtmlElement("h3", "visualization-title", spec.title || "图示讲解");
    const description = createHtmlElement("p", "visualization-description", spec.description || "");
    const board = createHtmlElement("div", "visualization-board");
    container.append(title, description, board);

    if (spec.type === "function_graph") {
      renderFunctionGraph(board, spec);
    } else if (spec.type === "geometry") {
      renderGeometry(board, spec);
    } else if (spec.type === "dynamic_point") {
      renderGeometry(board, spec, true);
    } else if (spec.type === "equation_balance") {
      renderEquationBalance(board, spec);
    } else if (spec.type === "number_line") {
      renderNumberLine(board, spec);
    }

    renderStepControls(container, spec);
  }

  global.MathVisualization = {
    render,
  };
})(window);
