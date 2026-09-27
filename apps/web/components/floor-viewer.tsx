'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, Path, Shape } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useStore } from 'zustand';
import type { FloorDocument } from '@floorx/floor-model';
import type { EditorStore } from '@floorx/state';
import { fixtureBox, floorBounds, wallBoxes } from './viewer-geometry';
import { fixtureFill } from './fixture-appearance';
import { ShelfTierProducts } from './shelf-products-3d';
import type { PlacedSkuItem } from '@floorx/component-library';

type Polygon = FloorDocument['boundary'];

function polygonShape(polygon: Polygon): Shape {
  const shape = new Shape();
  polygon.outer.forEach((point, index) => index ? shape.lineTo(point.x, -point.z) : shape.moveTo(point.x, -point.z));
  shape.closePath();
  for (const ring of polygon.holes) {
    const hole = new Path();
    ring.forEach((point, index) => index ? hole.lineTo(point.x, -point.z) : hole.moveTo(point.x, -point.z));
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

function Surface({ polygon, elevation, color }: { polygon: Polygon; elevation: number; color: string }) {
  const shape = useMemo(() => polygonShape(polygon), [polygon]);
  return <mesh position={[0, elevation, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <shapeGeometry args={[shape]} />
    <meshStandardMaterial color={color} side={DoubleSide} roughness={0.95} />
  </mesh>;
}

function CameraControls({ centerX, centerZ, elevation, span }: {
  centerX: number; centerZ: number; elevation: number; span: number;
}) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    camera.position.set(centerX + span * 0.65, elevation + span * 0.8, centerZ + span * 0.9);
    orbit.target.set(centerX, elevation, centerZ);
    orbit.minDistance = 1;
    orbit.maxDistance = Math.max(20, span * 10);
    orbit.maxPolarAngle = Math.PI / 2 - 0.02;
    orbit.screenSpacePanning = true;
    orbit.enableDamping = true;
    orbit.update();
    controls.current = orbit;
    return () => { orbit.dispose(); controls.current = null; };
  }, [camera, gl, centerX, centerZ, elevation, span]);
  useFrame(() => controls.current?.update());
  return null;
}

function Scene({ store }: { store: EditorStore }) {
  const state = useStore(store);
  const document = state.document;
  const bounds = floorBounds(document);
  const wallParts = useMemo(() => wallBoxes(document), [document]);
  return <>
    <color attach="background" args={['#cbd5e1']} />
    <ambientLight intensity={1.4} />
    <hemisphereLight args={['#ffffff', '#64748b', 1.0]} />
    <directionalLight position={[bounds.centerX + 12, document.baseElevation + 25, bounds.centerZ + 15]} intensity={1.8} />
    <directionalLight position={[bounds.centerX - 12, document.baseElevation + 20, bounds.centerZ - 15]} intensity={1.2} />
    <CameraControls {...bounds} elevation={document.baseElevation} />
    <group onClick={() => store.getState().select(null)}>
      <Surface polygon={document.boundary} elevation={document.baseElevation} color="#738290" />
      {document.zones.map((zone) => <Surface key={zone.id} polygon={zone.boundary}
        elevation={document.baseElevation + 0.01} color="#50667a" />)}
      {wallParts.map((part, index) => <mesh key={`${part.wallId}-${index}`}
        position={part.position} rotation={[0, part.rotationY, 0]}>
        <boxGeometry args={part.size} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>)}
    </group>
    {document.fixtures.map((fixture) => {
      const box = fixtureBox(fixture, document.baseElevation);
      const selected = state.selectedIds.includes(fixture.id);
      const isShelving = ['gondola', 'wall-shelf', 'rack'].includes(fixture.definition.id) || typeof fixture.properties.rows === 'number';
      const rows = typeof fixture.properties.rows === 'number'
        ? Math.max(1, Math.round(Number(fixture.properties.rows)))
        : (isShelving ? 2 : 1);
      const [width, height, depth] = box.size;
      const selectFixture = (event: { stopPropagation: () => void; nativeEvent: MouseEvent }) => {
        event.stopPropagation();
        const pointer = event.nativeEvent;
        store.getState().select(fixture.id, pointer.shiftKey || pointer.metaKey || pointer.ctrlKey);
      };
      const materialColor = selected ? '#e6ad53' : fixtureFill(fixture.definition.id);
      const emissiveColor = selected ? '#573511' : '#000000';
      const emissiveIntensity = selected ? 0.16 : 0;

      if (isShelving) {
        const shelfThickness = Math.max(0.018, Math.min(0.035, height / (rows * 8)));
        const postThickness = Math.max(0.02, Math.min(0.04, Math.min(width, depth) * 0.08));
        const plinthHeight = Math.max(0.04, Math.min(0.08, height * 0.04));
        const topCapHeight = Math.max(0.015, Math.min(0.03, height * 0.02));
        const interiorHeight = Math.max(0.1, height - plinthHeight - topCapHeight);
        const rowHeight = interiorHeight / rows;

        const shelfColor = '#ffffff';
        const backColor = selected ? '#fef3c7' : '#ffffff';
        const frameColor = selected ? '#f59e0b' : '#f1f5f9';
        const plinthColor = selected ? '#d97706' : '#cbd5e1';
        const frameEmissive = selected ? '#b45309' : '#000000';
        const frameEmissiveIntensity = selected ? 0.25 : 0;

        return <group key={fixture.id} position={box.position} rotation={[0, box.rotationY, 0]} onClick={selectFixture}>
          {/* Base plinth / kickplate */}
          <mesh position={[0, -height / 2 + plinthHeight / 2, 0]}>
            <boxGeometry args={[width, plinthHeight, depth]} />
            <meshStandardMaterial color={plinthColor} roughness={0.8}
              emissive={frameEmissive} emissiveIntensity={frameEmissiveIntensity} />
          </mesh>
          {/* Top cap / header frame */}
          <mesh position={[0, height / 2 - topCapHeight / 2, 0]}>
            <boxGeometry args={[width, topCapHeight, depth]} />
            <meshStandardMaterial color={frameColor} roughness={0.6}
              emissive={frameEmissive} emissiveIntensity={frameEmissiveIntensity} />
          </mesh>
          {/* Back/Center upright partition */}
          {fixture.definition.id !== 'rack' && <mesh position={[0, 0, fixture.definition.id === 'wall-shelf' ? -depth / 2 + postThickness / 2 : 0]}>
            <boxGeometry args={[width, height, postThickness]} />
            <meshStandardMaterial color={backColor} roughness={0.3}
              emissive={selected ? '#f59e0b' : '#ffffff'} emissiveIntensity={selected ? 0.2 : 0.05} />
          </mesh>}
          {/* Side upright posts */}
          <mesh position={[-width / 2 + postThickness / 2, 0, 0]}>
            <boxGeometry args={[postThickness, height, depth]} />
            <meshStandardMaterial color={frameColor} roughness={0.6}
              emissive={frameEmissive} emissiveIntensity={frameEmissiveIntensity} />
          </mesh>
          <mesh position={[width / 2 - postThickness / 2, 0, 0]}>
            <boxGeometry args={[postThickness, height, depth]} />
            <meshStandardMaterial color={frameColor} roughness={0.6}
              emissive={frameEmissive} emissiveIntensity={frameEmissiveIntensity} />
          </mesh>
          {/* Distinct shelf tiers: exactly `rows` pure white shelf boards */}
          {Array.from({ length: rows }, (_, r) => {
            const shelfY = -height / 2 + plinthHeight + r * rowHeight + shelfThickness / 2;
            const shelfBoardTop = shelfY + shelfThickness / 2;
            const shelfWidth = Math.max(0.01, width - postThickness * 2);

            let tierItems: PlacedSkuItem[] = [];
            const planogram = fixture.properties.planogram as any;
            if (Array.isArray(planogram)) {
              const match = planogram.find((t: any) => t && t.tierIndex === r);
              if (match && Array.isArray(match.items)) tierItems = match.items;
            } else if (planogram && typeof planogram === 'object') {
              const items = planogram[r] ?? planogram[`tier-${r}`];
              if (Array.isArray(items)) tierItems = items;
            }

            return <group key={`shelf-${r}`}>
              {/* Shelf board */}
              <mesh position={[0, shelfY, 0]}>
                <boxGeometry args={[shelfWidth, shelfThickness, depth]} />
                <meshStandardMaterial color={shelfColor} roughness={0.2} metalness={0.0}
                  emissive="#ffffff" emissiveIntensity={selected ? 0.25 : 0.08} />
              </mesh>
              {/* Shelf-edge price-tag rail */}
              <mesh position={[0, shelfY, depth / 2 + 0.003]}>
                <boxGeometry args={[shelfWidth, shelfThickness * 1.5, 0.006]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} />
              </mesh>
              {/* Shelf-edge accent tags */}
              <mesh position={[0, shelfY, depth / 2 + 0.006]}>
                <boxGeometry args={[shelfWidth * 0.9, shelfThickness * 0.9, 0.002]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
              </mesh>
              {/* 3D Products on this shelf tier */}
              <ShelfTierProducts
                planogramItems={tierItems}
                tierIndex={r}
                shelfBoardTop={shelfBoardTop}
                shelfThickness={shelfThickness}
                fixtureWidth={width}
                fixtureDepth={depth}
                postThickness={postThickness}
              />
            </group>;
          })}
        </group>;
      }

      return <mesh key={fixture.id} position={box.position} rotation={[0, box.rotationY, 0]} onClick={selectFixture}>
        <boxGeometry args={box.size} />
        <meshStandardMaterial color={materialColor}
          roughness={0.8} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
      </mesh>;
    })}
  </>;
}

export default function FloorViewer({ store }: { store: EditorStore }) {
  const floor = useStore(store, (state) => state.document);
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const context = document.createElement('canvas').getContext('webgl2');
      setSupported(!!context);
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    }
    catch { setSupported(false); }
  }, []);
  const bounds = floorBounds(floor);
  if (supported === null) return <div className="floor-viewer-message">Loading 3D viewer…</div>;
  if (!supported) return <div className="floor-viewer-message">3D viewing needs WebGL in this browser. Switch to 2D to keep editing.</div>;
  return <div className="floor-viewer" role="group" aria-label="3D floor viewer">
    <Canvas onPointerMissed={() => store.getState().select(null)} camera={{ position: [bounds.centerX + bounds.span * 0.65,
      floor.baseElevation + bounds.span * 0.8, bounds.centerZ + bounds.span * 0.9],
      fov: 45, near: 0.1, far: Math.max(1000, bounds.span * 20) }}>
      <Scene store={store} />
    </Canvas>
  </div>;
}
