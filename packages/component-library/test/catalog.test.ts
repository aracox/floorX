import { describe, expect, it } from 'vitest';
import { parseFloorDocument } from '@floorx/floor-model';
import sample from '../../../fixtures/floor-v1.json';
import { findFixtureDefinition, fixtureCatalog } from '../src';

describe('versioned fixture catalog', () => {
  it('contains distinct valid ID/version pairs and matches the saved gondola snapshot', () => {
    const references = fixtureCatalog.map((definition) => `${definition.id}@${definition.version}`);
    expect(new Set(references).size).toBe(references.length);
    expect(fixtureCatalog).toHaveLength(6);
    expect(findFixtureDefinition('gondola', 1)).toEqual(parseFloorDocument(sample).definitions[0]);
    expect(findFixtureDefinition('gondola', 2)).toBeUndefined();
  });
});
