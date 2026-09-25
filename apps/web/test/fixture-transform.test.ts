import { expect, it } from 'vitest';
import { fixtureCorners, parseFloorDocument } from '@floorx/floor-model';
import sample from '../../../fixtures/floor-v1.json';
import { changesFromNodeTransform, hasMeaningfulTransform } from '../components/fixture-transform';

const original = parseFloorDocument(sample).fixtures[0];
it('normalizes an asymmetric rotated resize into dimensions and center position', () => {
  const changes = changesFromNodeTransform(original, {
    x: 8, z: 6, rotationDegrees: 135, scaleX: 1.5, scaleY: 0.5,
  });
  expect(changes.position).toEqual({ x: 8, z: 6 });
  expect(changes.rotation).toBeCloseTo(3 * Math.PI / 4, 12);
  expect(changes.dimensions).toEqual({ width: 6, depth: 0.4, height: 1.8 });
  const corners = fixtureCorners({ ...original, ...changes });
  expect(corners[0].x).toBeCloseTo(8 + 3 / Math.sqrt(2) + 0.2 / Math.sqrt(2));
  expect(corners[0].z).toBeCloseTo(6 - 3 / Math.sqrt(2) + 0.2 / Math.sqrt(2));
});
it('normalizes a negative or full-turn rotation while keeping height', () => {
  expect(changesFromNodeTransform(original, { x: 5, z: 4, rotationDegrees: -90, scaleX: 1, scaleY: 1 }).rotation).toBeCloseTo(3 * Math.PI / 2);
  expect(changesFromNodeTransform(original, { x: 5, z: 4, rotationDegrees: 360, scaleX: 1, scaleY: 1 }).rotation).toBe(0);
});
it.each([
  { x: 5, z: 4, rotationDegrees: 0, scaleX: -1, scaleY: 1 },
  { x: 5, z: 4, rotationDegrees: 0, scaleX: 0, scaleY: 1 },
  { x: Infinity, z: 4, rotationDegrees: 0, scaleX: 1, scaleY: 1 },
  { x: 5, z: 4, rotationDegrees: 0, scaleX: 1e-10, scaleY: 1 },
])('rejects invalid transforms', (node) => {
  expect(() => changesFromNodeTransform(original, node)).toThrow();
});

it('ignores a no-op gesture and treats a full turn as the same orientation', () => {
  const unchanged = changesFromNodeTransform(original, {
    x: original.position.x, z: original.position.z,
    rotationDegrees: 450, scaleX: 1, scaleY: 1,
  });
  expect(hasMeaningfulTransform(original, unchanged)).toBe(false);
  expect(hasMeaningfulTransform(original, {
    ...unchanged, dimensions: { ...unchanged.dimensions, depth: 1.1 },
  })).toBe(true);
});
