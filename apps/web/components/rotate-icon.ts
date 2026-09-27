import type Konva from 'konva';

type IconPaths = { leftArc: Path2D; rightArc: Path2D; arrowHead: Path2D };
let cachedPaths: IconPaths | null = null;

function getRotateIconPaths(): IconPaths | null {
  if (typeof Path2D === 'undefined') return null;
  if (!cachedPaths) {
    // 32x32 viewBox geometry matching the user's rotate icon:
    // Continuous arc on the left from 6 o'clock to 12 o'clock
    const leftArc = new Path2D('M 16 26 A 10 10 0 0 1 14 6.2');
    // Dashed arc on the right
    const rightArc = new Path2D('M 16 26 A 10 10 0 0 0 25.5 13');
    // Arrowhead at top pointing clockwise
    const arrowHead = new Path2D('M 12 1.5 L 21 8.5 L 12 14 Z');
    cachedPaths = { leftArc, rightArc, arrowHead };
  }
  return cachedPaths;
}

export function drawRotateHandleIcon(rawCtx: CanvasRenderingContext2D, size: number) {
  rawCtx.save();
  const scale = size / 32;
  rawCtx.scale(scale, scale);

  // Clean circular white background disc so the stem line terminates cleanly at the icon boundary
  rawCtx.beginPath();
  rawCtx.arc(16, 16, 13.5, 0, Math.PI * 2);
  rawCtx.fillStyle = '#ffffff';
  rawCtx.fill();
  rawCtx.strokeStyle = '#e2e8f0';
  rawCtx.lineWidth = 1;
  rawCtx.stroke();

  const color = '#0ea5e9'; // Bright cyan/blue matching user attachment
  const paths = getRotateIconPaths();

  if (paths) {
    rawCtx.strokeStyle = color;
    rawCtx.lineWidth = 3.5;
    rawCtx.lineCap = 'round';
    rawCtx.setLineDash([]);
    rawCtx.stroke(paths.leftArc);

    rawCtx.setLineDash([5, 4]);
    rawCtx.stroke(paths.rightArc);

    rawCtx.fillStyle = color;
    rawCtx.fill(paths.arrowHead);
  } else {
    // Canvas 2D fallback when Path2D is unavailable
    const cx = 16, cy = 16, r = 10;
    rawCtx.strokeStyle = color;
    rawCtx.lineWidth = 3.5;
    rawCtx.lineCap = 'round';
    rawCtx.setLineDash([]);
    rawCtx.beginPath();
    rawCtx.arc(cx, cy, r, Math.PI / 2, -Math.PI * 0.45, false);
    rawCtx.stroke();

    rawCtx.beginPath();
    rawCtx.setLineDash([5, 4]);
    rawCtx.arc(cx, cy, r, Math.PI / 2, -Math.PI * 0.1, true);
    rawCtx.stroke();

    rawCtx.fillStyle = color;
    rawCtx.beginPath();
    rawCtx.moveTo(12, 1.5);
    rawCtx.lineTo(21, 8.5);
    rawCtx.lineTo(12, 14);
    rawCtx.closePath();
    rawCtx.fill();
  }
  rawCtx.restore();
}

export function styleRotateAnchor(anchor: Konva.Rect, size = 18) {
  if (!anchor.hasName('rotater')) return;

  anchor.width(size);
  anchor.height(size);
  anchor.offsetX(size / 2);
  anchor.offsetY(size / 2);
  anchor.fill('transparent');
  anchor.stroke('transparent');
  anchor.strokeWidth(0);

  // Custom scene drawing of the rotate arrow icon
  anchor.sceneFunc((context: any) => {
    const rawCtx = context._context as CanvasRenderingContext2D;
    drawRotateHandleIcon(rawCtx, size);
  });

  // Generous hit zone around the icon for easy drag interaction
  anchor.hitFunc((context: any) => {
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2 + 5, 0, Math.PI * 2);
    context.closePath();
    context.fillStrokeShape(anchor);
  });
}
