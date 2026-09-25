---
name: floorx-editor
description: Plan, implement, or review floorX React Konva editing, pointer transforms, snapping, selection, and undo/redo.
---

# FloorX Editor

Read `docs/preparation.md` and the established floor-model contract first. Honor planning-only scope.

Translate browser pointer coordinates through container offset and inverse viewport transform before converting pixels to meters. Keep zoom/pan independent of document geometry; handle palette drops through the same mapping as existing-object drags. Document modifier keys, multi-selection pivot, and snap priority/tolerance in screen pixels versus world meters.

Use one committed domain command per completed gesture. Preview drag/resize/rotate locally, commit atomically on completion, and restore on cancel. Undo/redo should cover multi-object operations atomically, clear redo after a new edit, and avoid history entries for camera/selection changes. A no-op gesture creates no document revision. Do not autosave every pointer move.

Konva Transformer changes node scale. Normalize the completed scale into model width/depth and reset visual scale, accounting for the shared anchor and rotation; reject flips/degenerate dimensions unless explicitly supported. Source: https://konvajs.org/docs/react/Transformer.html

Provide keyboard-accessible fixture lists and labeled property inputs alongside canvas manipulation. Shortcuts must not delete fixtures while typing in a field. Specify focus, escape/cancel, delete, duplicate, copy/paste IDs, and undo behavior.

Verify at non-default pan/zoom and with rotation, multi-select, canceled gestures, snapping, and repeated undo/redo. Compare the saved domain document, not only screenshots. For large layouts profile selection subscriptions, layer redraws, and hit testing before optimizing.
