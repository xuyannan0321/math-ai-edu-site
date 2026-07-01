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
  const objectPattern = "(?:∠[A-Z]{1,4}|△[A-Z]{3}|⌒[A-Z]{2}|弦[A-Z]{2}|[A-Z]{1,3})";
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

function normalizeCircleAngleTerms(text) {
  return text
    .replace(/同\s*弧/g, "同弧")
    .replace(/等\s*弧/g, "等弧")
    .replace(/圆\s*周\s*角/g, "圆周角")
    .replace(/圆\s*心\s*角/g, "圆心角")
    .replace(/所\s*对\s*弧/g, "所对弧")
    .replace(/所\s*对\s*圆周角/g, "所对圆周角")
    .replace(/所\s*对\s*圆心角/g, "所对圆心角")
    .replace(/(∠[A-Z]{3})\s*(?:等于|=)\s*2\s*(?:倍)?\s*(∠[A-Z]{3})/g, "$1=2$2")
    .replace(/(∠[A-Z]{3})\s*(?:等于|是|为)\s*(∠[A-Z]{3})\s*的?\s*2\s*倍/g, "$1=2$2")
    .replace(/(∠[A-Z]{3})\s*=\s*90\s*(?:度|°)?/g, "$1=90°")
    .replace(/(∠[A-Z]{3})\s*(?:是|为)\s*直角/g, "$1 是直角");
}

function normalizeChordTerms(text) {
  return text
    .replace(/弦\s*([A-Z]{2})/g, "弦$1")
    .replace(/非\s*直径\s*弦/g, "非直径弦")
    .replace(/([A-Z]{2})\s*(?:、|,|，|和|与)\s*([A-Z]{2})\s*(?:是|为)\s*(⊙[A-Z])\s*的?(非直径)?弦/g, "$1、$2 是 $3 的 $4弦")
    .replace(/([A-Z]{2})\s*(?:是|为)\s*(⊙[A-Z])\s*的?(非直径)?弦/g, "$1 是 $2 的 $3弦")
    .replace(/弦([A-Z]{2})\s*=\s*弦([A-Z]{2})/g, "弦$1=弦$2");
}

function normalizeCircleChordDistanceTerms(text) {
  return text
    .replace(/([A-Z]{2})\s*过\s*圆心\s*(⊙[A-Z]|[A-Z])?/g, (match, line, center) => {
      const normalizedCenter = center
        ? String(center).replace(/^([A-Z])$/, "⊙$1")
        : "⊙O";
      return `${line} 过圆心 ${normalizedCenter}`;
    })
    .replace(/过\s*圆心\s*(⊙[A-Z]|[A-Z])?\s*的?\s*([A-Z]{2})/g, (match, center, line) => {
      const normalizedCenter = center
        ? String(center).replace(/^([A-Z])$/, "⊙$1")
        : "⊙O";
      return `${line} 过圆心 ${normalizedCenter}`;
    })
    .replace(/垂足\s*分别\s*(?:是|为)\s*([A-Z])\s*(?:、|,|，|和|与)\s*([A-Z])/g, "垂足分别为 $1、$2")
    .replace(/垂足\s*(?:是|为)\s*([A-Z])/g, "垂足为 $1")
    .replace(/圆心\s*到\s*弦?\s*([A-Z]{2})\s*的?\s*距离/g, "圆心到弦$1的距离")
    .replace(/弦\s*心\s*距\s*([A-Z]{2})/g, "弦心距$1");
}

function normalizeParallelogramTerms(text) {
  return text
    .replace(/平行\s*四边形\s*([A-Z]{4})/g, "$1 是平行四边形")
    .replace(/四边形\s*([A-Z]{4})\s*(?:是|为)\s*平行\s*四边形/g, "$1 是平行四边形")
    .replace(/([A-Z]{4})\s*(?:是|为)\s*平行\s*四边形/g, "$1 是平行四边形")
    .replace(/对\s*边\s*相等/g, "对边相等")
    .replace(/对\s*角\s*相等/g, "对角相等")
    .replace(/对\s*角\s*线/g, "对角线")
    .replace(/对角线\s*([A-Z]{2})\s*(?:、|,|，|和|与)\s*([A-Z]{2})/g, "对角线 $1、$2")
    .replace(/([A-Z]{2})\s*(?:、|,|，|和|与)\s*([A-Z]{2})\s*(?:相)?交于\s*([A-Z])/g, "$1、$2 交于 $3")
    .replace(/([A-Z]{2})\s*(?:与|和)\s*([A-Z]{2})\s*(?:相)?交于\s*([A-Z])/g, "$1、$2 交于 $3")
    .replace(/互\s*相\s*平分/g, "互相平分")
    .replace(/对角线\s*互相平分/g, "对角线互相平分");
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
  normalized = normalizeCircleAngleTerms(normalized);
  normalized = normalizeChordTerms(normalized);
  normalized = normalizeCircleChordDistanceTerms(normalized);
  normalized = normalizeParallelogramTerms(normalized);
  normalized = normalizeEqualRelations(normalized);
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
