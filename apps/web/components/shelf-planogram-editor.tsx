'use client';

import { useState } from 'react';
import {
  findProductSku,
  makroSkuCatalog,
  type PlacedSkuItem,
  type TierPlanogram,
} from '@floorx/component-library';
import type { Fixture } from '@floorx/floor-model';

export function getFixturePlanogram(fixture: Fixture): TierPlanogram[] {
  const raw = fixture.properties.planogram;
  if (Array.isArray(raw)) {
    return raw as unknown as TierPlanogram[];
  }
  return [];
}

export function createReferencePhotoPlanogram(rows: number): TierPlanogram[] {
  const planogram: TierPlanogram[] = [];

  // Tier 0 (Bottom Heavy)
  planogram.push({
    tierIndex: 0,
    items: [
      { skuId: 'sku-aro-gochujang-tin-3kg', facings: 3, stack: 1, depth: 2 },
      { skuId: 'sku-aro-jasmine-rice-5kg', facings: 2, stack: 1, depth: 2 },
    ],
  });

  // Tier 1
  if (rows > 1) {
    planogram.push({
      tierIndex: 1,
      items: [
        { skuId: 'sku-aro-doenjang-500g', facings: 2, stack: 2, depth: 3 },
        { skuId: 'sku-aro-palm-oil-1l', facings: 3, stack: 1, depth: 4 },
      ],
    });
  }

  // Tier 2 (Eye level)
  if (rows > 2) {
    planogram.push({
      tierIndex: 2,
      items: [
        { skuId: 'sku-aro-gochujang-500g', facings: 2, stack: 2, depth: 3 },
        { skuId: 'sku-aro-ssamjang-500g', facings: 3, stack: 2, depth: 3 },
        { skuId: 'sku-carnation-condensed-milk-388g', facings: 3, stack: 2, depth: 4 },
      ],
    });
  }

  // Tier 3 (Top shelf)
  if (rows > 3) {
    planogram.push({
      tierIndex: 3,
      items: [
        { skuId: 'sku-tiparos-fish-sauce-700ml', facings: 4, stack: 1, depth: 4 },
        { skuId: 'sku-deksomboon-soy-sauce-700ml', facings: 4, stack: 1, depth: 4 },
      ],
    });
  }

  return planogram;
}

