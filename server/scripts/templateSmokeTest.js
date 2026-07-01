"use strict";

const { buildGraphTemplateSpec } = require("../src/services/graphTemplates");

const geometryTemplateIds = [
  "isosceles_triangle_v1",
  "midpoint_midline_v1",
  "parallel_angle_v1",
  "congruent_triangle_sss_v1",
  "similar_triangle_aa_v1",
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
];

const positiveCases = [
  {
    name: "function_intersection_v1",
    input: "求函数 y=8/x 与 y=2x 的交点。",
    expectTemplateId: "function_intersection_v1",
  },
  {
    name: "isosceles_triangle_v1",
    input: "已知三角形 ABC 中，AB=AC，点 D 是 BC 的中点，求证 AD 垂直 BC。",
    expectTemplateId: "isosceles_triangle_v1",
  },
  {
    name: "midpoint_midline_v1",
    input: "已知三角形 ABC 中，M 是 AB 的中点，N 是 AC 的中点，求证 MN 平行 BC。",
    expectTemplateId: "midpoint_midline_v1",
  },
  {
    name: "parallel_angle_v1",
    input: "已知 AB ∥ CD，直线 EF 分别交 AB、CD 于点 E、F，求证 ∠AEF = ∠EFD。",
    expectTemplateId: "parallel_angle_v1",
  },
  {
    name: "congruent_triangle_sss_v1",
    input: "已知 AB=DE，AC=DF，BC=EF，求证 △ABC≌△DEF。",
    expectTemplateId: "congruent_triangle_sss_v1",
  },
  {
    name: "similar_triangle_aa_v1",
    input: "已知 ∠A=∠D，∠B=∠E，求证 △ABC∽△DEF。",
    expectTemplateId: "similar_triangle_aa_v1",
  },
  {
    name: "similar_triangle_sss_v1",
    input: "已知 AB/DE=AC/DF=BC/EF，求证 △ABC∽△DEF。",
    expectTemplateId: "similar_triangle_sss_v1",
  },
  {
    name: "angle_bisector_v1",
    input: "已知三角形 ABC 中，AD 是 ∠BAC 的角平分线，点 D 在 BC 上，求证 ∠BAD=∠DAC。",
    expectTemplateId: "angle_bisector_v1",
  },
  {
    name: "perpendicular_bisector_v1",
    input: "已知 l 是线段 AB 的垂直平分线，点 P 在 l 上，求证 PA=PB。",
    expectTemplateId: "perpendicular_bisector_v1",
  },
  {
    name: "pythagorean_right_triangle_v1",
    input: "已知 Rt△ABC 中，∠C=90°，AC=3，BC=4，求 AB。",
    expectTemplateId: "pythagorean_right_triangle_v1",
  },
  {
    name: "radius_equal_v1",
    input: "已知 OA、OB 是 ⊙O 的半径，求证 OA=OB。",
    expectTemplateId: "radius_equal_v1",
  },
  {
    name: "diameter_right_angle_v1",
    input: "已知 AB 是 ⊙O 的直径，点 C 在 ⊙O 上，求证 ∠ACB=90°。",
    expectTemplateId: "diameter_right_angle_v1",
  },
  {
    name: "tangent_radius_perpendicular_v1",
    input: "已知 PA 是 ⊙O 的切线，A 为切点，OA 是半径，求证 OA⊥PA。",
    expectTemplateId: "tangent_radius_perpendicular_v1",
  },
  {
    name: "same_arc_equal_inscribed_angles_v1",
    input: "已知点 A、B、C、D 在 ⊙O 上，∠ACB 与 ∠ADB 同对弧 AB，求证 ∠ACB=∠ADB。",
    expectTemplateId: "same_arc_equal_inscribed_angles_v1",
  },
  {
    name: "equal_arcs_equal_inscribed_angles_v1",
    input: "已知 ⊙O 中，⌒AB=⌒CD，∠AEB 对⌒AB，∠CFD 对⌒CD，求证 ∠AEB=∠CFD。",
    expectTemplateId: "equal_arcs_equal_inscribed_angles_v1",
  },
  {
    name: "central_angle_double_inscribed_angle_v1",
    input: "已知 ∠AOB 是 ⊙O 中弧 AB 所对的圆心角，∠ACB 是同弧 AB 所对的圆周角，求证 ∠AOB=2∠ACB。",
    expectTemplateId: "central_angle_double_inscribed_angle_v1",
  },
  {
    name: "right_angle_subtends_diameter_v1",
    input: "已知 A、B、C 在 ⊙O 上，∠ACB=90°，求证 AB 是 ⊙O 的直径。",
    expectTemplateId: "right_angle_subtends_diameter_v1",
  },
];

