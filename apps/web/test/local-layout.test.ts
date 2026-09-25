import { expect, it } from 'vitest';
import { parseFloorDocument } from '@floorx/floor-model';
import sample from '../../../fixtures/floor-v1.json';
import { readLocalLayout, saveLocalLayout } from '../components/local-layout';

it('round trips the complete domain document without any editor state', () => {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  expect(readLocalLayout(storage)).toBeNull();
  saveLocalLayout(storage, parseFloorDocument(sample));
  expect(readLocalLayout(storage)).toEqual(sample);
  expect([...data.values()][0]).not.toMatch(/selectedId|viewport|past|future/);
});
it('surfaces unavailable storage and corrupt documents', () => {
  const storage = { getItem: () => '{broken', setItem: () => { throw new Error('Quota exceeded'); } };
  expect(() => readLocalLayout(storage)).toThrow();
  expect(() => saveLocalLayout(storage, parseFloorDocument(sample))).toThrow('Quota exceeded');
});
