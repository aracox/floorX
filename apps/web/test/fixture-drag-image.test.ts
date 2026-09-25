import { expect, it } from 'vitest';
import { fixtureDragImageSize } from '../components/fixture-drag-image';

it('matches the placed fixture footprint at the current viewport zoom', () => {
  const dimensions = { width: 2.4, depth: 0.8 };
  expect(fixtureDragImageSize(dimensions, 32)).toEqual({ width: 77, height: 26 });
  expect(fixtureDragImageSize(dimensions, 48)).toEqual({ width: 115, height: 38 });
});
