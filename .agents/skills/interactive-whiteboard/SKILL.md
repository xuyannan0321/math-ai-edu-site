---
name: interactive-whiteboard
description: Use when building interactive math boards, sliders, moving points, dynamic function graphs, animations, or geometry demos.
---

# Interactive Whiteboard

Use this skill when implementing interactive math visualization.

## Interaction rules

1. Place controls below the board.
2. Sliders must work on mobile.
3. Show current parameter values.
4. Show exact values when possible.
5. Provide reset controls when useful.
6. Use requestAnimationFrame for frequent redraws.
7. Keep page scrolling usable on mobile.

## Color feedback

Use consistent semantic colors:

- Valid state: green
- Invalid state: red
- Special target state: amber
- Neutral state: gray or blue

## Architecture

Separate:

- math state
- derived geometry
- rendering
- UI controls

Do not put all math logic directly inside JSX when it becomes complex.

## Slider behavior

1. Use small step values for smooth movement.
2. Clamp values to legal ranges.
3. Snap to important values when close.
4. Display whether a condition is satisfied.