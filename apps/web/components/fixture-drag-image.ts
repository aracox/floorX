import { fixtureCenterLine, fixtureFill, fixtureOutline } from './fixture-appearance';

export function fixtureDragImageSize(dimensions: { width: number; depth: number }, pixelsPerMeter: number) {
  return {
    width: Math.max(1, Math.round(dimensions.width * pixelsPerMeter)),
    height: Math.max(1, Math.round(dimensions.depth * pixelsPerMeter)),
  };
}

export function createFixtureDragImage(
  dimensions: { width: number; depth: number }, pixelsPerMeter: number, definitionId: string,
) {
  const { width, height } = fixtureDragImageSize(dimensions, pixelsPerMeter);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = fixtureFill(definitionId);
  context.fillRect(0, 0, width, height);
  context.strokeStyle = fixtureOutline;
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, width - 1, height - 1);
  context.strokeStyle = fixtureCenterLine;
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  return { canvas, offsetX: width / 2, offsetY: height / 2 };
}
