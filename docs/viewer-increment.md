# Initial 3D viewer

The workspace now switches between the editable 2D plan and a read-only 3D view. Both render the same in-memory, versioned floor document. The viewer does not store a second layout or add camera state to undo history or JSON files. Fixture selection is shared with the list and Properties panel; edits made in 2D or Properties appear in 3D immediately.

The first scene uses measured primitives: a polygon floor with boundary holes, zone surfaces, wall boxes split around openings, and rectangular fixture boxes. Its X/Z coordinates, base elevation, center anchors, dimensions, and negative Y rotation follow `model-contract.md`. The viewer supports orbit, pan, and zoom; unavailable WebGL produces a visible message. GLB assets, walkthrough controls, and 3D geometry editing remain later work.

The fixture and wall adapters have focused tests for asymmetric rotation, elevation, wall openings, and floor bounds. Browser verification covered floor and opening rendering, selection from the fixture list and by clicking a 3D fixture, and a Properties edit appearing after switching back to 2D. Camera drag gestures still need a manual interaction pass on the deployed build.
