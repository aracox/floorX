---
name: floorx-model
description: Design or review floorX floor schemas, coordinate transforms, component definitions, and domain package boundaries.
---

# FloorX Model

Read `plan.md` and `docs/preparation.md` from the repository root. Distinguish established requirements from proposed conventions; preparation requests produce contracts and decisions, not application code.

Keep a serializable document in meters on the X/Z plane with Y as height. Specify origin, fixture pivot, rotation unit/direction, floor elevation, polygon winding/holes, numeric tolerance, and minimum dimensions before writing adapters. Use an asymmetric rotated fixture to expose mirrored or sign-inverted transforms. Never infer angle units from the example value 90 alone.

Separate the persisted floor document from viewport, selection, tool state, and transient gestures. Identify stable object IDs, document schema version, component-definition version, and server revision independently. Define the migration/error policy for unknown versions and invalid dimensions, coordinates, polygon rings, or missing references.

Model definitions provide defaults; placed instances retain dimensions and business-property overrides. Resolve assets by stable keys/version, with a primitive fallback. Specify wall/door relationships and floor boundary holes rather than forcing every building element into the rectangular-fixture schema.

Keep `floor-model` and geometric rules framework-independent. Share validation cases across TypeScript/Zod and Python/Pydantic; generated API types do not replace runtime validation. Output an explicit contract, affected consumers, and round-trip/geometry acceptance cases for the requested change.
