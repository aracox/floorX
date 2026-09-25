import { createStore } from 'zustand/vanilla';
import { parseFloorDocument, serializeFloorDocument, type FloorDocument, type Fixture, type Point, type ComponentDefinition } from '@floorx/floor-model';

export type Viewport = { x: number; y: number; scale: number };
export const screenToFloor = (point: { x: number; y: number }, view: Viewport): Point => ({
  x: (point.x - view.x) / view.scale, z: (point.y - view.y) / view.scale,
});
export function zoomAt(view: Viewport, point: { x: number; y: number }, factor: number): Viewport {
  const floor = screenToFloor(point, view);
  const scale = Math.min(320, Math.max(0.0001, view.scale * factor));
  return { x: point.x - floor.x * scale, y: point.y - floor.z * scale, scale };
}

export function fitViewport(points: Point[], size: { width: number; height: number }): Viewport {
  const minX = Math.min(...points.map((p) => p.x)), maxX = Math.max(...points.map((p) => p.x));
  const minZ = Math.min(...points.map((p) => p.z)), maxZ = Math.max(...points.map((p) => p.z));
  const scale = Math.min(320, Math.max(0.0001, Math.min((size.width - 80) / (maxX - minX), (size.height - 80) / (maxZ - minZ))));
  return { scale, x: (size.width - (maxX - minX) * scale) / 2 - minX * scale,
    y: (size.height - (maxZ - minZ) * scale) / 2 - minZ * scale };
}

type Move = { id: string; position: Point };
export type EditorState = {
  document: FloorDocument;
  selectedId: string | null;
  past: FloorDocument[];
  future: FloorDocument[];
  viewport: Viewport;
  move: Move | null;
  savedJson: string;
  select: (id: string | null) => void;
  setViewport: (view: Viewport) => void;
  addFixture: (id: string, definition: ComponentDefinition, position: Point) => void;
  updateFixture: (id: string, changes: Partial<Pick<Fixture, 'position' | 'rotation' | 'dimensions'>>) => void;
  removeSelected: () => void;
  beginMove: (id: string) => void;
  previewMove: (position: Point) => void;
  finishMove: () => void;
  cancelMove: () => void;
  undo: () => void;
  redo: () => void;
  load: (value: unknown) => void;
  markSaved: () => void;
};

export function createEditorStore(initial: FloorDocument) {
  const document = parseFloorDocument(initial);
  return createStore<EditorState>((set, get) => {
    function commit(next: FloorDocument) {
      const parsed = parseFloorDocument(next);
      const current = get();
      if (serializeFloorDocument(parsed) === serializeFloorDocument(current.document)) return;
      set({ document: parsed, past: [...current.past, current.document].slice(-100), future: [], move: null,
        selectedId: parsed.fixtures.some((f) => f.id === current.selectedId) ? current.selectedId : null });
    }
    function restore(document: FloorDocument, past: FloorDocument[], future: FloorDocument[]) {
      set({ document, past, future, move: null,
        selectedId: document.fixtures.some((f) => f.id === get().selectedId) ? get().selectedId : null });
    }
    return {
      document, selectedId: null, past: [], future: [], move: null,
      viewport: { x: 40, y: 40, scale: 32 }, savedJson: serializeFloorDocument(document),
      select: (id) => set({ selectedId: get().document.fixtures.some((f) => f.id === id) ? id : null }),
      setViewport: (viewport) => {
        if (![viewport.x, viewport.y, viewport.scale].every(Number.isFinite) || viewport.scale <= 0) throw new Error('Invalid viewport');
        set({ viewport });
      },
      addFixture: (id, definition, position) => {
        const doc = get().document;
        const existing = doc.definitions.find((d) => d.id === definition.id && d.version === definition.version);
        // An embedded snapshot wins over newer external defaults with the same reference.
        const snapshot = existing ?? definition;
        commit({ ...doc, definitions: existing ? doc.definitions : [...doc.definitions, snapshot],
          fixtures: [...doc.fixtures, { id, definition: { id: snapshot.id, version: snapshot.version }, position,
            rotation: 0, dimensions: snapshot.defaultDimensions, properties: snapshot.defaultProperties }] });
        set({ selectedId: id });
      },
      updateFixture: (id, changes) => commit({ ...get().document,
        fixtures: get().document.fixtures.map((f) => f.id === id ? { ...f, ...changes } : f) }),
      removeSelected: () => commit({ ...get().document, fixtures: get().document.fixtures.filter((f) => f.id !== get().selectedId) }),
      beginMove: (id) => {
        const fixture = get().document.fixtures.find((f) => f.id === id);
        if (fixture) set({ selectedId: id, move: { id, position: fixture.position } });
      },
      previewMove: (position) => { if (get().move) set({ move: { ...get().move!, position } }); },
      finishMove: () => {
        const move = get().move;
        set({ move: null });
        if (move) get().updateFixture(move.id, { position: move.position });
      },
      cancelMove: () => set({ move: null }),
      undo: () => {
        const state = get();
        if (state.move) { set({ move: null }); return; }
        const previous = state.past.at(-1);
        if (previous) restore(previous, state.past.slice(0, -1), [state.document, ...state.future]);
      },
      redo: () => {
        const state = get();
        if (state.move) { set({ move: null }); return; }
        const next = state.future[0];
        if (next) restore(next, [...state.past, state.document], state.future.slice(1));
      },
      load: (value) => {
        const parsed = parseFloorDocument(value);
        commit(parsed);
        set({ move: null, selectedId: null, savedJson: serializeFloorDocument(parsed) });
      },
      markSaved: () => set({ savedJson: serializeFloorDocument(get().document) }),
    };
  });
}
export type EditorStore = ReturnType<typeof createEditorStore>;
