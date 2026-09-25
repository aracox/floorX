# Floor model v1

Milestone A adopts the preparation defaults as implementation decisions. All distances are meters in a fixed floor-local frame: X right, Z down in plan, Y up. Base elevation is explicit. Fixture positions anchor the footprint center; height grows from the floor elevation. Rotation is radians from +X toward +Z, stored in [0, 2π). A renderer uses degrees for Konva and negative Y radians for Three.js.

Geometry uses a 0.000001 m computational tolerance, independently of display rounding and snapping. Supported coordinates are within ±100,000 m; dimensions and wall/opening lengths must exceed tolerance. These are model limits, not business or regulatory thresholds.

Polygon rings omit a repeated closing vertex. Outer rings have positive signed X/Z area (clockwise on screen); holes have negative area. Rings must be simple, nondegenerate, and have no short edges. Holes must lie strictly inside the outer ring without touching or overlapping each other. Concave rings are supported. Walls use directed centerline endpoints and a symmetric thickness. Openings reference a wall ID and measure offset from its start along the centerline; width must fit the wall, and sill plus height must fit its height. Opening overlap is a future business-rule check.

Documents identify store, floor, layout and scenario independently. Entity IDs are nonempty opaque strings, unique across walls, openings, fixtures and zones in a document. Schema version 1 is separate from component definition versions and server revisions. Server concurrency metadata stays outside the saved layout until the API contract is implemented.

Definitions are embedded immutable snapshots identified by ID and positive integer version; instances refer to that exact pair and persist their own dimensions and complete property values. Changing library defaults never rehydrates or changes an existing instance. Asset keys are optional versioned metadata; missing assets use the rectangular primitive. Geometry remains authoritative. The initial model supports rectangular fixtures, polygon zones, polygon floor boundaries, straight walls and wall-attached door/entrance/exit openings.

Runtime parsing rejects unknown fields, unsupported schema versions, invalid geometry, duplicate IDs and missing references. No implicit migration, stripping or rounding is performed. Serialization validates before saving and parsing validates after loading. JSON properties contain only finite JSON values. Selection, viewport, camera, drag previews and save status are excluded. Migration to future schemas must be explicit and tested.

The editor, viewer and future backend consume this contract. Fixture containment, collisions, clearances, legal requirements, wall junction topology and egress analysis are outside schema validity and remain later milestones. Validation fixtures and tests can be reused when Python validation is introduced.

## Verification — 2026-09-25

Verified on Node.js 22.16.0 with pnpm 10.32.1, TypeScript 5.9.3, Vitest 4.0.18 and Zod 4.3.6. Dependency versions and engine requirements were checked against the npm registry before installation.

Actual commands executed:

- `npm exec --yes --package=pnpm@10.32.1 -- pnpm install --store-dir .pnpm-store` — installed workspace dependencies and generated `pnpm-lock.yaml`.
- `npm test` — passed all 36 domain acceptance tests.
- `npm run typecheck` — passed.
- `cmp AGENTS.md CLAUDE.md` and `cmp AGENTS.md GEMINI.md` — identical shared instructions.

The tests verify model behavior and the mathematical renderer rotation convention. They do not exercise Konva, Three.js, a browser, an API or a database. Milestone A is complete; milestone B is the next implementation increment.