export default function ShelfPlanogramEditor({
  fixture,
  rows,
  onChange,
}: {
  fixture: Fixture;
  rows: number;
  onChange: (planogram: TierPlanogram[]) => void;
}) {
  const planogram = getFixturePlanogram(fixture);
  const [selectedSkuByTier, setSelectedSkuByTier] = useState<Record<number, string>>({});

  const totalUnits = planogram.reduce((sum, tier) => {
    return sum + (tier.items || []).reduce((s, it) => s + (it.facings * it.stack * it.depth), 0);
  }, 0);

  const applyStockReferencePhoto = () => {
    const photoPlanogram = createReferencePhotoPlanogram(rows);
    onChange(photoPlanogram);
  };

  const clearPlanogram = () => {
    onChange([]);
  };

  const updateItem = (tierIndex: number, itemIdx: number, updates: Partial<PlacedSkuItem>) => {
    const next = planogram.map((t) => {
      if (t.tierIndex !== tierIndex) return t;
      const nextItems = [...t.items];
      nextItems[itemIdx] = { ...nextItems[itemIdx], ...updates };
      return { ...t, items: nextItems };
    });
    onChange(next);
  };

  const removeItem = (tierIndex: number, itemIdx: number) => {
    const next = planogram.map((t) => {
      if (t.tierIndex !== tierIndex) return t;
      return { ...t, items: t.items.filter((_, idx) => idx !== itemIdx) };
    }).filter((t) => t.items.length > 0);
    onChange(next);
  };

  const addItemToTier = (tierIndex: number, skuId: string) => {
    if (!skuId) return;
    const sku = findProductSku(skuId);
    if (!sku) return;

    const newItem: PlacedSkuItem = {
      skuId,
      facings: sku.defaultFacing ?? 2,
      stack: sku.defaultStack ?? 1,
      depth: sku.defaultDepth ?? 3,
    };

    let foundTier = false;
    const next = planogram.map((t) => {
      if (t.tierIndex === tierIndex) {
        foundTier = true;
        return { ...t, items: [...t.items, newItem] };
      }
      return t;
    });

    if (!foundTier) {
      next.push({ tierIndex, items: [newItem] });
    }

    onChange(next);
    setSelectedSkuByTier((prev) => ({ ...prev, [tierIndex]: '' }));
  };

  // Render tiers from top to bottom
  const tierIndices = Array.from({ length: rows }, (_, i) => rows - 1 - i);

  return (
    <div className="planogram-editor">
      <div className="planogram-header">
        <div>
          <h4>Shelf Planogram</h4>
          <span className="planogram-badge">
            {totalUnits > 0 ? `${totalUnits} Units Stocked` : 'Empty Shelf'}
          </span>
        </div>
      </div>

      <div className="planogram-quick-actions">
        <button
          type="button"
          className="planogram-photo-btn"
          onClick={applyStockReferencePhoto}
          title="Stock shelf with Korean paste tubs, sauces, tins & staples matching reference photo"
        >
          ✨ Stock Like Reference Photo
        </button>
        {totalUnits > 0 && (
          <button
            type="button"
            className="secondary planogram-clear-btn"
            onClick={clearPlanogram}
          >
            Clear
          </button>
        )}
      </div>

      <div className="planogram-tiers-list">
        {tierIndices.map((tierIdx) => {
          const tier = planogram.find((t) => t.tierIndex === tierIdx);
          const items = tier?.items ?? [];
          const isTop = tierIdx === rows - 1;
          const isBottom = tierIdx === 0;
          const isEyeLevel = tierIdx === Math.min(rows - 1, Math.max(1, Math.floor(rows * 0.6)));

          return (
            <div key={tierIdx} className="planogram-tier-card">
              <div className="tier-header">
                <strong>
                  Tier {tierIdx + 1}{' '}
                  {isTop
                    ? '(Top)'
                    : isBottom
                    ? '(Bottom)'
                    : isEyeLevel
                    ? '(Eye Level)'
                    : ''}
                </strong>
                <span className="tier-items-count">{items.length} SKUs</span>
              </div>

              {items.length === 0 ? (
                <p className="tier-empty-label">No products on this tier</p>
              ) : (
                <div className="tier-items-list">
                  {items.map((item, idx) => {
                    const sku = findProductSku(item.skuId);
                    if (!sku) return null;

                    return (
                      <div key={`${item.skuId}-${idx}`} className="sku-tier-item">
                        <div className="sku-item-info">
                          <span
                            className="sku-color-dot"
                            style={{ backgroundColor: sku.appearance.primaryColor }}
                          />
                          <span className="sku-name" title={sku.name}>
                            {sku.name}
                          </span>
                          <button
                            type="button"
                            className="sku-remove-btn"
                            aria-label={`Remove ${sku.name}`}
                            onClick={() => removeItem(tierIdx, idx)}
                          >
                            ×
                          </button>
                        </div>

                        <div className="sku-controls-row">
                          <div className="sku-stepper">
                            <label>Facing</label>
                            <div className="stepper-box">
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(tierIdx, idx, {
                                    facings: Math.max(1, item.facings - 1),
                                  })
                                }
                              >
                                −
                              </button>
                              <span>{item.facings}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(tierIdx, idx, {
                                    facings: item.facings + 1,
                                  })
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="sku-stepper">
                            <label>Stack</label>
                            <div className="stepper-box">
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(tierIdx, idx, {
                                    stack: Math.max(1, item.stack - 1),
                                  })
                                }
                              >
                                −
                              </button>
                              <span>{item.stack}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(tierIdx, idx, {
                                    stack: item.stack + 1,
                                  })
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="sku-stepper">
                            <label>Depth</label>
                            <div className="stepper-box">
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(tierIdx, idx, {
                                    depth: Math.max(1, item.depth - 1),
                                  })
                                }
                              >
                                −
                              </button>
                              <span>{item.depth}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(tierIdx, idx, {
                                    depth: item.depth + 1,
                                  })
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="tier-add-sku-box">
                <select
                  value={selectedSkuByTier[tierIdx] ?? ''}
                  onChange={(e) => {
                    const skuId = e.target.value;
                    if (skuId) addItemToTier(tierIdx, skuId);
                  }}
                >
                  <option value="">+ Add Makro SKU to Tier {tierIdx + 1}…</option>
                  {makroSkuCatalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.packaging})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
