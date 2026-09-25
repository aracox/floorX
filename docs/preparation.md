# floorX preparation and implementation readiness

Status: implementation authorized by the user on 2026-09-25. Milestones A and B are implemented, and the first milestone C increment is implemented in `component-editor-increment.md`; see `editor-milestone.md` for the editor scope and verification; see `model-contract.md` for adopted conventions and `../README.md` for configured checks. The proposal and historical preparation notes below remain context; they do not describe the current tooling inventory.

## Source and assessment

`plan.md` is the original product brief and remains unchanged. Its central decision is sound: a structured floor document in meters drives 2D, 3D, persistence, and future simulation. Keep its chosen web stack and defer AI, optimization, enterprise data, mobile, and photorealism.

The plan needs explicit contracts before coding:

| Gap | Why it matters | Proposed resolution |
| --- | --- | --- |
| Release 1 excludes 3D/rules, but section 17 includes both | Two different definitions of MVP | Deliver a 2D planner first, then a small rules/primitive-3D increment; confirm which is the first external release |
| Position and rotation have no origin/pivot/unit/sign convention | 2D and 3D can mirror, drift, or rotate differently | Ratify the coordinate proposal below before model implementation |
| Fixture example is insufficient for walls, holes, and openings | A rectangle cannot encode all physical topology | Define discriminated domain types and parent/reference relationships |
| Component Version, Scenario, Layout and Revision overlap | Library updates and restores can silently alter documents | Define stable identities, immutable revision semantics, and versioned definitions |
| Autosave/history are listed without transaction/conflict behavior | Gestures can flood history or overwrite newer edits | One command per gesture plus revision-checked writes |
| Frontend and Python each validate data | Contracts can diverge | OpenAPI transport contract plus shared valid/invalid document cases |
| Aisle, overlap and egress checks are grouped together | Minimum distance is not a usable passage or egress analysis | Separate geometric checks from passage/path analysis |
| No users, deployment or scale profile specified | Access control and performance cannot be sized | Decide before shared deployment and performance commitments |

## Proposed delivery sequence

These are implementation recommendations, not completed work or new user-approved requirements.

| Milestone | Scope | Evidence required before proceeding |
| --- | --- | --- |
| A: Model contract | IDs, schema version, coordinate system, component definition/instance split, boundary/wall/opening types | Valid/invalid examples; transform and serialization acceptance cases; version policy |
| B: First editor slice | One fixture type, placement, select/move, numeric properties, undo/redo, local document round trip | Same geometry after save/load; one gesture equals one undo; pan/zoom never alters the floor |
| C: Planner MVP | Required component catalog, resize/rotate, snapping, multi-select, copy/paste, keyboard operations, measurements, store/floor creation, API save/load | Browser workflow and API validation/conflict checks; failed saves retain edits |
| D: Initial digital twin | Configurable overlap/containment checks and scoped clearance feedback; primitive 3D from the same model | Rotated fixtures and boundary holes behave correctly; matching 2D/3D dimensions and pose |
| E: Scenarios and richer assets | Clone, compare supported geometry/business metrics, revisions, restore, approved publishing semantics, GLB models | Independent scenario history; no silent definition upgrades; role/approval rules agreed |
| Later | Pathfinding, calibrated traffic simulation, integrations, optimization, AI, mobile | Separate requirements and measured model validity before claiming predictive outcomes |

Bring basic scenario identity into the persistence contract early; defer full comparison/publishing UX until its semantics are defined. A simple primitive 3D check during model work may be useful once implementation is authorized, but it must not displace editor correctness.

## Proposed coordinate and document conventions

Established by the brief: meters internally, X/Z floor plane, Y height, one shared floor model.

Defaults adopted for milestone A (details and validation limits in `model-contract.md`):

