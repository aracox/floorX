'use client';

import { useMemo } from 'react';
import { findProductSku, type PlacedSkuItem, type ProductSku } from '@floorx/component-library';

interface ShelfProducts3DProps {
  planogramItems?: PlacedSkuItem[];
  tierIndex: number;
  shelfBoardTop: number;
  shelfThickness: number;
  fixtureWidth: number;
  fixtureDepth: number;
  postThickness: number;
}

function ProductTub({ sku, position }: { sku: ProductSku; position: [number, number, number] }) {
  const { width: w, height: h, depth: d } = sku.dimensions;
  const bodyH = h * 0.78;
  const lidH = h * 0.22;
  const [x, y, z] = position;

  return (
    <group position={[x, y + h / 2, z]}>
      {/* Lower Tub Container */}
      <mesh position={[0, -h / 2 + bodyH / 2, 0]}>
        <boxGeometry args={[w * 0.94, bodyH, d * 0.94]} />
        <meshStandardMaterial color={sku.appearance.primaryColor} roughness={0.35} />
      </mesh>
      {/* Front Label Accent */}
      <mesh position={[0, -h / 2 + bodyH / 2, d * 0.94 / 2 + 0.001]}>
        <planeGeometry args={[w * 0.75, bodyH * 0.7]} />
        <meshStandardMaterial color="#fef08a" roughness={0.5} />
      </mesh>
      {/* Top Overlapping Lid */}
      <mesh position={[0, h / 2 - lidH / 2, 0]}>
        <boxGeometry args={[w, lidH, d]} />
        <meshStandardMaterial color={sku.appearance.secondaryColor ?? sku.appearance.primaryColor} roughness={0.25} />
      </mesh>
    </group>
  );
}

function ProductCateringTin({ sku, position }: { sku: ProductSku; position: [number, number, number] }) {
  const { width: w, height: h, depth: d } = sku.dimensions;
  const [x, y, z] = position;

  return (
    <group position={[x, y + h / 2, z]}>
      {/* Main Square Metal Can */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={sku.appearance.primaryColor} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Metal Rim Cap */}
      <mesh position={[0, h / 2 - 0.005, 0]}>
        <boxGeometry args={[w * 1.02, 0.01, d * 1.02]} />
        <meshStandardMaterial color={sku.appearance.accentColor ?? '#cbd5e1'} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Green Strapping Band */}
      <mesh position={[0, 0, d / 2 + 0.002]}>
        <planeGeometry args={[0.02, h * 0.9]} />
        <meshStandardMaterial color="#10b981" roughness={0.3} />
      </mesh>
      {/* Front Label Box */}
      <mesh position={[0, 0.02, d / 2 + 0.001]}>
        <planeGeometry args={[w * 0.8, h * 0.55]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
    </group>
  );
}

