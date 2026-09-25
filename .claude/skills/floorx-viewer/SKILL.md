---
name: floorx-viewer
description: Plan, implement, or review floorX React Three Fiber rendering, 2D/3D alignment, GLB assets, and viewer selection.
---

# FloorX Viewer

Read `docs/preparation.md` and the actual domain coordinate contract. Honor planning-only scope.

Render the shared document directly; never reconstruct geometry from a 2D screenshot or maintain a second editable 3D document. Centralize angle/pivot conversion. For a floor-standing centered box, derive vertical center from floor elevation plus half its height. Check an asymmetric 90-degree fixture against the plan view and measurements.

Begin with primitives. Add GLB/glTF only with explicit authoring units, pivot, orientation, base dimensions, model version, and license/provenance. Normalize assets once and avoid shared cached geometry/material mutations between instances. Handle absent or failed assets with correctly sized primitives. Dispose only resources owned by the instance; do not dispose shared cached resources still in use.

Keep camera state out of layout history. Map raycast hits to domain IDs, share selection with 2D, and handle categories and occlusion deliberately. Use client-side boundaries for browser-dependent rendering and verify React/ReactDOM/R3F compatibility from official documentation when dependencies are selected: https://r3f.docs.pmnd.rs/getting-started/installation

Validate dimensions, pose, selection, and save/reload equivalence in both views. Handle unavailable WebGL and asset-load failure visibly. Profile draw calls, model sizes, and unnecessary rerenders on representative scenes before choosing instancing or more complex rendering. Photorealism and walkthrough polish do not precede model correctness.
