# floorX agent instructions

## Current scope

floorX is a web-based sales-floor digital twin. Read `plan.md` for the product brief and `docs/preparation.md` for its analysis, proposed milestones, and pending decisions.

The user authorized implementation on 2026-09-25. Milestones A (model contract) and B (first editor slice) are implemented; follow the documented delivery sequence in `docs/preparation.md`. Create only packages needed for the active milestone. Do not request permission again for implementation work already authorized; keep later product phases out of the active deliverable.

The pnpm workspace contains the pure TypeScript floor model and Vitest tests. `pnpm test` and `pnpm typecheck` are the configured checks. A Next.js/React Konva editor lives in `apps/web`, with controls and verification in `docs/editor-milestone.md`; start it with `pnpm dev`. There is no backend or Git repository yet. Do not claim browser/API checks passed before those surfaces exist. Record actual commands when tooling is introduced.

## Architecture

- Follow the requested Next.js/React/TypeScript, React Konva, React Three Fiber, Zustand, Zod, FastAPI, PostgreSQL/PostGIS direction. Verify compatible versions when scaffolding is authorized.
- Use the planned monorepo: `apps/web`, `packages/floor-model`, `packages/component-library`, `packages/business-rules`, `packages/api-client`, `packages/state`, `packages/3d-core`, and `backend`. Create packages only as needed; mobile and simulation are later phases.
- Maintain one serializable, versioned floor model. The 2D editor, 3D viewer, persistence, and future simulation consume it. Never persist canvas nodes or Three.js objects as domain state.
- Internal length units are meters; the floor plane is X/Z and height is Y. Follow the origin, rotation, anchor, and tolerance decisions in `docs/model-contract.md` for transforms.
- Keep domain geometry and rules independent of React, Konva, Three.js, browser APIs, and database access. Keep selection, camera, viewport, and drag previews separate from saved documents.
- Product fixtures and component definitions need stable IDs and explicit versions. A library update must not silently change a saved layout.
- Treat business-rule thresholds as configurable product inputs. Values in `plan.md` are examples, not verified building or fire-code requirements.

## Skills

Use only the skills relevant to the requested work:

| Skill | Use for |
| --- | --- |
| `floorx-model` | Coordinates, geometry, document schema, component versions, package boundaries |
| `floorx-editor` | Konva interactions, snapping, commands, history, accessible property editing |
| `floorx-viewer` | R3F transforms, selection, primitive/GLB rendering and resource lifecycle |
| `floorx-persistence` | FastAPI contracts, save/load, revisions, autosave and scenario isolation |
| `floorx-validation` | Collision, containment, clearance, domain tests and browser verification |

Canonical skills live in `.codex/skills`; `.agents/skills` links there for current Codex discovery. Claude and Gemini have corresponding project skill entries. Keep shared floorX skills synchronized across the three clients.

For planning-only work, produce analysis and reviewable proposals; an end-to-end workflow ends when that requested deliverable is verified. Consulting another CLI is optional and read-only, only when it adds value and is authorized. Continue locally if it is unavailable. Do not hard-code a different owner model or claim to switch models. Do not delegate trivial tasks.

## Working and verification

Preserve user changes. Make the smallest change that meets the request. Keep the shared content of `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` identical.

Once implementation is authorized, use focused tests for geometry, serialization, command history, and API conflicts; use browser interaction checks for editor workflows. Test observable outcomes, including rotated fixtures, zoomed pointer coordinates, and save/reload equivalence. Introduce the chosen runner/configuration with actual code, not placeholder commands.

Keep TypeScript formatting at two spaces and Python at four. Commit lockfiles once generated. Keep credentials, local environments, caches, generated output, and personal settings out of version control. Do not put secrets in consultation prompts.