- Floor-local origin is fixed for the life of a floor; plan X points right and Z points down. Floor base elevation defaults to zero.
- Rectangular fixture position is its footprint center; width is its local X extent, depth its local Z extent. Height extends upward from the floor/base elevation.
- Persist rotation in radians, positive from +X toward +Z (clockwise in the plan), normalized to `[0, 2π)`. Convert to degrees only at UI/Konva boundaries and use negative Y rotation for the corresponding Three.js transform. Verify an asymmetric fixture at 0, 90, and 180 degrees before adopting this adapter.
- Keep polygons, walls and doors as explicit geometries with their own documented anchors. Define ring winding, holes, wall thickness and opening attachment rather than extrapolating from fixture-center rules.
- Keep computational tolerance separate from displayed measurement rounding and user snapping thresholds. Select numeric tolerances based on expected floor dimensions and meaningful minimum feature size; reject nonfinite values and nonpositive fixture dimensions.
- Distinguish `schemaVersion` (document format), component definition version (library), and server revision (concurrency). Unknown future formats should fail visibly instead of being silently truncated.
- Save component dimensions/properties and explicit definition versions in instances. Asset replacement must not change business geometry without an explicit migration.
- Separate persistent domain state, transient interaction state, and server save status. Selection and camera changes do not create layout revisions.

Milestone A implements these conventions in `packages/floor-model`; later changes require explicit contract updates and regression coverage.

## Stack and package boundaries

Keep Next.js + React + TypeScript for the web shell, React Konva for editing, R3F/Three.js for visualization, Zustand for client state, Zod for runtime frontend validation, FastAPI/Pydantic for the API, and PostgreSQL/PostGIS for persistence/spatial queries as specified in `plan.md`.

Proposed tooling once scaffolding is requested: pnpm workspace for TypeScript packages, uv for Python, Vitest for pure TypeScript behavior, pytest for backend tests, and Playwright for browser flows. Confirm versions and lock dependencies together at that time; no runtime versions or package manifests are pinned during this preparation step.

| Package/path | Responsibility | Avoid |
| --- | --- | --- |
| `apps/web` | Next.js shell, editor panels, browser renderer integration | Owning a second floor schema |
| `packages/floor-model` | Serializable domain definitions, validation, pure coordinate helpers | React, canvas, database dependencies |
| `packages/component-library` | Versioned fixture definitions and asset metadata | Renderer objects in saved definitions |
| `packages/business-rules` | Deterministic checks and structured findings | Hard-coded regulatory claims |
| `packages/state` | Commands/history, selection and document state boundaries | Server autosave side effects in geometry functions |
| `packages/api-client` | Generated transport types/client, explicit domain adapters | Hand-maintained copies of API DTOs |
| `packages/3d-core` | Renderer-specific normalization and asset adapters when needed | Importing Three.js into the pure floor model |
| `backend` | FastAPI, validation, persistence, revision control | Separate authoritative geometry conventions |

Create only the packages required by the active milestone. Do not create empty mobile/simulation services now. Next.js browser-only rendering boundaries and React/ReactDOM/R3F compatibility must be checked when scaffolding.

For persistence, prefer a versioned canonical layout document with explicit metadata and revisions; spatial/index projections are derived and rebuilt consistently. Decide the storage design before migrations. Local indoor coordinates are planar meters, not WGS84 latitude/longitude. PostGIS distance uses the spatial reference's units; choosing geography or EPSG:4326 by habit would be incorrect for these local coordinates. [PostGIS distance documentation](https://postgis.net/docs/ST_Distance.html)

## Verification plan for future implementation

- Domain: rotation/anchor adapters, concave boundary and holes, degenerate input, serialization, definition-version stability, undo/redo/cancel, and identical geometry after loading.
- Editor: palette drop with pan/zoom, rotated resize, multi-select pivot, snap priority, text-input shortcut isolation, accessible property editing, and whole-gesture history.
- API: matching frontend/backend validation, stale revision rejection, retries, out-of-order responses, scenario-switch isolation, save failure recovery, and restore creating a new revision.
- Viewer: shared IDs and selection, pose/dimension alignment, primitive fallback, missing GLB, shared resource ownership, and unavailable WebGL.
- Rules: rotated intersections, boundary touching policy, holes and forbidden zones. Treat narrow gaps, usable aisle width and connected egress paths as distinct checks.
- Performance: propose benchmark scenes of 100, 1,000 and 5,000 fixtures; confirm representative counts and target device/browser before committing to latency/FPS budgets. Record actual measurements rather than claiming scalability from architecture alone.

