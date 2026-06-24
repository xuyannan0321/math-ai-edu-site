---
name: math-visualization-svg
description: Use when building SVG diagrams, geometry figures, coordinate systems, function graphs, or visual explanation panels.
---

# Math Visualization SVG

Use this skill when implementing math diagrams.

## Default

Use SVG for static diagrams.

Use Canvas only for dynamic animation or many moving elements.

## Diagram rules

1. Every point, line, angle, curve, or auxiliary element mentioned in the explanation should appear in the diagram.
2. Original problem elements use solid lines.
3. Auxiliary lines use dashed lines.
4. Important elements should be highlighted.
5. Labels must match the explanation.
6. The diagram must work on mobile.
7. Use SVG viewBox to avoid clipping.
8. Use math coordinates instead of random fixed pixels when possible.

## Coordinate system rules

For function graphs:

1. Draw x-axis and y-axis.
2. Add arrowheads.
3. Label x and y.
4. Draw function curves only in the meaningful range.
5. Label key points and intersections.
6. Avoid excessive grid lines.

## Geometry rules

For geometry diagrams:

1. Draw known elements first.
2. Draw auxiliary lines as dashed lines.
3. Mark right angles when perpendicular conditions are used.
4. Use clear labels.
5. Avoid diagrams that contradict the problem.