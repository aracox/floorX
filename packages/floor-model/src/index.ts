import { z } from 'zod';
import { distance, EPSILON, TAU, validPolygon } from './geometry';
export * from './geometry';

const id = z.string().min(1).refine((s) => s.trim() === s && s.trim().length > 0, 'IDs must not contain surrounding whitespace');
const coordinate = z.number().finite().min(-100_000).max(100_000);
const length = z.number().finite().gt(EPSILON).max(100_000);
const version = z.number().int().positive();
const properties = z.record(z.string(), z.json());
export const pointSchema = z.strictObject({ x: coordinate, z: coordinate });
export const dimensionsSchema = z.strictObject({ width: length, depth: length, height: length });
const ring = z.array(pointSchema).min(3);
export const polygonSchema = z.strictObject({ outer: ring, holes: z.array(ring) })
  .refine((p) => validPolygon(p.outer, p.holes), 'Invalid polygon topology or winding');
export const componentDefinitionSchema = z.strictObject({
  id, version, name: z.string().min(1),
  kind: z.literal('rectangular-fixture'),
  defaultDimensions: dimensionsSchema,
  defaultProperties: properties,
  asset: z.strictObject({ key: id, version }).optional(),
});
export const fixtureSchema = z.strictObject({
  id, definition: z.strictObject({ id, version }),
  position: pointSchema,
  rotation: z.number().finite().min(0).lt(TAU),
  dimensions: dimensionsSchema,
  properties,
});
export const wallSchema = z.strictObject({
  id, start: pointSchema, end: pointSchema, thickness: length, height: length,
}).refine((wall) => distance(wall.start, wall.end) > EPSILON, 'Wall must have nonzero length');
export const openingSchema = z.strictObject({
  id, wallId: id, kind: z.enum(['door', 'entrance', 'exit']),
  offset: z.number().finite().min(0), width: length, height: length,
  sillHeight: z.number().finite().min(0),
});
export const zoneSchema = z.strictObject({ id, name: z.string().min(1), boundary: polygonSchema, properties });
export const floorDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1), storeId: id, floorId: id, layoutId: id, scenarioId: id,
  name: z.string().min(1), baseElevation: coordinate,
  boundary: polygonSchema,
  definitions: z.array(componentDefinitionSchema),
  fixtures: z.array(fixtureSchema), walls: z.array(wallSchema),
  openings: z.array(openingSchema), zones: z.array(zoneSchema),
}).superRefine((doc, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const ids = new Set<string>();
  for (const entity of [...doc.fixtures, ...doc.walls, ...doc.openings, ...doc.zones]) {
    if (ids.has(entity.id)) fail(`Duplicate entity ID: ${entity.id}`);
    ids.add(entity.id);
  }
  const key = (ref: { id: string; version: number }) => JSON.stringify([ref.id, ref.version]);
  const definitions = new Set<string>();
  for (const definition of doc.definitions) {
    if (definitions.has(key(definition))) fail(`Duplicate definition: ${key(definition)}`);
    definitions.add(key(definition));
  }
  for (const fixture of doc.fixtures) {
    if (!definitions.has(key(fixture.definition))) fail(`Missing definition for ${fixture.id}`);
  }
  for (const opening of doc.openings) {
    const wall = doc.walls.find((w) => w.id === opening.wallId);
    if (!wall) fail(`Missing wall for ${opening.id}`);
    else if (opening.offset + opening.width > distance(wall.start, wall.end) + EPSILON ||
      opening.sillHeight + opening.height > wall.height + EPSILON) fail(`Opening exceeds wall: ${opening.id}`);
  }
});

export type FloorDocument = z.infer<typeof floorDocumentSchema>;
export type Fixture = z.infer<typeof fixtureSchema>;
export type ComponentDefinition = z.infer<typeof componentDefinitionSchema>;
export const parseFloorDocument = (value: unknown): FloorDocument => floorDocumentSchema.parse(value);
export const serializeFloorDocument = (document: FloorDocument): string => JSON.stringify(parseFloorDocument(document));
export const deserializeFloorDocument = (json: string): FloorDocument => parseFloorDocument(JSON.parse(json));
