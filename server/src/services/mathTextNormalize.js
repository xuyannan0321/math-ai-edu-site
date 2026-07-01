"use strict";

function asText(value) {
  return String(value || "");
}

function normalizeBasicPunctuation(text) {
  return asText(text)
    .replace(/\u2212/g, "-")
    .replace(/≅/g, "≌")
    .replace(/＝/g, "=")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/，/g, "，");
}

function normalizeTriangleSymbols(text) {
  return text
    .replace(/\\triangle\s*([A-Z]{3})/gi, "△$1")
    .replace(/(?:三角形|triangle)\s*([A-Z]{3})/gi, "△$1")
    .replace(/[△▵▲∆Δ]\s*([A-Z]{3})/g, "△$1");
}

function normalizeAngleSymbols(text) {
  return text
    .replace(/(?:∠|角|angle|<)\s*([A-Z]{1,4})/gi, "∠$1");
}

function normalizeLineRelations(text) {
  return text
    .replace(/(?:直线)?([A-Z]{2})\s*(?:∥|\|\||\/\/|平行于?|平行)\s*(?:直线)?([A-Z]{2})/g, "$1 ∥ $2")
    .replace(/(?:直线)?([A-Z]{2})\s*(?:与|和)\s*(?:直线)?([A-Z]{2})\s*平行/g, "$1 ∥ $2")
    .replace(/(?:直线)?([A-Z]{2})\s*(?:⟂|⊥|垂直于?|垂直)\s*(?:直线)?([A-Z]{2})/g, "$1 ⊥ $2")
    .replace(/(?:直线)?([A-Z]{2})\s*(?:与|和)\s*(?:直线)?([A-Z]{2})\s*垂直/g, "$1 ⊥ $2");
}

function normalizeEqualRelations(text) {
  const objectPattern = "(?:∠[A-Z]{1,4}|△[A-Z]{3}|[A-Z]{1,3})";
  const equalsPattern = new RegExp(`(${objectPattern})\\s*(?:等于|相等于?)\\s*(${objectPattern})`, "g");
  const pairedEqualsPattern = new RegExp(`(${objectPattern})\\s*(?:与|和)\\s*(${objectPattern})\\s*相等`, "g");

  return text
    .replace(equalsPattern, "$1=$2")
    .replace(pairedEqualsPattern, "$1=$2");
}

function normalizeCircleAndArcSymbols(text) {
  return text
    .replace(/⊙\s*([A-Z])/g, "⊙$1")
    .replace(/圆心为\s*([A-Z])\s*的圆/g, "⊙$1")
    .replace(/以\s*([A-Z])\s*为圆心/g, "以 ⊙$1 为圆心")
    .replace(/圆心\s*([A-Z])/g, "圆心 ⊙$1")
    .replace(/圆\s*([A-Z])/g, "⊙$1")
    .replace(/([A-Z])\s*在\s*(⊙[A-Z])\s*上/g, "$1 在 $2 上")
    .replace(/([A-Z])\s*(?:是|为)\s*(⊙[A-Z])\s*上(?:的)?一?点/g, "$1 是 $2 上一点")
    .replace(/(优弧|劣弧)\s*(?:⌒\s*)?([A-Z]{2})/g, "$1⌒$2")
    .replace(/(?:弧线|弧)\s*([A-Z]{2})/g, "⌒$1")
    .replace(/⌒\s*([A-Z]{2})/g, "⌒$1");
}

function normalizeTriangleRelations(text) {
  return text
    .replace(/(△[A-Z]{3})\s*(?:全等于?|≌|≅|\\cong)\s*(△[A-Z]{3})/g, "$1≌$2")
    .replace(/(△[A-Z]{3})\s*(?:相似于?|∽|~)\s*(△[A-Z]{3})/g, "$1∽$2");
}

function normalizeBisectorsAndMidpoints(text) {
  return text
    .replace(/([A-Z]{2})\s*平分\s*(∠[A-Z]{1,4})/g, "$1 平分 $2")
    .replace(/([A-Z]{2})\s*(?:是|为)\s*(∠[A-Z]{1,4})\s*的?(?:角)?平分线/g, "$1 是 $2 的角平分线")
    .replace(/([A-Z]{2})\s*(?:是|为)\s*(?:线段)?\s*([A-Z]{2})\s*的?垂直平分线/g, "$1 是 $2 的垂直平分线")
    .replace(/([A-Z]{2})\s*垂直平分(?:线段)?\s*([A-Z]{2})/g, "$1 垂直平分 $2")
    .replace(/点?\s*([A-Z])\s*(?:是|为)\s*(?:线段)?\s*([A-Z]{2})\s*的?\s*中点/g, "$1 是 $2 的中点");
}

function normalizeTangentRadiusDiameter(text) {
  return text
    .replace(/([A-Z]{2})\s*(?:是|为)\s*(⊙[A-Z])\s*的?切线/g, "$1 是 $2 的切线")
    .replace(/([A-Z]{2})\s*(?:与|和)\s*(⊙[A-Z])\s*相切\s*于\s*([A-Z])/g, "$1 与 $2 相切于 $3")
    .replace(/([A-Z]{2})\s*(?:与|和)\s*(⊙[A-Z])\s*相切/g, "$1 与 $2 相切")
    .replace(/直线\s*([A-Z]{2})\s*(?:与|和)\s*(⊙[A-Z])\s*相切\s*于\s*([A-Z])/g, "$1 与 $2 相切于 $3")
    .replace(/直线\s*([A-Z]{2})\s*(?:与|和)\s*(⊙[A-Z])\s*相切/g, "$1 与 $2 相切")
    .replace(/([A-Z]{2})\s*切\s*(⊙[A-Z])\s*于\s*([A-Z])/g, "$1 切 $2 于 $3")
    .replace(/([A-Z]{2})\s*(?:是|为)\s*(⊙[A-Z])\s*的?半径/g, "$1 是 $2 的半径")
    .replace(/([A-Z]{2})\s*(?:是|为)\s*(⊙[A-Z])\s*的?直径/g, "$1 是 $2 的直径")
    .replace(/([A-Z]{2})\s*(?:是|为)\s*半径/g, "$1 是半径")
    .replace(/([A-Z]{2})\s*(?:是|为)\s*直径/g, "$1 是直径")
    .replace(/([A-Z])\s*(?:是|为)\s*切点/g, "$1 为切点")
    .replace(/切点\s*(?:是|为)\s*([A-Z])/g, "$1 为切点")
    .replace(/切于\s*([A-Z])/g, "切于 $1")
    .replace(/切线\s*([A-Z]{2})/g, "$1 是切线")
    .replace(/半径\s*([A-Z]{2})/g, "$1 是半径")
    .replace(/直径\s*([A-Z]{2})/g, "$1 是直径");
}

function normalizeGeometrySymbols(text) {
  let normalized = normalizeBasicPunctuation(text);

  normalized = normalizeTriangleSymbols(normalized);
  normalized = normalizeAngleSymbols(normalized);
  normalized = normalizeLineRelations(normalized);
  normalized = normalizeEqualRelations(normalized);
  normalized = normalizeCircleAndArcSymbols(normalized);
  normalized = normalizeTriangleSymbols(normalized);
  normalized = normalizeTriangleRelations(normalized);
  normalized = normalizeBisectorsAndMidpoints(normalized);
  normalized = normalizeTangentRadiusDiameter(normalized);

  return normalized.replace(/[ \t]+/g, " ").trim();
}

function normalizeMathQuestionText(text) {
  return normalizeGeometrySymbols(text);
}

module.exports = {
  normalizeGeometrySymbols,
  normalizeMathQuestionText,
};
