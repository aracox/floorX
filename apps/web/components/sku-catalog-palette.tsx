'use client';

import { useMemo, useState } from 'react';
import {
  makroSkuCatalog,
  type PlacedSkuItem,
  type ProductSku,
  type TierPlanogram,
} from '@floorx/component-library';
import type { Fixture } from '@floorx/floor-model';
import { getFixturePlanogram } from './shelf-planogram-editor';

interface SkuCatalogPaletteProps {
  selectedFixture?: Fixture | null;
  onUpdateFixtureProperties: (fixtureId: string, properties: Fixture['properties']) => void;
  onReport: (message: string, isError?: boolean) => void;
}

export default function SkuCatalogPalette({
  selectedFixture,
  onUpdateFixtureProperties,
  onReport,
}: SkuCatalogPaletteProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'sauces', label: 'Sauces' },
    { id: 'bulk', label: 'Bulk / Horeca' },
    { id: 'staples', label: 'Staples' },
    { id: 'rice-grains', label: 'Rice' },
    { id: 'canned-dairy', label: 'Canned' },
  ];

  const filteredSkus = useMemo(() => {
    return makroSkuCatalog.filter((sku) => {
      if (category !== 'all' && sku.category !== category) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          sku.name.toLowerCase().includes(query) ||
          sku.nameTh.toLowerCase().includes(query) ||
          sku.brand.toLowerCase().includes(query) ||
          sku.barcode.includes(query)
        );
      }
      return true;
    });
  }, [category, search]);

  const isShelving = selectedFixture && (
    ['gondola', 'wall-shelf', 'rack'].includes(selectedFixture.definition.id) ||
    typeof selectedFixture.properties.rows === 'number'
  );

  const rows = typeof selectedFixture?.properties.rows === 'number'
    ? Number(selectedFixture.properties.rows)
    : (isShelving ? 2 : 0);

  const handleStockSku = (sku: ProductSku) => {
    if (!selectedFixture || !isShelving) {
      onReport('Select a shelf or gondola on the floor to stock this SKU.', true);
      return;
    }

    const tierCount = rows || 2;
    const targetTier = Math.min(
      tierCount - 1,
      Math.max(0, sku.recommendedTier ?? (tierCount > 2 ? 1 : 0))
    );

    const planogram = getFixturePlanogram(selectedFixture);
    const existingTier = planogram.find((t) => t.tierIndex === targetTier);

    const newItem: PlacedSkuItem = {
      skuId: sku.id,
      facings: sku.defaultFacing ?? 2,
      stack: sku.defaultStack ?? 1,
      depth: sku.defaultDepth ?? 3,
    };

    let nextPlanogram: TierPlanogram[];
    if (existingTier) {
      nextPlanogram = planogram.map((t) => {
        if (t.tierIndex === targetTier) {
          return { ...t, items: [...t.items, newItem] };
        }
        return t;
      });
    } else {
      nextPlanogram = [...planogram, { tierIndex: targetTier, items: [newItem] }];
    }

    onUpdateFixtureProperties(selectedFixture.id, {
      ...selectedFixture.properties,
      planogram: nextPlanogram as any,
    });

    onReport(`Stocked ${sku.name} onto Tier ${targetTier + 1} (${newItem.facings} facings).`);
  };

  return (
    <div className="sku-catalog-section">
      <div className="sku-search-box">
        <input
          type="search"
          placeholder="Search SKU or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search SKUs"
        />
      </div>

      <div className="sku-category-pills">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={category === cat.id ? 'active' : 'secondary'}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="sku-items-list">
        {filteredSkus.map((sku) => {
          const widthCm = Math.round(sku.dimensions.width * 100);
          const depthCm = Math.round(sku.dimensions.depth * 100);
          const heightCm = Math.round(sku.dimensions.height * 100);

          return (
            <div
              key={sku.id}
              className="sku-catalog-card"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/floorx-sku', sku.id);
                e.dataTransfer.setData('text/plain', sku.id);
              }}
            >
              <div className="sku-card-preview">
                <div
                  className={`sku-visual-badge ${sku.packaging}`}
                  style={{
                    backgroundColor: sku.appearance.primaryColor,
                    borderColor: sku.appearance.secondaryColor ?? sku.appearance.primaryColor,
                  }}
                >
                  <span className="sku-packaging-type">{sku.packaging.toUpperCase()}</span>
                </div>
              </div>

              <div className="sku-card-details">
                <div className="sku-brand-row">
                  <span className="sku-brand-tag">{sku.brand}</span>
                  <span className="sku-barcode">{sku.barcode}</span>
                </div>
                <strong className="sku-card-title">{sku.name}</strong>
                <p className="sku-card-sub">{sku.nameTh}</p>
                <div className="sku-dims-row">
                  <span>{widthCm}×{depthCm}×{heightCm} cm</span>
                </div>

                <button
                  type="button"
                  className="sku-stock-btn"
                  onClick={() => handleStockSku(sku)}
                  title={
                    selectedFixture && isShelving
                      ? `Stock onto Tier ${(sku.recommendedTier ?? 0) + 1} of selected shelf`
                      : 'Select a shelf fixture to stock'
                  }
                >
                  + Put on shelf
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
