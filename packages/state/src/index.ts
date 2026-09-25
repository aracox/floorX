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

type Move = { anchorId: string; start: Point; startPositions: Record<string, Point>; positions: Record<string, Point> };
type Clipboard = { fixtures: Fixture[]; definitions: ComponentDefinition[]; pasteCount: number };
export type EditorState = {
  document: FloorDocument;
  selectedId: string | null;
  selectedIds: string[];
  past: FloorDocument[];
  future: FloorDocument[];
  viewport: Viewport;
  move: Move | null;
  clipboard: Clipboard | null;
  savedJson: string;
  select: (id: string | null, additive?: boolean) => void;
  selectAll: () => void;
  setViewport: (view: Viewport) => void;
  addFixture: (id: string, definition: ComponentDefinition, position: Point) => void;
  updateFixture: (id: string, changes: Partial<Pick<Fixture, 'position' | 'rotation' | 'dimensions'>>) => void;
  removeSelected: () => void;
  copySelected: () => void;
  pasteCopied: (ids: string[]) => void;
  duplicateSelected: (ids: string[]) => void;
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
    function validSelection(document: FloorDocument, ids: string[]): string[] {
      const present = new Set(document.fixtures.map((fixture) => fixture.id));
      return ids.filter((id) => present.has(id));
    }
    function commit(next: FloorDocument) {
      const parsed = parseFloorDocument(next);
      const current = get();
      if (serializeFloorDocument(parsed) === serializeFloorDocument(current.document)) return;
      const selectedIds = validSelection(parsed, current.selectedIds);
      set({ document: parsed, past: [...current.past, current.document].slice(-100), future: [], move: null,
        selectedIds, selectedId: selectedIds.includes(current.selectedId ?? '') ? current.selectedId : selectedIds.at(-1) ?? null });
    }
    function restore(document: FloorDocument, past: FloorDocument[], future: FloorDocument[]) {
      const selectedIds = validSelection(document, get().selectedIds);
      set({ document, past, future, move: null,
        selectedIds, selectedId: selectedIds.includes(get().selectedId ?? '') ? get().selectedId : selectedIds.at(-1) ?? null });
    }
    function insertCopies(source: Fixture[], definitions: ComponentDefinition[], ids: string[], offset: Point) {
      if (!source.length || ids.length !== source.length) throw new Error('Copy IDs must match the selected fixtures');
      const current = get().document;
      const copies = source.map((fixture, index) => ({ ...structuredClone(fixture), id: ids[index],
        position: { x: fixture.position.x + offset.x, z: fixture.position.z + offset.z } }));
      const existing = new Map(current.definitions.map((definition) => [JSON.stringify([definition.id, definition.version]), definition]));
      const addedDefinitions = definitions.filter((definition) => {
        const present = existing.get(JSON.stringify([definition.id, definition.version]));
        if (present && JSON.stringify(present) !== JSON.stringify(definition)) throw new Error('Conflicting component definition snapshot');
        return !present;
      });
      commit({ ...current, definitions: [...current.definitions, ...addedDefinitions], fixtures: [...current.fixtures, ...copies] });
      set({ selectedIds: ids, selectedId: ids.at(-1) ?? null });
    }
    return {
      document, selectedId: null, selectedIds: [], past: [], future: [], move: null, clipboard: null,
      viewport: { x: 40, y: 40, scale: 32 }, savedJson: serializeFloorDocument(document),
      select: (id, additive = false) => {
        if (!id || !get().document.fixtures.some((fixture) => fixture.id === id)) {
          set({ selectedId: null, selectedIds: [] }); return;
        }
        if (!additive) { set({ selectedId: id, selectedIds: [id] }); return; }
        const selectedIds = get().selectedIds.includes(id) ? get().selectedIds.filter((item) => item !== id) : [...get().selectedIds, id];
        set({ selectedIds, selectedId: selectedIds.at(-1) ?? null });
      },
      selectAll: () => {
        const selectedIds = get().document.fixtures.map((fixture) => fixture.id);
        set({ selectedIds, selectedId: selectedIds.at(-1) ?? null });
      },
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
        set({ selectedId: id, selectedIds: [id] });
      },
      updateFixture: (id, changes) => commit({ ...get().document,
        fixtures: get().document.fixtures.map((f) => f.id === id ? { ...f, ...changes } : f) }),
      removeSelected: () => {
        const ids = new Set(get().selectedIds);
        commit({ ...get().document, fixtures: get().document.fixtures.filter((fixture) => !ids.has(fixture.id)) });
      },
      copySelected: () => {
        const current = get();
        const selected = new Set(current.selectedIds);
        const fixtures = current.document.fixtures.filter((fixture) => selected.has(fixture.id));
        if (!fixtures.length) return;
        const references = new Set(fixtures.map((fixture) => JSON.stringify([fixture.definition.id, fixture.definition.version])));
        set({ clipboard: { fixtures: structuredClone(fixtures), definitions: structuredClone(current.document.definitions.filter((definition) =>
          references.has(JSON.stringify([definition.id, definition.version])))), pasteCount: 0 } });
      },
      pasteCopied: (ids) => {
        const clipboard = get().clipboard;
        if (!clipboard) return;
        const distance = (clipboard.pasteCount + 1) * 0.5;
        insertCopies(clipboard.fixtures, clipboard.definitions, ids, { x: distance, z: distance });
        set({ clipboard: { ...clipboard, pasteCount: clipboard.pasteCount + 1 } });
      },
      duplicateSelected: (ids) => {
        const current = get();
        const selected = new Set(current.selectedIds);
        const fixtures = current.document.fixtures.filter((fixture) => selected.has(fixture.id));
        if (!fixtures.length) return;
        insertCopies(fixtures, current.document.definitions, ids, { x: 0.5, z: 0.5 });
      },
      beginMove: (id) => {
        const current = get();
        const fixture = current.document.fixtures.find((item) => item.id === id);
        if (!fixture) return;
        const ids = current.selectedIds.includes(id) ? current.selectedIds : [id];
        const selected = new Set(ids);
        const startPositions = Object.fromEntries(current.document.fixtures.filter((item) => selected.has(item.id)).map((item) => [item.id, item.position]));
        set({ selectedIds: ids, selectedId: id, move: { anchorId: id, start: fixture.position, startPositions, positions: startPositions } });
      },
      previewMove: (position) => {
        const move = get().move;
        if (!move) return;
        const dx = position.x - move.start.x, dz = position.z - move.start.z;
        const positions = Object.fromEntries(Object.entries(move.startPositions).map(([id, start]) => [id, { x: start.x + dx, z: start.z + dz }]));
        set({ move: { ...move, positions } });
      },
      finishMove: () => {
        const move = get().move;
        set({ move: null });
        if (move) commit({ ...get().document, fixtures: get().document.fixtures.map((fixture) =>
          move.positions[fixture.id] ? { ...fixture, position: move.positions[fixture.id] } : fixture) });
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
        set({ move: null, selectedId: null, selectedIds: [], savedJson: serializeFloorDocument(parsed) });
      },
      markSaved: () => set({ savedJson: serializeFloorDocument(get().document) }),
    };
  });
}
export type EditorStore = ReturnType<typeof createEditorStore>;
