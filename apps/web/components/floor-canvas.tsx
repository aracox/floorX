'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import Konva from 'konva';
import { Stage, Layer, Group, Rect, Line, Path, Text } from 'react-konva';
import { fitViewport, screenToFloor, zoomAt, type EditorStore } from '@floorx/state';
import { type Point } from '@floorx/floor-model';

const path = (rings: Point[][]) => rings.map((ring) => `M ${ring.map((p) => `${p.x},${p.z}`).join(' L ')} Z`).join(' ');
export default function FloorCanvas({ store, tool, onAdd, onSize, onError }: {
  store: EditorStore; tool: 'select' | 'pan'; onAdd: (point: Point) => void;
  onSize: (size: { width: number; height: number }) => void; onError: (message: string) => void;
}) {
  const state = useStore(store);
  const container = useRef<HTMLDivElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const fitted = useRef(false);
  const active = useRef<Konva.Node | null>(null);
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
      if (event.dataTransfer.getData('application/floorx-component') !== 'gondola') return;
      const bounds = event.currentTarget.getBoundingClientRect();
      onAdd(screenToFloor({ x: event.clientX - bounds.left, y: event.clientY - bounds.top }, store.getState().viewport));
    }}>
    <Stage ref={stage} width={size.width} height={size.height} x={view.x} y={view.y} scaleX={view.scale} scaleY={view.scale} draggable={tool === 'pan'}
      onMouseDown={() => { if (tool === 'select') state.select(null); }}
      onTouchStart={() => { if (tool === 'select') state.select(null); }}
      onDragEnd={(event) => {
        if (event.target !== stage.current) return;
        state.setViewport({ ...view, x: event.target.x(), y: event.target.y() });
      }}
      onWheel={(event) => {
        event.evt.preventDefault();
        if (store.getState().move || stage.current?.isDragging()) return;
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
          const { width, depth } = fixture.dimensions;
          return <Group key={fixture.id} x={position.x} y={position.z} rotation={fixture.rotation * 180 / Math.PI} draggable={tool === 'select'} _useStrictMode
            onMouseDown={(event) => { if (tool === 'select') { event.cancelBubble = true; state.select(fixture.id); } }}
            onTouchStart={(event) => { if (tool === 'select') { event.cancelBubble = true; state.select(fixture.id); } }}
            onDragStart={(event) => { event.cancelBubble = true; active.current = event.target; state.beginMove(fixture.id); }}
            onDragMove={(event) => { event.cancelBubble = true; state.previewMove({ x: event.target.x(), z: event.target.y() }); }}
            onDragEnd={(event) => {
              event.cancelBubble = true;
              try {
                if (store.getState().move) {
                  state.previewMove({ x: event.target.x(), z: event.target.y() });
                  state.finishMove();
                }
              } catch { onError('That position is outside the supported model range. The fixture was restored.'); }
              finally {
                active.current = null;
                const saved = store.getState().document.fixtures.find((f) => f.id === fixture.id)!;
                event.target.position({ x: saved.position.x, y: saved.position.z });
              }
            }}>
            <Rect x={-width / 2} y={-depth / 2} width={width} height={depth} fill={selected ? '#277f68' : '#80b5a4'} stroke={selected ? '#123e32' : '#4d8976'} strokeWidth={(selected ? 2 : 1) / view.scale} shadowColor="#123e32" shadowOpacity={0.12} shadowBlur={selected ? 6 / view.scale : 0} />
            <Line points={[-width / 2, 0, width / 2, 0]} stroke="#d5e9e0" strokeWidth={1 / view.scale} listening={false} />
            {selected && <Rect x={-width / 2 - 4 / view.scale} y={-depth / 2 - 4 / view.scale} width={width + 8 / view.scale} height={depth + 8 / view.scale} stroke="#236d59" strokeWidth={1 / view.scale} dash={[4 / view.scale, 3 / view.scale]} listening={false} />}
            <Text text={`G${index + 1}`} x={-width / 2} y={depth / 2 + 6 / view.scale} fontSize={11 / view.scale} fill="#456456" listening={false} />
          </Group>;
        })}
      </Layer>
    </Stage>
  </div>;
}
