import { componentDefinitionSchema, type ComponentDefinition } from '@floorx/floor-model';

// IDs and versions are stable. A new geometry/default contract gets a new version.
// Existing documents retain their embedded definition snapshot and instance values.
export const fixtureCatalog = [
  {
    id: 'gondola', version: 1, name: 'Standard gondola', kind: 'rectangular-fixture',
    defaultDimensions: { width: 4, depth: 0.8, height: 1.8 },
    defaultProperties: { category: 'general' },
  },
  {
    id: 'wall-shelf', version: 1, name: 'Wall shelf', kind: 'rectangular-fixture',
    defaultDimensions: { width: 2, depth: 0.45, height: 2.1 },
    defaultProperties: { category: 'general' },
  },
  {
    id: 'rack', version: 1, name: 'Display rack', kind: 'rectangular-fixture',
    defaultDimensions: { width: 1.2, depth: 0.7, height: 1.6 },
    defaultProperties: { category: 'general' },
  },
  {
    id: 'freezer', version: 1, name: 'Freezer', kind: 'rectangular-fixture',
    defaultDimensions: { width: 2.2, depth: 0.85, height: 1.25 },
    defaultProperties: { category: 'frozen' },
  },
  {
    id: 'checkout', version: 1, name: 'Checkout counter', kind: 'rectangular-fixture',
    defaultDimensions: { width: 2.4, depth: 0.9, height: 0.9 },
    defaultProperties: { category: 'checkout' },
  },
  {
    id: 'promotion-island', version: 1, name: 'Promotion island', kind: 'rectangular-fixture',
    defaultDimensions: { width: 1.8, depth: 1.2, height: 1.1 },
    defaultProperties: { category: 'promotion' },
  },
] satisfies ComponentDefinition[];

for (const definition of fixtureCatalog) componentDefinitionSchema.parse(definition);

export function findFixtureDefinition(id: string, version: number): ComponentDefinition | undefined {
  return fixtureCatalog.find((definition) => definition.id === id && definition.version === version);
}
