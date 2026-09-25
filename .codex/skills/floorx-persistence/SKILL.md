---
name: floorx-persistence
description: Design or review floorX FastAPI contracts, PostgreSQL/PostGIS persistence, autosave conflicts, and scenario versioning.
---

# FloorX Persistence

Read `docs/preparation.md` and the document schema. Honor planning-only scope; do not create a backend or migrations during preparation.

Separate Store, Floor, editable Layout/Scenario, immutable Revision, and versioned ComponentDefinition identities. Define which geometry belongs to the shared physical floor and which may vary per scenario. A clone has independent history; restoring an old revision creates a new revision instead of erasing history. Define who may publish and what publishing changes before implementing it.

Use FastAPI OpenAPI as the transport contract and generate client types when the API exists. Keep runtime validation on both sides and run common accepted/rejected document fixtures against both schema implementations. Maintain stable operation IDs. Reference: https://fastapi.tiangolo.com/advanced/generate-clients/

Validate full-document writes, stable IDs, size limits, asset references, and ownership server-side. Use expected revision/ETag semantics to reject stale saves. Debounce autosave after committed commands; ensure late responses cannot mark newer edits saved, retries cannot duplicate revisions, and scenario switches cannot save into the wrong document. Show pending, saving, saved, failed, and conflict states. Do not promise offline support unless scoped.

Use a transaction for document and revision changes. Decide JSON document versus relational/spatial projections explicitly; derived geometry must be rebuilt transactionally from the canonical document. Local floor meters are not longitude/latitude. Specify local planar geometry/SRID policy before PostGIS use; never label indoor coordinates EPSG:4326 to obtain meter distances. Reference: https://postgis.net/docs/ST_Distance.html

Test round trips, malformed/unknown versions, stale and out-of-order saves, cross-scenario isolation, failed saves, and restore semantics. Establish authentication and store access before any shared deployment; do not silently invent a tenancy/provider choice.
