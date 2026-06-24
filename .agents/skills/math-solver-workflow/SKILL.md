---
name: math-solver-workflow
description: Use when building or modifying the math solving pipeline, LLM prompts, structured solution output, answer verification, or problem parsing for the math education website.
---

# Math Solver Workflow

Use this skill when working on math problem solving.

## Goal

The website should help students understand the solution process, not only get the final answer.

## Required output

A solved math problem should include:

- problemText
- gradeLevel
- subject
- topic
- knowledgePoints
- analysis
- steps
- finalAnswer
- commonMistakes
- verification
- visualization

## Solver pipeline

1. Parse the original problem.
2. Identify subject, topic, and grade level.
3. Generate a clear step-by-step solution.
4. Verify the answer.
5. Generate student-friendly explanation.
6. Generate visualization hints if useful.
7. Return structured data.

## Rules

- Do not return only the final answer.
- Do not hallucinate missing conditions.
- If the problem is incomplete, say what is missing.
- Use LaTeX for formulas.
- Keep the method suitable for the selected grade level.
- For middle school mode, avoid vectors, calculus, matrices, and advanced trigonometry.
- For geometry, introduce auxiliary lines before using them.
- For algebra, check restrictions and extraneous roots when relevant.