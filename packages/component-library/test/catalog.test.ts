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

  it('contains 10 valid Makro Thailand SKUs with correct dimensions and properties', async () => {
    const { makroSkuCatalog, findProductSku } = await import('../src');
    expect(makroSkuCatalog).toHaveLength(10);

    for (const sku of makroSkuCatalog) {
      expect(sku.id).toBeTruthy();
      expect(sku.barcode).toMatch(/^\d{13}$/); // 13-digit EAN barcode
      expect(sku.name).toBeTruthy();
      expect(sku.brand).toBeTruthy();
      expect(sku.imageUrl).toMatch(/^\/skus\/[\w.-]+$/);
      expect(sku.dimensions.width).toBeGreaterThan(0);
      expect(sku.dimensions.height).toBeGreaterThan(0);
      expect(sku.dimensions.depth).toBeGreaterThan(0);
      expect(findProductSku(sku.id)).toBe(sku);
    }

    // Verify key products matching reference photo
    expect(findProductSku('sku-aro-gochujang-500g')).toBeDefined();
    expect(findProductSku('sku-aro-ssamjang-500g')).toBeDefined();
    expect(findProductSku('sku-aro-doenjang-500g')).toBeDefined();
    expect(findProductSku('sku-aro-gochujang-tin-3kg')).toBeDefined();
  });
});
