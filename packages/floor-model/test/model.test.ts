import { describe, expect, it } from 'vitest';
import example from '../../../fixtures/floor-v1.json';
import {
  deserializeFloorDocument, fixtureCorners, floorDocumentSchema, normalizeRotation,
  parseFloorDocument, polygonSchema, rotationToPlanDegrees, rotationToThreeY,
  serializeFloorDocument, transformPoint,
} from '../src';

const fresh = () => structuredClone(example);
const square = (x: number, z: number, size: number) => [
  { x, z }, { x: x + size, z }, { x: x + size, z: z + size }, { x, z: z + size },
];

describe('document contract', () => {
  it('round trips every persisted field without changing geometry', () => {
    const doc = parseFloorDocument(example);
    const loaded = deserializeFloorDocument(serializeFloorDocument(doc));
    expect(loaded).toEqual(example);
    expect(fixtureCorners(loaded.fixtures[0])).toEqual(fixtureCorners(doc.fixtures[0]));
  });

  it.each([
    ['future schema', (d: any) => { d.schemaVersion = 2; }],
    ['transient state', (d: any) => { d.selection = ['shelf-1']; }],
    ['nested unknown fields', (d: any) => { d.fixtures[0].position.y = 2; }],
    ['zero dimension', (d: any) => { d.fixtures[0].dimensions.width = 0; }],
    ['nonfinite coordinate', (d: any) => { d.fixtures[0].position.x = Infinity; }],
    ['nonfinite property', (d: any) => { d.fixtures[0].properties.capacity = NaN; }],
    ['undefined property', (d: any) => { d.fixtures[0].properties.capacity = undefined; }],
    ['negative rotation', (d: any) => { d.fixtures[0].rotation = -1; }],
    ['unnormalized rotation', (d: any) => { d.fixtures[0].rotation = Math.PI * 2; }],
    ['missing definition version', (d: any) => { d.fixtures[0].definition.version = 2; }],
    ['duplicate definition', (d: any) => { d.definitions.push(d.definitions[0]); }],
    ['duplicate entity ID', (d: any) => { d.walls[0].id = d.fixtures[0].id; }],
    ['unknown wall', (d: any) => { d.openings[0].wallId = 'missing'; }],
    ['opening beyond wall length', (d: any) => { d.openings[0].offset = 19; }],
    ['opening beyond wall height', (d: any) => { d.openings[0].sillHeight = 2; }],
    ['zero length wall', (d: any) => { d.walls[0].end = d.walls[0].start; }],
    ['whitespace ID', (d: any) => { d.floorId = ' floor '; }],
  ])('rejects %s', (_, mutate) => {
    const doc = fresh();
    mutate(doc);
    expect(floorDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it('retains instance values when different definition defaults are present', () => {
    const doc = fresh();
    doc.definitions.push({ ...doc.definitions[0], version: 2, defaultDimensions: { width: 8, depth: 2, height: 3 } });
    const parsed = parseFloorDocument(doc);
    expect(parsed.fixtures[0]).toEqual(example.fixtures[0]);
    expect(parsed.definitions).toHaveLength(2);
  });

  it('rejects invalid data before serialization and malformed JSON on load', () => {
    const doc = parseFloorDocument(example);
    doc.fixtures[0].dimensions.width = NaN;
    expect(() => serializeFloorDocument(doc)).toThrow();
    expect(() => deserializeFloorDocument('{')).toThrow();
  });
});

describe('polygon topology', () => {
  it('accepts a concave outer boundary with a hole', () => {
    expect(polygonSchema.safeParse({ outer: [
      { x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 4 },
      { x: 4, z: 4 }, { x: 4, z: 10 }, { x: 0, z: 10 },
    ], holes: [square(1, 1, 1).reverse()] }).success).toBe(true);
  });

  it.each([
    ['reversed outer', square(0, 0, 10).reverse(), []],
    ['wrong hole winding', square(0, 0, 10), [square(2, 2, 1)]],
    ['outside hole', square(0, 0, 10), [square(12, 2, 1).reverse()]],
    ['touching hole', square(0, 0, 10), [square(0, 2, 1).reverse()]],
    ['crossing hole', square(0, 0, 10), [square(9, 2, 2).reverse()]],
    ['overlapping holes', square(0, 0, 10), [square(2, 2, 3).reverse(), square(3, 3, 3).reverse()]],
    ['nested holes', square(0, 0, 10), [square(2, 2, 5).reverse(), square(3, 3, 1).reverse()]],
    ['repeated closing vertex', [...square(0, 0, 10), { x: 0, z: 0 }], []],
    ['self crossing', [{ x: 0, z: 0 }, { x: 10, z: 10 }, { x: 0, z: 10 }, { x: 8, z: 0 }], []],
    ['collinear', [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }], []],
    ['backtracking edge', [{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 5, z: 0 }, { x: 5, z: 5 }, { x: 0, z: 5 }], []],
  ])('rejects %s', (_, outer, holes) => {
    expect(polygonSchema.safeParse({ outer, holes }).success).toBe(false);
  });
});

describe('coordinate convention', () => {
  it.each([
    [0, 7, 4.4], [Math.PI / 2, 4.6, 6], [Math.PI, 3, 3.6],
  ])('aligns an asymmetric corner in plan and 3D at %s radians', (rotation, x, z) => {
    const local = { x: 2, z: 0.4 }, position = { x: 5, z: 4 };
    const plan = transformPoint(local, position, rotation);
    expect(plan.x).toBeCloseTo(x, 10);
    expect(plan.z).toBeCloseTo(z, 10);
    const y = rotationToThreeY(rotation);
    // Three.js right-handed Y rotation applied independently to the same local corner.
    expect(position.x + Math.cos(y) * local.x + Math.sin(y) * local.z).toBeCloseTo(plan.x, 10);
    expect(position.z - Math.sin(y) * local.x + Math.cos(y) * local.z).toBeCloseTo(plan.z, 10);
    const corners = fixtureCorners({ position, rotation, dimensions: { width: 4, depth: 0.8 } });
    expect(corners[2].x).toBeCloseTo(x, 10);
    expect(corners[2].z).toBeCloseTo(z, 10);
  });

  it('normalizes only through an explicit adapter', () => {
    expect(normalizeRotation(-Math.PI / 2)).toBeCloseTo(Math.PI * 1.5);
    expect(normalizeRotation(2 * Math.PI)).toBe(0);
    expect(rotationToPlanDegrees(Math.PI / 2)).toBe(90);
    expect(() => normalizeRotation(Infinity)).toThrow();
  });
});
