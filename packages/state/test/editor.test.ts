import { describe, it, expect } from 'vitest';
import { parseFloorDocument, serializeFloorDocument, fixtureCorners } from '@floorx/floor-model';
import sample from '../../../fixtures/floor-v1.json';
import { createEditorStore, fitViewport, screenToFloor, zoomAt } from '../src';

const setup = () => createEditorStore(parseFloorDocument(sample));
describe('editor commands and history', () => {
  it('commits many drag previews as one undoable move of a rotated fixture', () => {
    const store = setup();
    const original = serializeFloorDocument(store.getState().document);
    store.getState().beginMove('shelf-1');
    for (let i = 1; i < 30; i++) store.getState().previewMove({ x: i, z: 7 });
    expect(serializeFloorDocument(store.getState().document)).toBe(original);
    expect(store.getState().past).toHaveLength(0);
    store.getState().finishMove();
    const moved = store.getState().document.fixtures[0];
    expect(moved.position).toEqual({ x: 29, z: 7 });
    expect(moved.rotation).toBe(Math.PI / 2);
    expect(store.getState().past).toHaveLength(1);
    store.getState().undo();
    expect(serializeFloorDocument(store.getState().document)).toBe(original);
    store.getState().redo();
    expect(store.getState().document.fixtures[0]).toEqual(moved);
  });

  it('cancels a gesture and ignores no-op moves without consuming history', () => {
    const store = setup(), original = store.getState().document;
    store.getState().beginMove('shelf-1');
    store.getState().previewMove({ x: 10, z: 12 });
    store.getState().cancelMove();
    store.getState().finishMove();
    expect(store.getState().document).toEqual(original);
    store.getState().beginMove('shelf-1');
    store.getState().finishMove();
    expect(store.getState().past).toHaveLength(0);
  });

  it('does not create history or dirty a document on selection, pan or zoom', () => {
    const store = setup();
    store.getState().select('shelf-1');
    store.getState().setViewport({ x: -20, y: 85, scale: 81 });
    expect(store.getState().past).toHaveLength(0);
    expect(serializeFloorDocument(store.getState().document)).toBe(store.getState().savedJson);
  });

  it('applies all property fields atomically, rejects invalid edits and preserves redo until a real edit', () => {
    const store = setup();
    store.getState().updateFixture('shelf-1', { rotation: Math.PI, dimensions: { width: 2, depth: 1, height: 2 } });
    expect(store.getState().past).toHaveLength(1);
    store.getState().undo();
    const original = store.getState().document;
    expect(() => store.getState().updateFixture('shelf-1', { dimensions: { width: -1, depth: 1, height: 2 } })).toThrow();
    expect(store.getState().document).toBe(original);
    store.getState().updateFixture('shelf-1', { position: original.fixtures[0].position });
    expect(store.getState().future).toHaveLength(1);
    store.getState().updateFixture('shelf-1', { position: { x: 1, z: 2 } });
    expect(store.getState().future).toHaveLength(0);
  });

  it('supports add/delete/undo/redo and immutable definition defaults', () => {
    const store = setup();
    const definition = structuredClone(store.getState().document.definitions[0]);
    definition.defaultDimensions.width = 99;
    store.getState().addFixture('new-fixture', definition, { x: 6, z: 8 });
    expect(store.getState().document.fixtures[1].dimensions.width).toBe(4);
    expect(store.getState().selectedId).toBe('new-fixture');
    store.getState().removeSelected();
    expect(store.getState().selectedId).toBeNull();
    store.getState().undo();
    expect(store.getState().document.fixtures).toHaveLength(2);
    store.getState().undo();
    expect(store.getState().document.fixtures).toHaveLength(1);
    store.getState().redo();
    store.getState().redo();
    expect(store.getState().document.fixtures).toHaveLength(1);
  });

  it('loads documents atomically, preserving geometry and allowing undo', () => {
    const store = setup();
    store.getState().updateFixture('shelf-1', { position: { x: 9, z: 3 } });
    const before = store.getState().document;
    expect(() => store.getState().load({ schemaVersion: 999 })).toThrow();
    expect(store.getState().document).toBe(before);
    store.getState().load(sample);
    expect(fixtureCorners(store.getState().document.fixtures[0])).toEqual(fixtureCorners(parseFloorDocument(sample).fixtures[0]));
    store.getState().undo();
    expect(store.getState().document).toEqual(before);
    expect(serializeFloorDocument(store.getState().document)).not.toBe(store.getState().savedJson);
  });
});

describe('viewport mapping', () => {
  it('fits an offset floor into the available canvas with a 40 px margin', () => {
    const view = fitViewport([{ x: -20, z: 10 }, { x: 0, z: 25 }], { width: 480, height: 380 });
    expect(view.scale).toBe(20);
    expect(screenToFloor({ x: 40, y: 40 }, view)).toEqual({ x: -20, z: 10 });
    expect(screenToFloor({ x: 440, y: 340 }, view)).toEqual({ x: 0, z: 25 });
  });
  it('maps drop positions and dragged centers into meters after container offset, pan and zoom', () => {
    const view = { x: -120, y: 70, scale: 64 };
    const client = { x: 600, y: 490 }, container = { left: 200, top: 100 };
    expect(screenToFloor({ x: client.x - container.left, y: client.y - container.top }, view)).toEqual({ x: 8.125, z: 5 });
  });
  it('keeps the floor point under the cursor fixed across zoom levels and clamping', () => {
    const view = { x: 45, y: -80, scale: 32 }, pointer = { x: 510, y: 230 };
    for (const factor of [1e-12, 0.001, 0.5, 1.2, 1000]) {
      const zoomed = zoomAt(view, pointer, factor);
      const before = screenToFloor(pointer, view), after = screenToFloor(pointer, zoomed);
      expect(after.x).toBeCloseTo(before.x, 6);
      expect(after.z).toBeCloseTo(before.z, 6);
    }
  });
});