The domain acceptance cases for milestone A are implemented in Vitest. Editor, API, viewer and rules checks remain planned until those surfaces exist.

## Decisions still needed

Decide at the relevant milestone rather than blocking preparation:

1. First external release: 2D planner only, or planner plus simple 3D/basic rules?
2. Editing users and deployment: local/single operator, internal team, or multi-tenant product? Who may approve/publish?
3. Expected floor size, fixture count, browser/device baseline, and whether touch editing is required initially.
4. Boundary/import scope: manually drawn polygons, dimensions, image/PDF underlay, or CAD import? No import pipeline is assumed.
5. Whether scenarios may alter walls/boundaries or only fixtures; how shared building geometry changes propagate.
6. Which rule thresholds and fixture metadata come from the business, and whether any jurisdiction-specific review is required.
7. Offline expectations, save retention, collaboration/conflict UX, asset source/licensing, and hosting constraints.

## Prepared configuration and skills

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`: synchronized floorX architecture, preparation boundary, skill routing, and verification guidance.
- `.codex/config.toml`: workspace-write sandbox and on-request approvals, with the user's model preferences inherited. These are project defaults, not a replacement for enforced session/organization policies. [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- `.agents/skills` links to `.codex/skills`: current Codex discovery with one canonical copy. [Codex skill discovery](https://learn.chatgpt.com/docs/build-skills)
- `.claude/settings.json`: minimal shared read-only Git inspection grants. Copied `.claude/settings.local.json` blanket execution grants were cleared; normal inherited permission settings remain in effect. [Claude settings](https://code.claude.com/docs/en/settings)
- `.editorconfig`: consistent whitespace with four-space Python and two-space defaults; `.gitignore`: local settings, secrets, caches, dependencies and build/test outputs.
- Five custom skills, available to Codex, Claude and Gemini: `floorx-model`, `floorx-editor`, `floorx-viewer`, `floorx-persistence`, `floorx-validation`.
- Existing orchestration/looping skills now preserve planning-only scope, use the active model, and consult other CLIs only when useful and authorized. Existing consultation wrappers remain available and unchanged; their presence/authentication does not guarantee a supported CLI invocation until checked when used.

Custom skills were chosen over a downloaded generic bundle because floorX's main risks are domain contracts and renderer consistency. No external skill code, new MCP service, application dependency or global agent configuration was installed.

Local tool inventory during preparation: Node, Python 3.14.7, uv, Claude CLI and agy were found on PATH. pnpm and Docker were not found on PATH; that is not proof they are absent elsewhere. Runtime compatibility and CLI authentication have not been validated. Install/select application tooling when implementation is requested.

Restart or reopen the agent session if newly added skills do not appear. Discovery is prepared on disk; this preparation does not prove each client has reloaded it.

## Focused official references

- [Konva React Transformer](https://konvajs.org/docs/react/Transformer.html): resize changes scale; normalize it into domain dimensions on completion.
- [R3F installation](https://r3f.docs.pmnd.rs/getting-started/installation): verify framework/React compatibility at dependency selection. The documentation search result was available during preparation, but direct retrieval failed; no exact compatibility versions are asserted here.
- [FastAPI generated clients](https://fastapi.tiangolo.com/advanced/generate-clients/): OpenAPI-based client generation and stable operation identifiers.
- [PostGIS distance](https://postgis.net/docs/ST_Distance.html): geometry distance is planar and expressed in spatial-reference units.
