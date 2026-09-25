---
name: looping-engineer
description: Carry a requested engineering deliverable through analysis and verification, including planning-only deliverables, without expanding its scope.
---

# Looping Engineer

Keep Gemini as the owner. Read repository guidance, define observable success criteria for the user's requested deliverable, and identify the smallest useful task list.

For planning or preparation, perform analysis and update only requested documentation, skills, or configuration. Do not proceed into application scaffolding, dependencies, or features. For authorized implementation, make the smallest relevant change and verify its behavior using actual configured checks.

Use relevant floorX skills for non-obvious domain constraints. Consult consult-codex or consult-claude only when a focused read-only review would materially help and consultation is available and authorized. Keep the active model; honor explicit model preferences. Do not create duplicate implementation owners.

Repeat inspection, scoped changes, and focused verification until the requested success criteria are met or an actual dependency needs user input. Preserve unrelated changes. Report changed files, evidence, and remaining limitations. Do not invent test results or keep working into a later product phase after the requested deliverable is done.
