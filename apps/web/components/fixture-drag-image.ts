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
  if (typeof document === 'undefined') return null;
  const { width, height } = fixtureDragImageSize(dimensions, pixelsPerMeter);
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.position = 'fixed';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.zIndex = '-9999';
  canvas.style.opacity = '0.99';
  canvas.style.pointerEvents = 'none';

  const context = canvas.getContext('2d');
  if (!context) return null;

  context.scale(dpr, dpr);
  context.fillStyle = fixtureFill(definitionId);
  context.fillRect(0, 0, width, height);
  context.strokeStyle = fixtureOutline;
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, Math.max(0, width - 1), Math.max(0, height - 1));
  context.strokeStyle = fixtureCenterLine;
  context.lineWidth = 1;
  context.beginPath();
  const midY = Math.round(height / 2) + 0.5;
  context.moveTo(0, midY);
  context.lineTo(width, midY);
  context.stroke();

  document.body.appendChild(canvas);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    window.removeEventListener('dragend', cleanup);
  };

  window.addEventListener('dragend', cleanup, { once: true });
  setTimeout(cleanup, 10000);

  return {
    canvas,
    offsetX: Math.round(width / 2),
    offsetY: Math.round(height / 2),
    cleanup,
  };
}

