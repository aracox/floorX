import { expect, it } from 'vitest';
import { fixtureCorners, parseFloorDocument } from '@floorx/floor-model';
import sample from '../../../fixtures/floor-v1.json';
import { fixtureBox, floorBounds, wallBoxes } from '../components/viewer-geometry';

it('aligns an asymmetric rotated fixture with the 2D footprint and floor elevation', () => {
  const document = parseFloorDocument({ ...sample, baseElevation: 2 });
  const fixture = document.fixtures[0];
  const box = fixtureBox(fixture, document.baseElevation);
  expect(box.position).toEqual([5, 2.9, 4]);
  expect(box.size).toEqual([4, 1.8, 0.8]);
  expect(box.rotationY).toBeCloseTo(-Math.PI / 2);
  const corner = fixtureCorners(fixture)[1];
  const [x, , z] = box.position;
  const [width, , depth] = box.size;
  expect(x + width / 2 * Math.cos(box.rotationY) - depth / 2 * Math.sin(box.rotationY)).toBeCloseTo(corner.x);
  expect(z - width / 2 * Math.sin(box.rotationY) - depth / 2 * Math.cos(box.rotationY)).toBeCloseTo(corner.z);
});

it('keeps the wall opening empty while retaining the wall above it', () => {
  const document = parseFloorDocument(sample);
  const boxes = wallBoxes(document);
  expect(boxes).toHaveLength(3);
  expect(boxes[0].position).toEqual([4.5, 1.5, 0]);
  expect(boxes[0].size).toEqual([9, 3, 0.2]);
  expect(boxes[1].position[0]).toBe(10);
  expect(boxes[1].position[1]).toBeCloseTo(2.6);
  expect(boxes[1].size[0]).toBe(2);
  expect(boxes[1].size[1]).toBeCloseTo(0.8);
  expect(boxes[2].position).toEqual([15.5, 1.5, 0]);
  expect(floorBounds(document)).toEqual({ centerX: 10, centerZ: 7.5, span: 20 });
});
