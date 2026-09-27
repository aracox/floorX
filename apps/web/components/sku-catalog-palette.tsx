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

  const stockedFacingsBySku = useMemo(() => {
    if (!selectedFixture || !isShelving) return {};
    const planogram = getFixturePlanogram(selectedFixture);
    const counts: Record<string, number> = {};
    for (const tier of planogram) {
      for (const item of tier.items || []) {
        counts[item.skuId] = (counts[item.skuId] || 0) + item.facings;
      }
    }
    return counts;
  }, [selectedFixture, isShelving]);

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

    let nextPlanogram: TierPlanogram[];
    if (existingTier) {
      const existingItemIdx = existingTier.items.findIndex((it) => it.skuId === sku.id);
      if (existingItemIdx >= 0) {
        const currentItem = existingTier.items[existingItemIdx];
        const nextItems = [...existingTier.items];
        nextItems[existingItemIdx] = {
          ...currentItem,
          facings: currentItem.facings + 1,
        };
        nextPlanogram = planogram.map((t) =>
          t.tierIndex === targetTier ? { ...t, items: nextItems } : t
        );
      } else {
        const newItem: PlacedSkuItem = {
          skuId: sku.id,
          facings: 1,
          stack: sku.defaultStack ?? 1,
          depth: sku.defaultDepth ?? 3,
        };
        nextPlanogram = planogram.map((t) =>
          t.tierIndex === targetTier ? { ...t, items: [...t.items, newItem] } : t
        );
      }
    } else {
      const newItem: PlacedSkuItem = {
        skuId: sku.id,
        facings: 1,
        stack: sku.defaultStack ?? 1,
        depth: sku.defaultDepth ?? 3,
      };
      nextPlanogram = [...planogram, { tierIndex: targetTier, items: [newItem] }];
    }

    onUpdateFixtureProperties(selectedFixture.id, {
      ...selectedFixture.properties,
      planogram: nextPlanogram as any,
    });

    onReport(`Added facing of ${sku.name} on Tier ${targetTier + 1}.`);
  };

  const handleUnstockSku = (sku: ProductSku) => {
    if (!selectedFixture || !isShelving) return;
    const planogram = getFixturePlanogram(selectedFixture);

    let removed = false;
    const nextPlanogram = planogram
      .map((t) => {
        if (removed) return t;
        const itemIdx = t.items.findIndex((it) => it.skuId === sku.id);
        if (itemIdx >= 0) {
          removed = true;
          const currentItem = t.items[itemIdx];
          if (currentItem.facings > 1) {
            const nextItems = [...t.items];
            nextItems[itemIdx] = { ...currentItem, facings: currentItem.facings - 1 };
            return { ...t, items: nextItems };
          } else {
            return { ...t, items: t.items.filter((_, idx) => idx !== itemIdx) };
          }
        }
        return t;
      })
      .filter((t) => t.items.length > 0);

    if (removed) {
      onUpdateFixtureProperties(selectedFixture.id, {
        ...selectedFixture.properties,
        planogram: nextPlanogram as any,
      });
      onReport(`Removed 1 facing of ${sku.name} from shelf.`);
    }
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
          const stockedCount = stockedFacingsBySku[sku.id] || 0;

          return (
            <div
              key={sku.id}
              className={`sku-catalog-card ${stockedCount > 0 ? 'is-stocked' : ''}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/floorx-sku', sku.id);
                e.dataTransfer.setData('text/plain', sku.id);
              }}
              title={`${sku.name}\n${sku.nameTh}\nBarcode: ${sku.barcode}\n${widthCm}×${depthCm}×${heightCm} cm${stockedCount > 0 ? `\n(${stockedCount} facings on selected shelf)` : ''}`}
            >
              <div className="sku-card-preview">
                {sku.imageUrl ? (
                  <img
                    src={sku.imageUrl}
                    alt={sku.name}
                    className="sku-product-img"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`sku-visual-badge ${sku.packaging}`}
                    style={{
                      backgroundColor: sku.appearance.primaryColor,
                      borderColor: sku.appearance.secondaryColor ?? sku.appearance.primaryColor,
                    }}
                  >
                    <span className="sku-packaging-type">{sku.packaging.slice(0, 3).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="sku-card-details">
                <div className="sku-card-header">
                  <strong className="sku-card-title">{sku.name}</strong>
                </div>
                <div className="sku-card-meta">
                  <span className="sku-brand-tag">{sku.brand}</span>
                  <span className="sku-dims">{widthCm}×{depthCm}×{heightCm} cm</span>
                </div>
              </div>

              <div className="sku-card-actions">
                {stockedCount > 0 ? (
                  <div className="sku-card-stepper">
                    <button
                      type="button"
                      className="sku-stock-btn sku-minus-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnstockSku(sku);
                      }}
                      title={`Remove 1 facing of ${sku.name} from shelf`}
                      aria-label={`Remove 1 facing of ${sku.name}`}
                    >
                      −
                    </button>
                    <span className="sku-stock-count" title={`${stockedCount} facings on shelf`}>
                      {stockedCount}
                    </span>
                    <button
                      type="button"
                      className="sku-stock-btn sku-plus-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStockSku(sku);
                      }}
                      title={`Add another facing of ${sku.name} to shelf`}
                      aria-label={`Add another facing of ${sku.name}`}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="sku-stock-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStockSku(sku);
                    }}
                    title={
                      selectedFixture && isShelving
                        ? `Stock onto Tier ${(sku.recommendedTier ?? 0) + 1} of selected shelf`
                        : 'Select a shelf fixture to stock'
                    }
                    aria-label={`Add ${sku.name} to shelf`}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
