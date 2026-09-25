import { expect, it } from 'vitest';
import { fixtureCatalog } from '@floorx/component-library';
import { parseFloorDocument, deserializeFloorDocument, serializeFloorDocument } from '@floorx/floor-model';
import { createEditorStore } from '@floorx/state';
import sample from '../../../fixtures/floor-v1.json';

it('adds two different versioned fixture types and preserves their snapshots after save/load', () => {
  const store = createEditorStore(parseFloorDocument(sample));
  const freezer = fixtureCatalog.find((definition) => definition.id === 'freezer')!;
  const checkout = fixtureCatalog.find((definition) => definition.id === 'checkout')!;
  store.getState().addFixture('freezer-1', freezer, { x: 8, z: 6 });
  store.getState().addFixture('checkout-1', checkout, { x: 12, z: 6 });
  const loaded = deserializeFloorDocument(serializeFloorDocument(store.getState().document));
  expect(loaded.fixtures).toHaveLength(3);
  expect(loaded.fixtures[1].definition).toEqual({ id: 'freezer', version: 1 });
  expect(loaded.fixtures[2].dimensions).toEqual(checkout.defaultDimensions);
  expect(loaded.definitions.find((definition) => definition.id === 'freezer')).toEqual(freezer);
  store.getState().undo();
  expect(store.getState().document.fixtures).toHaveLength(2);
  store.getState().redo();
  expect(store.getState().document).toEqual(loaded);
});

it('stores a rotated canvas resize as one undoable edit and round trips the result', async () => {
  const { changesFromNodeTransform } = await import('../components/fixture-transform');
  const store = createEditorStore(parseFloorDocument(sample));
  const fixture = store.getState().document.fixtures[0];
  const changes = changesFromNodeTransform(fixture, {
    x: 5, z: 4, rotationDegrees: 135, scaleX: 1.5, scaleY: 0.5,
  });
  store.getState().updateFixture(fixture.id, changes);
  expect(store.getState().past).toHaveLength(1);
  const loaded = deserializeFloorDocument(serializeFloorDocument(store.getState().document));
  expect(loaded.fixtures[0].dimensions).toEqual({ width: 6, depth: 0.4, height: 1.8 });
  expect(loaded.fixtures[0].rotation).toBeCloseTo(3 * Math.PI / 4, 12);
  store.getState().undo();
  expect(store.getState().document.fixtures[0]).toEqual(fixture);
});