function ProductCan({ sku, position }: { sku: ProductSku; position: [number, number, number] }) {
  const { width: w, height: h } = sku.dimensions;
  const radius = w / 2;
  const [x, y, z] = position;

  return (
    <group position={[x, y + h / 2, z]}>
      {/* Can Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, h, 16]} />
        <meshStandardMaterial color={sku.appearance.primaryColor} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Red Brand Banner */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radius * 1.002, radius * 1.002, h * 0.5, 16]} />
        <meshStandardMaterial color={sku.appearance.secondaryColor ?? '#dc2626'} roughness={0.4} />
      </mesh>
      {/* Metallic Rim */}
      <mesh position={[0, h / 2 - 0.002, 0]}>
        <cylinderGeometry args={[radius * 1.01, radius * 1.01, 0.004, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

function ProductBottle({ sku, position }: { sku: ProductSku; position: [number, number, number] }) {
  const { width: w, height: h } = sku.dimensions;
  const radius = w / 2;
  const bodyH = h * 0.65;
  const neckH = h * 0.22;
  const capH = h * 0.13;
  const [x, y, z] = position;

  return (
    <group position={[x, y + h / 2, z]}>
      {/* Liquid Body */}
      <mesh position={[0, -h / 2 + bodyH / 2, 0]}>
        <cylinderGeometry args={[radius, radius, bodyH, 14]} />
        <meshStandardMaterial color={sku.appearance.primaryColor} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Shoulder / Neck */}
      <mesh position={[0, -h / 2 + bodyH + neckH / 2, 0]}>
        <cylinderGeometry args={[radius * 0.35, radius, neckH, 14]} />
        <meshStandardMaterial color={sku.appearance.accentColor ?? sku.appearance.primaryColor} roughness={0.2} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, h / 2 - capH / 2, 0]}>
        <cylinderGeometry args={[radius * 0.38, radius * 0.38, capH, 12]} />
        <meshStandardMaterial color={sku.appearance.secondaryColor ?? '#dc2626'} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ProductBoxOrBag({ sku, position }: { sku: ProductSku; position: [number, number, number] }) {
  const { width: w, height: h, depth: d } = sku.dimensions;
  const [x, y, z] = position;

  return (
    <group position={[x, y + h / 2, z]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={sku.appearance.primaryColor} roughness={0.7} />
      </mesh>
      {/* Graphic banner on front */}
      <mesh position={[0, 0, d / 2 + 0.001]}>
        <planeGeometry args={[w * 0.8, h * 0.6]} />
        <meshStandardMaterial color={sku.appearance.secondaryColor ?? '#fbbf24'} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function ShelfTierProducts({
  planogramItems,
  shelfBoardTop,
  fixtureWidth,
  fixtureDepth,
  postThickness,
}: ShelfProducts3DProps) {
  const renderedItems = useMemo(() => {
    if (!planogramItems || planogramItems.length === 0) return [];

    const availableWidth = Math.max(0.2, fixtureWidth - postThickness * 2 - 0.06);
    let currentX = -availableWidth / 2;
    const elements: Array<{
      key: string;
      sku: ProductSku;
      position: [number, number, number];
    }> = [];

    for (const item of planogramItems) {
      const sku = findProductSku(item.skuId);
      if (!sku) continue;

      const w = sku.dimensions.width;
      const h = sku.dimensions.height;
      const d = sku.dimensions.depth;
      const facings = Math.max(1, item.facings || 1);
      const stack = Math.max(1, item.stack || 1);
      const depthCount = Math.max(1, item.depth || 1);

      for (let f = 0; f < facings; f++) {
        const itemCenterX = currentX + f * (w + 0.012) + w / 2;
        if (itemCenterX + w / 2 > availableWidth / 2 + 0.05) break;

        for (let s = 0; s < stack; s++) {
          const itemBaseY = shelfBoardTop + s * h;

          for (let k = 0; k < depthCount; k++) {
            const frontZ = fixtureDepth / 2 - 0.04;
            const itemCenterZ = frontZ - k * (d + 0.015) - d / 2;
            if (itemCenterZ - d / 2 < -fixtureDepth / 2 + 0.02) break;

            elements.push({
              key: `${item.skuId}-f${f}-s${s}-k${k}`,
              sku,
              position: [itemCenterX, itemBaseY, itemCenterZ],
            });
          }
        }
      }

      currentX += facings * (w + 0.012) + 0.03;
    }

    return elements;
  }, [planogramItems, shelfBoardTop, fixtureWidth, fixtureDepth, postThickness]);

  return (
    <group>
      {renderedItems.map((item) => {
        if (item.sku.packaging === 'tub') {
          return <ProductTub key={item.key} sku={item.sku} position={item.position} />;
        }
        if (item.sku.packaging === 'can') {
          if (item.sku.category === 'bulk') {
            return <ProductCateringTin key={item.key} sku={item.sku} position={item.position} />;
          }
          return <ProductCan key={item.key} sku={item.sku} position={item.position} />;
        }
        if (item.sku.packaging === 'bottle') {
          return <ProductBottle key={item.key} sku={item.sku} position={item.position} />;
        }
        return <ProductBoxOrBag key={item.key} sku={item.sku} position={item.position} />;
      })}
    </group>
  );
}
