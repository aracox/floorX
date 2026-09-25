import { deserializeFloorDocument, serializeFloorDocument, type FloorDocument } from '@floorx/floor-model';
export const LOCAL_LAYOUT_KEY = 'floorx.layout.v1';
type Storage = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };
export function saveLocalLayout(storage: Storage, document: FloorDocument): void {
  storage.setItem(LOCAL_LAYOUT_KEY, serializeFloorDocument(document));
}
export function readLocalLayout(storage: Storage): FloorDocument | null {
  const json = storage.getItem(LOCAL_LAYOUT_KEY);
  return json === null ? null : deserializeFloorDocument(json);
}