const negativeCases = [
  {
    name: "only OA=OB should not trigger radius_equal_v1",
    input: "已知 OA=OB，求证 OA=OB。",
    forbiddenTemplateIds: ["radius_equal_v1"],
  },
  {
    name: "plain AB segment should not trigger diameter_right_angle_v1",
    input: "已知 AB 是线段，点 C 在 AB 外，求证 ∠ACB=90°。",
    forbiddenTemplateIds: ["diameter_right_angle_v1"],
  },
  {
    name: "circle intersection should not trigger tangent_radius_perpendicular_v1",
    input: "已知 PA 与圆 O 相交，求证 OA⊥PA。",
    forbiddenTemplateIds: ["tangent_radius_perpendicular_v1"],
  },
  {
    name: "bare similarity relation should not trigger similarity criteria templates",
    input: "已知 △ABC∽△DEF。",
    forbiddenTemplateIds: [
      "similar_triangle_aa_v1",
      "similar_triangle_sas_v1",
      "similar_triangle_sss_v1",
    ],
  },
  {
    name: "only two equal sides should not trigger SSS congruence",
    input: "已知 AB=DE，AC=DF，求证 △ABC≌△DEF。",
    forbiddenTemplateIds: ["congruent_triangle_sss_v1"],
  },
  {
    name: "ordinary triangle should not trigger pythagorean_right_triangle_v1",
    input: "已知三角形 ABC，求 AB。",
    forbiddenTemplateIds: ["pythagorean_right_triangle_v1"],
  },
  {
    name: "only P on l should not trigger perpendicular_bisector_v1",
    input: "已知点 P 在直线 l 上，求证 PA=PB。",
    forbiddenTemplateIds: ["perpendicular_bisector_v1"],
  },
  {
    name: "ordinary function graph should not trigger geometry templates",
    input: "画出函数 y=x^2 的图像。",
    forbiddenTemplateIds: geometryTemplateIds,
  },
  {
    name: "bare equal inscribed angles should not trigger same_arc_equal_inscribed_angles_v1",
    input: "已知 ∠ACB=∠ADB，求证 ∠ACB=∠ADB。",
    forbiddenTemplateIds: ["same_arc_equal_inscribed_angles_v1"],
  },
  {
    name: "bare equal arcs should not trigger equal_arcs_equal_inscribed_angles_v1",
    input: "已知 ⊙O 中，⌒AB=⌒CD。",
    forbiddenTemplateIds: ["equal_arcs_equal_inscribed_angles_v1"],
  },
  {
    name: "bare double angle relation should not trigger central_angle_double_inscribed_angle_v1",
    input: "已知 ∠AOB=2∠ACB，求证 ∠AOB=2∠ACB。",
    forbiddenTemplateIds: ["central_angle_double_inscribed_angle_v1"],
  },
  {
    name: "ordinary right triangle should not trigger right_angle_subtends_diameter_v1",
    input: "已知三角形 ABC 中，∠ACB=90°，求证 AB 是斜边。",
    forbiddenTemplateIds: ["right_angle_subtends_diameter_v1"],
  },
  {
    name: "diameter right angle should keep diameter_right_angle_v1",
    input: "已知 AB 是 ⊙O 的直径，点 C 在 ⊙O 上，求证 ∠ACB=90°。",
    expectTemplateId: "diameter_right_angle_v1",
    forbiddenTemplateIds: ["right_angle_subtends_diameter_v1"],
  },
  {
    name: "function intersection should keep function_intersection_v1",
    input: "求函数 y=8/x 与 y=2x 的交点。",
    expectTemplateId: "function_intersection_v1",
    forbiddenTemplateIds: geometryTemplateIds,
  },
];

