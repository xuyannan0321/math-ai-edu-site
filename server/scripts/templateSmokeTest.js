"use strict";

const { buildGraphTemplateSpec } = require("../src/services/graphTemplates");
const { normalizeVisualizationSpec } = require("../src/services/solveSchema");

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
  "parallelogram_opposite_sides_equal_v1",
  "parallelogram_opposite_angles_equal_v1",
  "parallelogram_diagonals_bisect_v1",
  "rectangle_diagonals_equal_v1",
  "rhombus_diagonals_perpendicular_v1",
  "trapezoid_midline_v1",
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
];

const circleChordTemplateIds = new Set([
  "perpendicular_diameter_bisects_chord_v1",
  "diameter_bisects_chord_perpendicular_v1",
  "equal_chords_equal_distance_to_center_v1",
  "equal_distance_to_center_equal_chords_v1",
]);

const quadrilateralTemplateIds = new Set([
  "parallelogram_opposite_sides_equal_v1",
  "parallelogram_opposite_angles_equal_v1",
  "parallelogram_diagonals_bisect_v1",
  "rectangle_diagonals_equal_v1",
  "rhombus_diagonals_perpendicular_v1",
  "trapezoid_midline_v1",
]);

const stablePipelineTemplateIds = new Set([
  ...circleChordTemplateIds,
  ...quadrilateralTemplateIds,
]);

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
    name: "parallelogram_opposite_sides_equal_v1",
    input: "已知 ABCD 是平行四边形，求证 AB=CD，AD=BC。",
    expectTemplateId: "parallelogram_opposite_sides_equal_v1",
  },
  {
    name: "parallelogram_opposite_angles_equal_v1",
    input: "已知 ABCD 是平行四边形，求证 ∠A=∠C，∠B=∠D。",
    expectTemplateId: "parallelogram_opposite_angles_equal_v1",
  },
  {
    name: "parallelogram_diagonals_bisect_v1",
    input: "已知 ABCD 是平行四边形，对角线 AC、BD 交于 O，求证 AO=OC，BO=OD。",
    expectTemplateId: "parallelogram_diagonals_bisect_v1",
  },
  {
    name: "rectangle_diagonals_equal_v1",
    input: "已知 ABCD 是矩形，求证 AC=BD。",
    expectTemplateId: "rectangle_diagonals_equal_v1",
  },
  {
    name: "rhombus_diagonals_perpendicular_v1",
    input: "已知 ABCD 是菱形，对角线 AC、BD 交于 O，求证 AC⊥BD。",
    expectTemplateId: "rhombus_diagonals_perpendicular_v1",
  },
  {
    name: "trapezoid_midline_v1",
    input: "已知梯形 ABCD 中，AD∥BC，M、N 分别是 AB、CD 的中点，求证 MN∥AD∥BC，且 MN=(AD+BC)/2。",
    expectTemplateId: "trapezoid_midline_v1",
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
  {
    name: "equal_chords_equal_arcs_v1",
    input: "已知 AB、CD 是 ⊙O 的弦，AB=CD，求证 ⌒AB=⌒CD。",
    expectTemplateId: "equal_chords_equal_arcs_v1",
  },
  {
    name: "equal_arcs_equal_chords_v1",
    input: "已知 ⊙O 中，⌒AB=⌒CD，求证 AB=CD。",
    expectTemplateId: "equal_arcs_equal_chords_v1",
  },
  {
    name: "perpendicular_diameter_bisects_chord_v1",
    input: "已知 AB 是 ⊙O 的弦，OM 过圆心 O，OM⊥AB，垂足为 M，求证 AM=MB。",
    expectTemplateId: "perpendicular_diameter_bisects_chord_v1",
  },
  {
    name: "diameter_bisects_chord_perpendicular_v1",
    input: "已知 AB 是 ⊙O 的非直径弦，OM 过圆心 O，M 是 AB 的中点，求证 OM⊥AB。",
    expectTemplateId: "diameter_bisects_chord_perpendicular_v1",
  },
  {
    name: "equal_chords_equal_distance_to_center_v1",
    input: "已知 AB、CD 是 ⊙O 的弦，AB=CD，OM⊥AB 于 M，ON⊥CD 于 N，求证 OM=ON。",
    expectTemplateId: "equal_chords_equal_distance_to_center_v1",
  },
  {
    name: "equal_distance_to_center_equal_chords_v1",
    input: "已知 AB、CD 是 ⊙O 的弦，OM⊥AB 于 M，ON⊥CD 于 N，OM=ON，求证 AB=CD。",
    expectTemplateId: "equal_distance_to_center_equal_chords_v1",
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
  {
    name: "bare AB=CD should not trigger equal_chords_equal_arcs_v1",
    input: "已知 AB=CD，求证 ⌒AB=⌒CD。",
    forbiddenTemplateIds: ["equal_chords_equal_arcs_v1"],
  },
  {
    name: "only chords should not trigger equal_chords_equal_arcs_v1",
    input: "已知 AB、CD 是 ⊙O 的弦，求证 ⌒AB=⌒CD。",
    forbiddenTemplateIds: ["equal_chords_equal_arcs_v1"],
  },
  {
    name: "only equal arcs should not trigger equal_arcs_equal_chords_v1",
    input: "已知 ⊙O 中，⌒AB=⌒CD。",
    forbiddenTemplateIds: ["equal_arcs_equal_chords_v1"],
  },
  {
    name: "ordinary triangle equal sides should not trigger chord arc templates",
    input: "已知三角形 ABC 中，AB=CD，求证 ⌒AB=⌒CD。",
    forbiddenTemplateIds: ["equal_chords_equal_arcs_v1", "equal_arcs_equal_chords_v1"],
  },
  {
    name: "tangent chord angle should not trigger chord arc templates",
    input: "已知 PA 是 ⊙O 的切线，AB 是 ⊙O 的弦，求证弦切角关系。",
    forbiddenTemplateIds: ["equal_chords_equal_arcs_v1", "equal_arcs_equal_chords_v1"],
  },
  {
    name: "circle power comprehensive should not trigger chord arc templates",
    input: "已知 PAB 是 ⊙O 的切割线，求证 PA·PB=PC·PD。",
    forbiddenTemplateIds: ["equal_chords_equal_arcs_v1", "equal_arcs_equal_chords_v1"],
  },
  {
    name: "equal arcs inscribed angles should keep equal_arcs_equal_inscribed_angles_v1",
    input: "已知 ⊙O 中，⌒AB=⌒CD，∠AEB 对⌒AB，∠CFD 对⌒CD，求证 ∠AEB=∠CFD。",
    expectTemplateId: "equal_arcs_equal_inscribed_angles_v1",
    forbiddenTemplateIds: ["equal_arcs_equal_chords_v1"],
  },
  {
    name: "bare AB=CD should not trigger parallelogram opposite sides",
    input: "已知 AB=CD，求证 AB=CD。",
    forbiddenTemplateIds: ["parallelogram_opposite_sides_equal_v1"],
  },
  {
    name: "bare angle equality should not trigger parallelogram opposite angles",
    input: "已知 ∠A=∠C，求证 ∠A=∠C。",
    forbiddenTemplateIds: ["parallelogram_opposite_angles_equal_v1"],
  },
  {
    name: "bare AO=OC should not trigger parallelogram diagonal bisection",
    input: "已知 AO=OC，求证 AO=OC。",
    forbiddenTemplateIds: ["parallelogram_diagonals_bisect_v1"],
  },
  {
    name: "ordinary quadrilateral should not trigger parallelogram templates",
    input: "已知四边形 ABCD，求证 AB=CD。",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "parallel angle theorem should not trigger parallelogram templates",
    input: "已知 AB ∥ CD，直线 EF 分别交 AB、CD 于点 E、F，求证 ∠AEF = ∠EFD。",
    expectTemplateId: "parallel_angle_v1",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "triangle midline should not trigger parallelogram templates",
    input: "已知三角形 ABC 中，M 是 AB 的中点，N 是 AC 的中点，求证 MN 平行 BC。",
    expectTemplateId: "midpoint_midline_v1",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "function intersection should not trigger parallelogram templates",
    input: "求函数 y=8/x 与 y=2x 的交点。",
    expectTemplateId: "function_intersection_v1",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "circle chord arc should not trigger parallelogram templates",
    input: "已知 AB、CD 是 ⊙O 的弦，AB=CD，求证 ⌒AB=⌒CD。",
    expectTemplateId: "equal_chords_equal_arcs_v1",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "coordinate geometry should not trigger parallelogram templates",
    input: "已知 A(0,0)，B(4,0)，C(5,2)，D(1,2)，求四边形 ABCD 的面积。",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "rectangle should not trigger parallelogram part1 templates",
    input: "已知 ABCD 是矩形，求证 AC=BD。",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "rhombus should not trigger parallelogram part1 templates",
    input: "已知 ABCD 是菱形，对角线 AC、BD 交于 O，求证 AC⊥BD。",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "trapezoid should not trigger parallelogram part1 templates",
    input: "已知 ABCD 是梯形，AD∥BC，M、N 分别为两腰中点，求证 MN∥AD。",
    forbiddenTemplateIds: [
      "parallelogram_opposite_sides_equal_v1",
      "parallelogram_opposite_angles_equal_v1",
      "parallelogram_diagonals_bisect_v1",
    ],
  },
  {
    name: "bare AC=BD should not trigger rectangle diagonals",
    input: "已知 AC=BD，求证 AC=BD。",
    forbiddenTemplateIds: ["rectangle_diagonals_equal_v1"],
  },
  {
    name: "ordinary quadrilateral equal diagonals should not trigger rectangle",
    input: "已知四边形 ABCD 的对角线 AC=BD，求证 AC=BD。",
    forbiddenTemplateIds: ["rectangle_diagonals_equal_v1"],
  },
  {
    name: "bare AC perpendicular BD should not trigger rhombus diagonals",
    input: "已知 AC⊥BD，求证 AC⊥BD。",
    forbiddenTemplateIds: ["rhombus_diagonals_perpendicular_v1"],
  },
  {
    name: "ordinary quadrilateral perpendicular diagonals should not trigger rhombus",
    input: "已知四边形 ABCD 的对角线 AC、BD 交于 O，AC⊥BD，求证 AC⊥BD。",
    forbiddenTemplateIds: ["rhombus_diagonals_perpendicular_v1"],
  },
  {
    name: "only trapezoid bases should not trigger trapezoid midline",
    input: "已知梯形 ABCD 中，AD∥BC，求证 MN∥AD。",
    forbiddenTemplateIds: ["trapezoid_midline_v1"],
  },
  {
    name: "only midpoints should not trigger trapezoid midline",
    input: "已知 M、N 分别是 AB、CD 的中点，求证 MN∥AD。",
    forbiddenTemplateIds: ["trapezoid_midline_v1"],
  },
  {
    name: "triangle midline should not trigger trapezoid midline",
    input: "已知三角形 ABC 中，M 是 AB 的中点，N 是 AC 的中点，求证 MN 平行 BC。",
    expectTemplateId: "midpoint_midline_v1",
    forbiddenTemplateIds: ["trapezoid_midline_v1"],
  },
  {
    name: "function intersection should not trigger special quadrilateral templates",
    input: "求函数 y=8/x 与 y=2x 的交点。",
    expectTemplateId: "function_intersection_v1",
    forbiddenTemplateIds: [
      "rectangle_diagonals_equal_v1",
      "rhombus_diagonals_perpendicular_v1",
      "trapezoid_midline_v1",
    ],
  },
  {
    name: "circle chord arc should not trigger special quadrilateral templates",
    input: "已知 AB、CD 是 ⊙O 的弦，AB=CD，求证 ⌒AB=⌒CD。",
    expectTemplateId: "equal_chords_equal_arcs_v1",
    forbiddenTemplateIds: [
      "rectangle_diagonals_equal_v1",
      "rhombus_diagonals_perpendicular_v1",
      "trapezoid_midline_v1",
    ],
  },
  {
    name: "parallelogram diagonal bisection should not trigger special quadrilateral templates",
    input: "已知 ABCD 是平行四边形，对角线 AC、BD 交于 O，求证 AO=OC，BO=OD。",
    expectTemplateId: "parallelogram_diagonals_bisect_v1",
    forbiddenTemplateIds: [
      "rectangle_diagonals_equal_v1",
      "rhombus_diagonals_perpendicular_v1",
      "trapezoid_midline_v1",
    ],
  },
  {
    name: "coordinate geometry should not trigger special quadrilateral templates",
    input: "已知 A(0,0)，B(4,0)，C(4,2)，D(0,2)，求 AC 的长。",
    forbiddenTemplateIds: [
      "rectangle_diagonals_equal_v1",
      "rhombus_diagonals_perpendicular_v1",
      "trapezoid_midline_v1",
    ],
  },
  {
    name: "bare OM perpendicular AB should not trigger perpendicular diameter theorem",
    input: "已知 OM⊥AB，求证 AM=MB。",
    forbiddenTemplateIds: ["perpendicular_diameter_bisects_chord_v1"],
  },
  {
    name: "only chord should not trigger perpendicular diameter theorem",
    input: "已知 AB 是 ⊙O 的弦，求证 AM=MB。",
    forbiddenTemplateIds: ["perpendicular_diameter_bisects_chord_v1"],
  },
  {
    name: "only midpoint should not trigger diameter bisects chord perpendicular",
    input: "已知 M 是 AB 的中点，求证 OM⊥AB。",
    forbiddenTemplateIds: ["diameter_bisects_chord_perpendicular_v1"],
  },
  {
    name: "perpendicular bisector should keep perpendicular_bisector_v1",
    input: "已知 l 是线段 AB 的垂直平分线，点 P 在 l 上，求证 PA=PB。",
    expectTemplateId: "perpendicular_bisector_v1",
    forbiddenTemplateIds: [
      "perpendicular_diameter_bisects_chord_v1",
      "diameter_bisects_chord_perpendicular_v1",
    ],
  },
  {
    name: "bare equal chords should not trigger equal chord distance",
    input: "已知 AB=CD，求证 OM=ON。",
    forbiddenTemplateIds: ["equal_chords_equal_distance_to_center_v1"],
  },
  {
    name: "bare equal distances should not trigger equal distance chords",
    input: "已知 OM=ON，求证 AB=CD。",
    forbiddenTemplateIds: ["equal_distance_to_center_equal_chords_v1"],
  },
  {
    name: "coordinate distance should not trigger circle chord templates",
    input: "已知点 A(0,0)，直线 l: y=3，求点 A 到直线 l 的距离。",
    forbiddenTemplateIds: [
      "perpendicular_diameter_bisects_chord_v1",
      "diameter_bisects_chord_perpendicular_v1",
      "equal_chords_equal_distance_to_center_v1",
      "equal_distance_to_center_equal_chords_v1",
    ],
  },
  {
    name: "function intersection should not trigger circle chord templates",
    input: "求函数 y=8/x 与 y=2x 的交点。",
    expectTemplateId: "function_intersection_v1",
    forbiddenTemplateIds: [
      "perpendicular_diameter_bisects_chord_v1",
      "diameter_bisects_chord_perpendicular_v1",
      "equal_chords_equal_distance_to_center_v1",
      "equal_distance_to_center_equal_chords_v1",
    ],
  },
  {
    name: "equal chords equal arcs should keep equal_chords_equal_arcs_v1",
    input: "已知 AB、CD 是 ⊙O 的弦，AB=CD，求证 ⌒AB=⌒CD。",
    expectTemplateId: "equal_chords_equal_arcs_v1",
    forbiddenTemplateIds: ["equal_chords_equal_distance_to_center_v1"],
  },
  {
    name: "equal arcs equal chords should keep equal_arcs_equal_chords_v1",
    input: "已知 ⊙O 中，⌒AB=⌒CD，求证 AB=CD。",
    expectTemplateId: "equal_arcs_equal_chords_v1",
    forbiddenTemplateIds: ["equal_distance_to_center_equal_chords_v1"],
  },
  {
    name: "circle power should not trigger circle chord pack",
    input: "已知 PAB 是 ⊙O 的切割线，求证 PA·PB=PC·PD。",
    forbiddenTemplateIds: [
      "perpendicular_diameter_bisects_chord_v1",
      "diameter_bisects_chord_perpendicular_v1",
      "equal_chords_equal_distance_to_center_v1",
      "equal_distance_to_center_equal_chords_v1",
    ],
  },
  {
    name: "secant theorem should not trigger circle chord pack",
    input: "已知直线 PAB 与 ⊙O 相交于 A、B，直线 PCD 与 ⊙O 相交于 C、D，求证 PA·PB=PC·PD。",
    forbiddenTemplateIds: [
      "perpendicular_diameter_bisects_chord_v1",
      "diameter_bisects_chord_perpendicular_v1",
      "equal_chords_equal_distance_to_center_v1",
      "equal_distance_to_center_equal_chords_v1",
    ],
  },
  {
    name: "tangent chord angle should not trigger circle chord pack",
    input: "已知 PA 是 ⊙O 的切线，AB 是 ⊙O 的弦，求证弦切角关系。",
    forbiddenTemplateIds: [
      "perpendicular_diameter_bisects_chord_v1",
      "diameter_bisects_chord_perpendicular_v1",
      "equal_chords_equal_distance_to_center_v1",
      "equal_distance_to_center_equal_chords_v1",
    ],
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

function hasNonEmptyFirstView(spec) {
  const firstView = spec && Array.isArray(spec.views) ? spec.views[0] : null;
  const showObjects = firstView && firstView.showObjects;

  if (Array.isArray(showObjects)) {
    return showObjects.length > 0;
  }

  if (showObjects && typeof showObjects === "object") {
    return Object.values(showObjects).some((value) => Array.isArray(value) && value.length > 0);
  }

  return false;
}

function getDuplicatePointLabelObjects(spec) {
  const objects = Array.isArray(spec && spec.objects) ? spec.objects : [];

  return objects
    .filter((object) => (
      object
      && object.kind === "label"
      && ["O", "M", "N"].includes(object.text || object.label)
    ))
    .map((object) => object.text || object.label);
}

function getPointLayoutLosses(originalSpec, normalizedSpec) {
  const losses = [];
  const originalPoints = originalSpec && originalSpec.points && typeof originalSpec.points === "object"
    ? originalSpec.points
    : {};
  const normalizedPoints = normalizedSpec && normalizedSpec.points && typeof normalizedSpec.points === "object"
    ? normalizedSpec.points
    : {};

  ["O", "M", "N"].forEach((pointId) => {
    const originalPoint = originalPoints[pointId];
    if (!originalPoint) {
      return;
    }

    const normalizedPoint = normalizedPoints[pointId];
    if (!normalizedPoint) {
      losses.push(`${pointId}.point`);
      return;
    }

    ["labelDirection", "labelOffset", "dx", "dy", "showLabel"].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(originalPoint, field)
        && normalizedPoint[field] !== originalPoint[field]) {
        losses.push(`${pointId}.${field}`);
      }
    });
  });

  return losses;
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

  if (!hasNonEmptyFirstView(spec)) {
    failures.push("expected first view showObjects to be non-empty");
  }

  const duplicatePointLabels = getDuplicatePointLabelObjects(spec);
  if (duplicatePointLabels.length) {
    failures.push(`duplicate point label objects for ${duplicatePointLabels.join(",")}`);
  }

  if (stablePipelineTemplateIds.has(testCase.expectTemplateId)) {
    const normalizedFromNone = normalizeVisualizationSpec(
      { type: "none", title: "图示状态", description: "AI returned none", objects: [] },
      { questionText: testCase.input, problemText: testCase.input, questionType: "几何" },
    );

    if (normalizedFromNone.templateId !== testCase.expectTemplateId) {
      failures.push(`expected stable override from AI none to ${testCase.expectTemplateId}, got ${normalizedFromNone.templateId || "none"}`);
    }

    if (normalizedFromNone.canRender !== true || normalizedFromNone.type === "none" || !hasRenderablePayload(normalizedFromNone)) {
      failures.push(`expected stable override from AI none to be renderable, got ${describeSpec(normalizedFromNone)}`);
    }

    if (!hasNonEmptyFirstView(normalizedFromNone)) {
      failures.push("expected stable override from AI none first view showObjects to be non-empty");
    }

    const normalizedDuplicates = getDuplicatePointLabelObjects(normalizedFromNone);
    if (normalizedDuplicates.length) {
      failures.push(`stable override has duplicate point label objects for ${normalizedDuplicates.join(",")}`);
    }

    const layoutLosses = getPointLayoutLosses(spec, normalizedFromNone);
    if (layoutLosses.length) {
      failures.push(`stable override dropped point label layout fields: ${layoutLosses.join(",")}`);
    }

    const normalizedFromOriginalQuestion = normalizeVisualizationSpec(
      { type: "none", title: "图示状态", description: "AI returned none", objects: [], problemText: "AI 改写题干，缺少完整圆弦条件" },
      {
        questionText: "AI 改写题干，缺少完整圆弦条件",
        rawQuestionText: testCase.input,
        originalQuestionText: testCase.input,
        problemText: "AI 改写题干，缺少完整圆弦条件",
        questionType: "几何",
      },
    );

    if (normalizedFromOriginalQuestion.templateId !== testCase.expectTemplateId) {
      failures.push(`expected stable override from original question text to ${testCase.expectTemplateId}, got ${normalizedFromOriginalQuestion.templateId || "none"}`);
    }

    if (normalizedFromOriginalQuestion.canRender !== true || normalizedFromOriginalQuestion.type !== "geometry" || !hasRenderablePayload(normalizedFromOriginalQuestion)) {
      failures.push(`expected original question text override to be renderable geometry, got ${describeSpec(normalizedFromOriginalQuestion)}`);
    }

    const originalQuestionDuplicates = getDuplicatePointLabelObjects(normalizedFromOriginalQuestion);
    if (originalQuestionDuplicates.length) {
      failures.push(`original question override has duplicate point label objects for ${originalQuestionDuplicates.join(",")}`);
    }

    const originalQuestionLayoutLosses = getPointLayoutLosses(spec, normalizedFromOriginalQuestion);
    if (originalQuestionLayoutLosses.length) {
      failures.push(`original question override dropped point label layout fields: ${originalQuestionLayoutLosses.join(",")}`);
    }
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
