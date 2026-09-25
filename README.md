# floorX

A sales-floor digital twin built around one versioned floor document. The current implementation includes a framework-independent TypeScript model and an interactive 2D floor editor. API persistence and the broader planner toolset are later milestones.

## Development

Use Node.js 22.12 or newer and pnpm 10.32.1. The repository pins the package manager and runtime dependencies; `pnpm-lock.yaml` pins transitive dependencies.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm dev
```

If pnpm is not installed, run the same commands through `npm exec --yes --package=pnpm@10.32.1 -- pnpm`, for example:

```sh
npm exec --yes --package=pnpm@10.32.1 -- pnpm test
```

## Try the editor

Open http://127.0.0.1:3000 after starting `pnpm dev`. Add or drag a gondola from the palette, select and move it on the floor, then edit its properties. Use Undo/Redo for document edits and Pan/zoom for the view. Save locally keeps the layout in this browser; after reloading, choose Load saved. Export/import JSON moves documents between browsers.

The separate model inspector is at `/model`. See `docs/editor-milestone.md` for controls, scope and verification.

## Current implementation

- `packages/floor-model`: Zod schemas, inferred TypeScript types, strict document parsing, JSON serialization and pure coordinate helpers.
- `packages/state`: validated commands, transaction history, selection/drag state and pure viewport mapping.
- `apps/web`: Next.js editor, React Konva canvas, local save/load and model inspector.
- `fixtures/floor-v1.json`: sample floor with a versioned gondola, wall, entrance and boundary hole.
- `docs/model-contract.md`: coordinates, anchors, topology, identity, versioning and validation policies.
- `packages/floor-model/test`: model, geometry and round-trip acceptance cases.

Workspace packages export TypeScript source for the web bundler. `pnpm --filter @floorx/web build` creates a production web build; there is no API server yet.

The full product brief is in `plan.md`, and delivery sequencing is in `docs/preparation.md`.

Toolchain selection was checked against the npm registry engine requirements and the official [pnpm installation guide](https://pnpm.io/installation), [Vitest documentation](https://vitest.dev/guide/), and [Zod documentation](https://zod.dev/). Next.js 16.3.6 and React/ReactDOM 19.3.0 were checked against registry peer and engine requirements for the preview. React Konva 19.3.0, Konva 10.7.0 and Zustand 5.0.15 were verified against these versions for milestone B.