function hasRenderablePayload(spec) {
  if (!spec || typeof spec !== "object") {
    return false;
  }

  if (spec.type === "function_graph") {
    const hasCurves = Array.isArray(spec.curves) && spec.curves.length > 0;
    const hasFunctions = Array.isArray(spec.functions) && spec.functions.length > 0;
    const hasPoints = spec.points && typeof spec.points === "object" && Object.keys(spec.points).length > 0;
    return Array.isArray(spec.objects) && (hasCurves || hasFunctions || hasPoints);
  }

  return Array.isArray(spec.objects) && spec.objects.length > 0;
}

function describeSpec(spec) {
  if (!spec) {
    return "null";
  }

  const objectCount = Array.isArray(spec.objects) ? spec.objects.length : "no objects array";
  return `templateId=${spec.templateId || "none"}, type=${spec.type || "none"}, canRender=${spec.canRender}, objects=${objectCount}`;
}

function checkPositive(testCase) {
  const spec = buildGraphTemplateSpec(testCase.input, {});
  const failures = [];

  if (!spec) {
    failures.push("expected a template spec, got null");
    return failures;
  }

  if (spec.templateId !== testCase.expectTemplateId) {
    failures.push(`expected templateId ${testCase.expectTemplateId}, got ${spec.templateId || "none"}`);
  }

  if (spec.canRender !== true) {
    failures.push(`expected canRender true, got ${spec.canRender}`);
  }

  if (!spec.type || spec.type === "none") {
    failures.push(`expected type other than none, got ${spec.type || "none"}`);
  }

  if (!hasRenderablePayload(spec)) {
    failures.push(`expected renderable payload with objects for geometry or curves/functions/points for function_graph, got ${describeSpec(spec)}`);
  }

  return failures;
}

function checkNegative(testCase) {
  const spec = buildGraphTemplateSpec(testCase.input, {});
  const templateId = spec && spec.templateId;
  const forbidden = new Set(testCase.forbiddenTemplateIds || []);
  const failures = [];

  if (testCase.expectTemplateId && templateId !== testCase.expectTemplateId) {
    failures.push(`expected templateId ${testCase.expectTemplateId}, got ${templateId || "none"}`);
  }

  if (templateId && forbidden.has(templateId)) {
    failures.push(`did not expect ${templateId}, got ${describeSpec(spec)}`);
  }

  return failures;
}

function run() {
  let passed = 0;
  let failed = 0;
  const failureLines = [];

  positiveCases.forEach((testCase) => {
    const failures = checkPositive(testCase);
    if (failures.length) {
      failed += 1;
      failureLines.push(`[FAIL] positive ${testCase.name}: ${failures.join("; ")}`);
    } else {
      passed += 1;
      console.log(`[PASS] positive ${testCase.name}`);
    }
  });

  negativeCases.forEach((testCase) => {
    const failures = checkNegative(testCase);
    if (failures.length) {
      failed += 1;
      failureLines.push(`[FAIL] negative ${testCase.name}: ${failures.join("; ")}`);
    } else {
      passed += 1;
      console.log(`[PASS] negative ${testCase.name}`);
    }
  });

  failureLines.forEach((line) => console.error(line));
  console.log(`Template smoke test completed: ${passed} passed, ${failed} failed.`);
  console.log(`Positive cases: ${positiveCases.length}; negative cases: ${negativeCases.length}.`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
