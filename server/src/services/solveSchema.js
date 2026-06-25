const REQUIRED_CONFIDENCE_VALUES = new Set(["low", "medium", "high"]);
const VISUALIZATION_TYPES = new Set([
  "equation_balance",
  "function_graph",
  "geometry",
  "dynamic_point",
  "number_line",
  "none",
]);
const VISUALIZATION_OBJECT_KINDS = new Set([
  "point",
  "line",
  "segment",
  "circle",
  "angle",
  "polygon",
  "function",
  "axis",
  "label",
  "auxiliaryLine",
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

      if (!step || typeof step !== "object") {
        return null;
      }

      return {
        title: asString(step.title, `步骤 ${index + 1}`),
        content: asString(step.content || step.explanation || step.text),
      };
    })
    .filter((step) => step && step.content);
}

function normalizeQualityCheck(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const confidence = REQUIRED_CONFIDENCE_VALUES.has(source.confidence)
    ? source.confidence
    : "medium";

  return {
    checked: source.checked === undefined ? true : Boolean(source.checked),
    confidence,
    issues: asStringArray(source.issues),
  };
}

function normalizeVisualizationObject(object) {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    return null;
  }

  const kind = asString(object.kind || object.type);

  if (!VISUALIZATION_OBJECT_KINDS.has(kind)) {
    return null;
  }

  return {
    ...object,
    kind,
    id: asString(object.id || object.label || `${kind}-${Math.random().toString(36).slice(2, 8)}`),
    label: asString(object.label || object.id || ""),
  };
}

function normalizeVisualizationStep(step, index) {
  if (!step || typeof step !== "object" || Array.isArray(step)) {
    return null;
  }

  return {
    stepTitle: asString(step.stepTitle || step.title, `图示步骤 ${index + 1}`),
    highlightObjects: asStringArray(step.highlightObjects),
    explanation: asString(step.explanation || step.content),
    action: asString(step.action, "highlight"),
  };
}

function normalizeVisualizationSpec(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : null;

  if (!source) {
    return null;
  }

  const type = VISUALIZATION_TYPES.has(source.type) ? source.type : "none";

  if (type === "none") {
    return {
      type: "none",
      title: asString(source.title, "暂无图示"),
      description: asString(source.description, "当前题目暂无可靠图示数据。"),
      objects: [],
      steps: [],
    };
  }

  const objects = Array.isArray(source.objects)
    ? source.objects.map(normalizeVisualizationObject).filter(Boolean)
    : [];
  const steps = Array.isArray(source.steps)
    ? source.steps.map(normalizeVisualizationStep).filter(Boolean)
    : [];

  if (!objects.length) {
    return {
      type: "none",
      title: "暂无图示",
      description: "当前题目暂无可靠图示数据。",
      objects: [],
      steps: [],
    };
  }

  return {
    type,
    title: asString(source.title, "图示讲解"),
    description: asString(source.description),
    objects,
    steps,
  };
}

function normalizeSolution(raw, fallback = {}) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const problemText = asString(source.problemText, fallback.questionText || "");
  const steps = normalizeSteps(source.steps);
  const knowledgePoints = asStringArray(source.knowledgePoints);
  const commonMistakes = asStringArray(source.commonMistakes);

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
    finalAnswer: asString(source.finalAnswer, "条件不足，暂不能确定唯一答案。"),
    commonMistakes: commonMistakes.length ? commonMistakes : ["不要只抄最终答案，要核对每一步依据。"],
    verification: asString(source.verification, "请将答案代回原题条件进行检查。"),
    visualizationSpec: normalizeVisualizationSpec(source.visualizationSpec),
    qualityCheck: normalizeQualityCheck(source.qualityCheck),
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
};
