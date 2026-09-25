# floorX

A sales-floor digital twin built around one versioned floor document. The current implementation includes a framework-independent TypeScript model, a versioned fixture catalog and an interactive 2D floor editor with multi-selection and clipboard editing. API persistence and the broader planner toolset are later milestones.

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

Open http://127.0.0.1:3000 after starting `pnpm dev`. Drag a fixture card from the palette onto the floor, select and move it, use its handles to resize or rotate it, then edit its numeric properties if needed. Shift-click fixtures to select a group and drag it together. Right-click a fixture to delete that object; Undo restores it. Copy, Paste and Duplicate are in the toolbar; Cmd/Ctrl+A, C, V and D provide shortcuts while the editor is focused. Keyboard users can focus a fixture card and press Enter or Space to place it at the view center. Use Undo/Redo for document edits and Cmd/Ctrl-drag to pan or Cmd/Ctrl-scroll to zoom. Save JSON downloads the layout as a file; Open JSON loads a saved file. Each save creates a new download, so keep the latest copy. Recover browser save can open layouts stored by the old Save locally action.

See `docs/editor-milestone.md` for the first editor slice, `docs/component-editor-increment.md` for the catalog and transform handles, and `docs/multi-selection-increment.md` for group editing. The internal copy buffer is local to one editor tab and does not use the operating-system clipboard.

## Current implementation

- `packages/floor-model`: Zod schemas, inferred TypeScript types, strict document parsing, JSON serialization and pure coordinate helpers.
- `packages/component-library`: stable fixture definitions and default dimensions/properties.
- `packages/state`: validated commands, transaction history, selection/drag state and pure viewport mapping.
- `apps/web`: Next.js editor, React Konva canvas, JSON file save/open and model inspector.
- `fixtures/floor-v1.json`: sample floor with a versioned gondola, wall, entrance and boundary hole.
- `docs/model-contract.md`: coordinates, anchors, topology, identity, versioning and validation policies.
- `packages/floor-model/test`: model, geometry and round-trip acceptance cases.

Workspace packages export TypeScript source for the web bundler. `pnpm --filter @floorx/web build` creates a production web build; there is no API server yet.

## Deployment

The `floorx` Vercel project is connected to `aracox/floorX` with `main` as its production branch. Set the framework to Next.js and the root directory to `apps/web`, with access to source files outside the root directory enabled so the app can import the shared `packages/` workspace. Vercel uses the repository's pinned pnpm version and lockfile. The current editor runs entirely in the browser, so it needs no deployment environment variables or backend service. Layouts are downloaded as JSON files and are not stored on Vercel. Pushes to `main` deploy to production through the Git integration.

The full product brief is in `plan.md`, and delivery sequencing is in `docs/preparation.md`.

Toolchain selection was checked against the npm registry engine requirements and the official [pnpm installation guide](https://pnpm.io/installation), [Vitest documentation](https://vitest.dev/guide/), and [Zod documentation](https://zod.dev/). Next.js 16.3.6 and React/ReactDOM 19.3.0 were checked against registry peer and engine requirements for the preview. React Konva 19.3.0, Konva 10.7.0 and Zustand 5.0.15 were verified against these versions for milestone B.
