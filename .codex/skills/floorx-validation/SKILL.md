---
name: floorx-validation
description: Define or review floorX collision, boundary, clearance rules and the geometry, API, and browser tests needed to verify them.
---

# FloorX Validation

Read `plan.md` and `docs/preparation.md`; honor preparation-only requests by producing acceptance cases rather than scaffolding test suites.

Separate polygon intersection, containment, boundary contact, nearest distance, usable aisle clearance, and route accessibility. Bounding boxes are a broad-phase filter, not proof of rotated-object overlap. Nearest fixture distance alone does not establish usable aisle width or accessible egress. Validate concave boundaries, holes, touching edges, near-zero gaps, rotations, and invalid rings with an explicit tolerance/contact policy.

Rules return stable rule IDs, severity, affected object IDs, measured values/units, configured thresholds, and an explanation. Keep thresholds configurable and versioned; plan examples are not legal standards. Distinguish advisory design feedback from hard save rejection and later route analysis.

For implementation, choose the smallest relevant checks: pure geometry/serialization and command-history tests; API revision/validation integration tests; real-browser editor workflow tests; visual checks for selection and 2D/3D alignment. Proposed runners are Vitest, pytest, and Playwright; verify current dependencies and repository scripts before running commands.

Use behavioral invariants: serialize/load preserves geometry; undo restores the prior document; redo restores the edit; inverse viewport mapping preserves world position; 2D/3D share IDs/poses; rejected saves retain unsaved changes. Include keyboard/property-panel workflows and renderer/asset failure recovery.

State representative fixture counts, hardware/browser, timing method, and measured outcomes before claiming performance. Simulation, congestion and sales-impact metrics require separately specified models and calibrated data; a collision check cannot validate them.
