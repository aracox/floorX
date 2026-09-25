'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Group, Line, Rect, Transformer } from 'react-konva';
import type { Fixture, Point } from '@floorx/floor-model';
import { changesFromNodeTransform, hasMeaningfulTransform } from './fixture-transform';

export default function FixtureShape({ fixture, position, selected, editable, pixelsPerMeter, fill, onSelect,
  onMoveStart, onMovePreview, onMoveEnd, onTransformStart, onTransformEnd, onTransformFinish, onError }: {
  fixture: Fixture;
  position: Point;
  selected: boolean;
  editable: boolean;
  pixelsPerMeter: number;
  fill: string;
  onSelect: () => void;
  onMoveStart: (node: Konva.Node) => void;
  onMovePreview: (position: Point) => void;
  onMoveEnd: (node: Konva.Node) => void;
  onTransformStart: (cancel: () => void) => void;
  onTransformEnd: (changes: ReturnType<typeof changesFromNodeTransform>) => void;
  onTransformFinish: () => void;
  onError: (message: string) => void;
}) {
  const shape = useRef<Konva.Group>(null);
  const cancelled = useRef(false);
  const transformer = useRef<Konva.Transformer>(null);
  useEffect(() => {
    if (selected && editable && shape.current && transformer.current) {
      transformer.current.nodes([shape.current]);
      transformer.current.getLayer()?.batchDraw();
    }
  }, [selected, editable, fixture.position, fixture.dimensions, fixture.rotation, pixelsPerMeter]);

  const reset = (node: Konva.Group) => {
    node.scale({ x: 1, y: 1 });
    node.position({ x: fixture.position.x, y: fixture.position.z });
    node.rotation(fixture.rotation * 180 / Math.PI);
    transformer.current?.forceUpdate();
  };
  const { width, depth } = fixture.dimensions;
  return <>
    <Group ref={shape} x={position.x} y={position.z} rotation={fixture.rotation * 180 / Math.PI}
      draggable={editable} _useStrictMode
      onMouseDown={(event) => { if (editable) { event.cancelBubble = true; onSelect(); } }}
      onTouchStart={(event) => { if (editable) { event.cancelBubble = true; onSelect(); } }}
      onDragStart={(event) => { event.cancelBubble = true; onMoveStart(event.target); }}
      onDragMove={(event) => { event.cancelBubble = true; onMovePreview({ x: event.target.x(), z: event.target.y() }); }}
      onDragEnd={(event) => { event.cancelBubble = true; onMoveEnd(event.target); }}
      onTransformStart={(event) => { event.cancelBubble = true; const node = shape.current!;
        cancelled.current = false;
        onTransformStart(() => {
          cancelled.current = true;
          transformer.current?.stopTransform();
          reset(node);
        }); }}
      onTransformEnd={(event) => {
        event.cancelBubble = true;
        const node = shape.current!;
        if (cancelled.current) { reset(node); cancelled.current = false; onTransformFinish(); return; }
        try {
          const changes = changesFromNodeTransform(fixture, {
            x: node.x(), z: node.y(), rotationDegrees: node.rotation(),
            scaleX: node.scaleX(), scaleY: node.scaleY(),
          });
          // Return Konva to unit scale before the validated document update rerenders the shape.
          node.scale({ x: 1, y: 1 });
          if (hasMeaningfulTransform(fixture, changes)) onTransformEnd(changes);
          else reset(node);
        } catch {
          reset(node);
          onError('Resize or rotation was rejected. Use positive dimensions within the model range.');
        } finally {
          onTransformFinish();
        }
      }}>
      <Rect x={-width / 2} y={-depth / 2} width={width} height={depth} fill={fill}
        stroke={selected ? '#123e32' : '#4d8976'} strokeWidth={(selected ? 2 : 1) / pixelsPerMeter}
        strokeScaleEnabled={false} shadowColor="#123e32" shadowOpacity={0.12}
        shadowBlur={selected ? 6 / pixelsPerMeter : 0} />
      <Line points={[-width / 2, 0, width / 2, 0]} stroke="#d5e9e0" strokeWidth={1 / pixelsPerMeter} listening={false} />
    </Group>
    {selected && editable && <Transformer ref={transformer} flipEnabled={false} centeredScaling
      keepRatio={false} useSingleNodeRotation ignoreStroke
      enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']}
      anchorSize={10} rotateAnchorOffset={26}
      borderStroke="#236d59" borderStrokeWidth={1}
      anchorFill="white" anchorStroke="#236d59" anchorStrokeWidth={1}
      boundBoxFunc={(oldBox, newBox) => Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10 ? oldBox : newBox}
      onMouseDown={(event) => { event.cancelBubble = true; }}
      onTouchStart={(event) => { event.cancelBubble = true; }} />}
  </>;
}
