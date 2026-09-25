'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import Konva from 'konva';
import { Stage, Layer, Line, Path, Text } from 'react-konva';
import { fitViewport, screenToFloor, zoomAt, type EditorStore } from '@floorx/state';
import { type Point } from '@floorx/floor-model';
import { fixtureCatalog } from '@floorx/component-library';
import FixtureShape from './fixture-shape';

const path = (rings: Point[][]) => rings.map((ring) => `M ${ring.map((p) => `${p.x},${p.z}`).join(' L ')} Z`).join(' ');
export default function FloorCanvas({ store, tool, onAdd, onSize, onError }: {
  store: EditorStore; tool: 'select' | 'pan'; onAdd: (definitionId: string, point: Point) => void;
  onSize: (size: { width: number; height: number }) => void; onError: (message: string) => void;
}) {
  const state = useStore(store);
  const container = useRef<HTMLDivElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const fitted = useRef(false);
  const active = useRef<Konva.Node | null>(null);
  const cancelTransform = useRef<(() => void) | null>(null);
  const [size, setSize] = useState({ width: 800, height: 560 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: Math.max(1, entry.contentRect.width), height: 560 };
      setSize(next); onSize(next);
      if (!fitted.current && next.width > 80) {
        store.getState().setViewport(fitViewport(store.getState().document.boundary.outer, next));
        fitted.current = true;
      }
    });
    observer.observe(container.current!);
    return () => observer.disconnect();
  }, [onSize, store]);

  function cancelDrag() {
    cancelTransform.current?.();
    cancelTransform.current = null;
    const node = active.current;
    const id = store.getState().move?.id;
    const fixture = store.getState().document.fixtures.find((f) => f.id === id);
    store.getState().cancelMove();
    if (node) {
      node.stopDrag();
      if (fixture) node.position({ x: fixture.position.x, y: fixture.position.z });
      active.current = null;
    }
    if (stage.current?.isDragging()) {
      stage.current.position({ x: state.viewport.x, y: state.viewport.y });
      stage.current.stopDrag();
    }
  }
  const view = state.viewport;
  const topLeft = screenToFloor({ x: 0, y: 0 }, view);
  const bottomRight = screenToFloor({ x: size.width, y: size.height }, view);
  const step = Math.max(1, 10 ** Math.ceil(Math.log10(18 / view.scale)));
  const vertical: number[] = [], horizontal: number[] = [];
  for (let x = Math.ceil(topLeft.x / step) * step; x <= bottomRight.x; x += step) vertical.push(x);
  for (let z = Math.ceil(topLeft.z / step) * step; z <= bottomRight.z; z += step) horizontal.push(z);

  return <div className={`floor-canvas ${tool}`} ref={container} tabIndex={0} role="group" aria-label="Interactive floor canvas" onMouseDownCapture={() => container.current?.focus({ preventScroll: true })}
    onKeyDown={(event) => { if (event.key === 'Escape') cancelDrag(); }}
    onDragOver={(event) => { if (event.dataTransfer.types.includes('application/floorx-component')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
    onDrop={(event) => {
      event.preventDefault();
      const definitionId = event.dataTransfer.getData('application/floorx-component');
      if (!fixtureCatalog.some((definition) => definition.id === definitionId)) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      onAdd(definitionId, screenToFloor({ x: event.clientX - bounds.left, y: event.clientY - bounds.top }, store.getState().viewport));
    }}>
    <Stage ref={stage} width={size.width} height={size.height} x={view.x} y={view.y} scaleX={view.scale} scaleY={view.scale} draggable={tool === 'pan'}
      onMouseDown={(event) => {
        if (tool !== 'select') return;
        state.select(null);
        if (event.evt.button === 0 && (event.evt.metaKey || event.evt.ctrlKey)) stage.current?.startDrag(event);
      }}
      onTouchStart={() => { if (tool === 'select') state.select(null); }}
      onDragEnd={(event) => {
        if (event.target !== stage.current) return;
        state.setViewport({ ...view, x: event.target.x(), y: event.target.y() });
      }}
      onWheel={(event) => {
        if (!event.evt.metaKey && !event.evt.ctrlKey) return;
        event.evt.preventDefault();
        if (store.getState().move || cancelTransform.current || stage.current?.isDragging()) return;
        const pointer = stage.current?.getPointerPosition();
        if (pointer) state.setViewport(zoomAt(store.getState().viewport, pointer, Math.exp(-Math.max(-100, Math.min(100, event.evt.deltaY)) * 0.005)));
      }}>
      <Layer>
        <Path data={path([state.document.boundary.outer, ...state.document.boundary.holes])} fill="white" fillRule="evenodd" stroke="#b9c9c1" strokeWidth={1.5 / view.scale} />
        {vertical.map((x) => <Line key={`x${x}`} points={[x, topLeft.z, x, bottomRight.z]} stroke="#dce6df" strokeWidth={0.6 / view.scale} listening={false} />)}
        {horizontal.map((z) => <Line key={`z${z}`} points={[topLeft.x, z, bottomRight.x, z]} stroke="#dce6df" strokeWidth={0.6 / view.scale} listening={false} />)}
        {state.document.zones.map((zone) => <Path key={zone.id} data={path([zone.boundary.outer, ...zone.boundary.holes])} fill="#d8e8ff" opacity={0.6} fillRule="evenodd" listening={false} />)}
        {state.document.walls.map((wall) => <Line key={wall.id} points={[wall.start.x, wall.start.z, wall.end.x, wall.end.z]} stroke="#344b45" strokeWidth={wall.thickness} listening={false} />)}
        {state.document.openings.map((opening) => {
          const wall = state.document.walls.find((w) => w.id === opening.wallId)!;
          const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
          const ux = (wall.end.x - wall.start.x) / length, uz = (wall.end.z - wall.start.z) / length;
          return <Line key={opening.id} points={[wall.start.x + ux * opening.offset, wall.start.z + uz * opening.offset, wall.start.x + ux * (opening.offset + opening.width), wall.start.z + uz * (opening.offset + opening.width)]} stroke="#edab54" strokeWidth={wall.thickness * 1.15} listening={false} />;
        })}
        {state.document.fixtures.map((fixture, index) => {
          const position = state.move?.id === fixture.id ? state.move.position : fixture.position;
          const selected = fixture.id === state.selectedId;
          const fill = {
            gondola: '#80b5a4', 'wall-shelf': '#82a9c4', rack: '#bdad85',
            freezer: '#83b9d2', checkout: '#a7a2cf', 'promotion-island': '#d7aa73',
          }[fixture.definition.id] ?? '#80b5a4';
          return <FixtureShape key={fixture.id} fixture={fixture} position={position} selected={selected}
            editable={tool === 'select'} pixelsPerMeter={view.scale} fill={fill}
            onSelect={() => state.select(fixture.id)}
            onMoveStart={(node) => { active.current = node; state.beginMove(fixture.id); }}
            onMovePreview={(point) => state.previewMove(point)}
            onMoveEnd={(node) => {
              try {
                if (store.getState().move) {
                  state.previewMove({ x: node.x(), z: node.y() });
                  state.finishMove();
                }
              } catch { onError('That position is outside the supported model range. The fixture was restored.'); }
              finally {
                active.current = null;
                const saved = store.getState().document.fixtures.find((item) => item.id === fixture.id)!;
                node.position({ x: saved.position.x, y: saved.position.z });
              }
            }}
            onTransformStart={(cancel) => { cancelTransform.current = cancel; }}
            onTransformEnd={(changes) => state.updateFixture(fixture.id, changes)}
            onTransformFinish={() => { cancelTransform.current = null; }}
            onError={onError} />;
        })}
        {state.document.fixtures.map((fixture, index) => {
          const position = state.move?.id === fixture.id ? state.move.position : fixture.position;
          const name = state.document.definitions.find((item) => item.id === fixture.definition.id && item.version === fixture.definition.version)?.name ?? 'Fixture';
          return <Text key={`label-${fixture.id}`} text={`${name} ${index + 1}`}
            x={position.x - fixture.dimensions.width / 2} y={position.z + fixture.dimensions.depth / 2 + 7 / view.scale}
            fontSize={11 / view.scale} fill="#456456" listening={false} />;
        })}
      </Layer>
    </Stage>
  </div>;
}
