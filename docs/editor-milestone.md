# Milestone B — first editor slice

The `/` route provides a React Konva editor backed by `@floorx/state` (Zustand). The previous JSON model inspector remains at `/model` as an independent inspection tool, not a second editor store. Both use the same floor-model contract. Only the canvas loads without server rendering; the surrounding interface remains server-rendered.

## Controls

- Dragging a palette card places its footprint center at the drop point; pressing Enter or Space on a focused card places one at the viewport center. Each instance gets a unique ID and a pinned definition snapshot.
- Select a fixture on the canvas or in the keyboard-accessible list. Drag to move it. Change X/Z, width/depth/height or rotation in the properties form, then choose Apply properties. Position and dimensions are meters; displayed rotation is clockwise degrees, persisted as normalized radians.
- Pan tool drags the viewport. Wheel zoom stays anchored to the pointer; toolbar zoom stays anchored to the viewport center. Fit floor frames the boundary. Pan and zoom never change saved geometry or history.
- Undo/redo buttons and Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z or Ctrl+Y restore document edits. Delete/Backspace removes a selected fixture. Shortcuts operate within the editor and ignore inputs, textareas, selects and editable text. Escape cancels an active fixture drag and clears selection. Escape can also cancel a canvas pan.
- At this original milestone, Save locally wrote one browser storage slot and the app initially opened the sample. The current editor opens `fixtures/blank-floor-v1.json`, saves JSON downloads, and can still recover earlier browser saves. Loading is undoable; a failed save, invalid file or corrupt stored document retains the current layout.

## State and geometry

All mutation commands validate the full floor document before committing. History contains at most 100 document snapshots, with one entry for an entire drag or properties submission. Drag previews are transient. Canceled/no-op moves do not create history. A new actual edit clears redo. Selection and viewport are transient, and save status compares the current serialized document against the last loaded/saved baseline. Only the document is persisted.

Browser client positions first subtract the canvas container offset, then invert viewport translation and pixels-per-meter scale. Konva fixture groups are centered in meter coordinates and use degrees only at the renderer boundary. The grid is visual only: there is no snapping in this milestone.

This slice supports one rectangular fixture type, numeric resize/rotation and single selection. Transform handles, multi-selection, nearby/grid snapping, clipboard duplication, full measurement tools, store/floor creation, API persistence and collision/containment enforcement remain later milestone work. The floor boundary, zones, walls and openings are visible but not graphically editable here. No multi-selection pivot or snap precedence is introduced yet.

## Verification — 2026-09-25

Automated coverage includes a rotated fixture moved through many previews and committed once; cancel/no-op history; add/delete and repeated undo/redo; redo invalidation; atomic invalid edits and loads; definition snapshot stability; viewport fitting and pointer mapping; zoom anchoring; local JSON round trip and storage failures. Floating-point coordinate checks use precision tighter than the model's computational tolerance.

Browser checks in Chrome:

- Added a gondola and edited its position to (8, 6), width to 3 m and rotation to 45°.
- Dragged the rotated fixture at 144% zoom; a single Undo restored (8, 6).
- Panned without changing fixture coordinates, then successfully dropped a new gondola from the palette at the translated/zoomed pointer location.
- Saved, reloaded the app, and used Load saved; all three fixtures and the edited dimensions/rotation returned.
- Backspace in a dimension input left all fixtures intact; submitting zero depth was blocked.
- The editor rendered without a hydration issue. The SVG-title hydration regression remains tested on `/model`.

Drag cancellation is covered in the store tests; Escape during a held mouse gesture has not been separately exercised in the browser. API, mobile/touch behavior and large-scene performance are not validated by these checks.

References: [Konva relative pointer position](https://konvajs.org/docs/sandbox/Relative_Pointer_Position.html), [pointer-centered zoom](https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html), and [Next.js client-only lazy loading](https://nextjs.org/docs/app/guides/lazy-loading).

Final configured checks: `npm test` passed 48 tests; `npm run typecheck` passed; `npm run build` from `apps/web` completed and prerendered `/` and `/model`. The development server remains on `http://127.0.0.1:3000`. Shared `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` were compared and remain identical.
