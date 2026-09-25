'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, Path, Shape } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useStore } from 'zustand';
import type { FloorDocument } from '@floorx/floor-model';
import type { EditorStore } from '@floorx/state';
import { fixtureBox, floorBounds, wallBoxes } from './viewer-geometry';

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
  const colors: Record<string, string> = {
    gondola: '#80b5a4', 'wall-shelf': '#82a9c4', rack: '#bdad85',
    freezer: '#83b9d2', checkout: '#a7a2cf', 'promotion-island': '#d7aa73',
  };
  return <>
    <color attach="background" args={['#e8f0eb']} />
    <ambientLight intensity={1.4} />
    <directionalLight position={[bounds.centerX + 8, document.baseElevation + 20, bounds.centerZ + 12]} intensity={2.2} />
    <CameraControls {...bounds} elevation={document.baseElevation} />
    <group onClick={() => store.getState().select(null)}>
      <Surface polygon={document.boundary} elevation={document.baseElevation} color="#f9fbf9" />
      {document.zones.map((zone) => <Surface key={zone.id} polygon={zone.boundary}
        elevation={document.baseElevation + 0.01} color="#cfe3ed" />)}
      {wallParts.map((part, index) => <mesh key={`${part.wallId}-${index}`}
        position={part.position} rotation={[0, part.rotationY, 0]}>
        <boxGeometry args={part.size} />
        <meshStandardMaterial color="#637b73" roughness={0.9} />
      </mesh>)}
    </group>
    {document.fixtures.map((fixture) => {
      const box = fixtureBox(fixture, document.baseElevation);
      const selected = state.selectedIds.includes(fixture.id);
      return <mesh key={fixture.id} position={box.position} rotation={[0, box.rotationY, 0]}
        onClick={(event) => {
          event.stopPropagation();
          const pointer = event.nativeEvent;
          store.getState().select(fixture.id, pointer.shiftKey || pointer.metaKey || pointer.ctrlKey);
        }}>
        <boxGeometry args={box.size} />
        <meshStandardMaterial color={selected ? '#e6ad53' : colors[fixture.definition.id] ?? '#80b5a4'}
          roughness={0.8} emissive={selected ? '#573511' : '#000000'} emissiveIntensity={selected ? 0.16 : 0} />
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
