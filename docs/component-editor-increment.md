# Milestone C increment: fixture catalog and canvas transforms

The editor now offers six rectangular fixture definitions: standard gondola, wall shelf, display rack, freezer, checkout counter and promotion island. Definitions live in `packages/component-library` with stable IDs and explicit version 1. Their dimensions and business properties are illustrative defaults, not code or regulatory requirements. Placed instances retain their saved dimensions, properties and embedded definition snapshots, so a future catalog update cannot silently alter a saved layout. Palette cards are draggable; keyboard users can focus a card and press Enter or Space to place it at the view center. Their names appear in the fixture list and properties panel.

Selecting a fixture reveals Konva handles for width/depth resizing and rotation. The control scales from the fixture center, disallows flips and rejects invalid dimensions. Konva's transient node scale is converted into model dimensions after the gesture; rotation is converted to normalized radians. A finished gesture commits one document edit, while an ignored or canceled gesture leaves history unchanged. Existing numeric inputs remain the keyboard-accessible way to edit size and angle. The fixed height remains editable in properties because the plan view has no vertical handle.

The interaction is single-fixture only. Snapping, multi-selection, clipboard operations, measurement tools, more building topology types and API persistence remain future work. The palette's fixture colors are presentation hints and are not persisted geometry.

Verification: the catalog and transform unit tests cover unique IDs and versions, rotated asymmetric resize geometry, invalid/negative scales, no-op transforms, multiple fixture types, serialization and undo. The browser check confirmed six catalog entries and a rotated fixture's resize handle changing depth from 0.8 m to 3.925 m; one Undo restored 0.8 m. TypeScript and production-build checks are recorded in the turn output.

A browser gesture on the rotation handle and Escape during an active transform could not be checked after the browser automation approval service hit its usage limit. Rotation conversion has a pure-unit test and move cancellation has store tests. Transform cancellation is implemented but remains unverified in the browser.

[Konva Transformer guide](https://konvajs.org/docs/react/Transformer.html) and [Transformer API](https://konvajs.org/api/Konva.Transformer.html) describe the node-scale behavior and handle options used here.
