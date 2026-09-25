export const EPSILON = 1e-6;
export const TAU = 2 * Math.PI;
export type Point = { x: number; z: number };

export function normalizeRotation(angle: number): number {
  if (!Number.isFinite(angle)) throw new Error('Rotation must be finite');
  return ((angle % TAU) + TAU) % TAU;
}

export function transformPoint(local: Point, center: Point, rotation: number): Point {
  return {
    x: center.x + local.x * Math.cos(rotation) - local.z * Math.sin(rotation),
    z: center.z + local.x * Math.sin(rotation) + local.z * Math.cos(rotation),
  };
}

export function fixtureCorners(fixture: {
  position: Point;
  rotation: number;
  dimensions: { width: number; depth: number };
}): Point[] {
  const { width, depth } = fixture.dimensions;
  return [
    { x: -width / 2, z: -depth / 2 },
    { x: width / 2, z: -depth / 2 },
    { x: width / 2, z: depth / 2 },
    { x: -width / 2, z: depth / 2 },
  ].map((p) => transformPoint(p, fixture.position, fixture.rotation));
}

export const rotationToPlanDegrees = (radians: number): number => radians * 180 / Math.PI;
export const rotationToThreeY = (radians: number): number => -radians;
export const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.z - a.z);
const cross = (a: Point, b: Point, c: Point): number =>
  (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);

export function signedArea(ring: Point[]): number {
  const origin = ring[0];
  return ring.reduce((sum, p, i) => sum + cross(origin, p, ring[(i + 1) % ring.length]), 0) / 2;
}

function onSegment(p: Point, a: Point, b: Point): boolean {
  const length = distance(a, b);
  return Math.abs(cross(a, b, p)) <= EPSILON * length &&
    p.x >= Math.min(a.x, b.x) - EPSILON && p.x <= Math.max(a.x, b.x) + EPSILON &&
    p.z >= Math.min(a.z, b.z) - EPSILON && p.z <= Math.max(a.z, b.z) + EPSILON;
}

function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  if (onSegment(a, c, d) || onSegment(b, c, d) || onSegment(c, a, b) || onSegment(d, a, b)) return true;
  return (cross(a, b, c) > 0) !== (cross(a, b, d) > 0) &&
    (cross(c, d, a) > 0) !== (cross(c, d, b) > 0);
}

export function isSimpleRing(ring: Point[]): boolean {
  if (ring.length < 3 || Math.abs(signedArea(ring)) <= EPSILON * EPSILON) return false;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if (distance(a, b) <= EPSILON) return false;
    const c = ring[(i + 2) % ring.length];
    if (onSegment(c, a, b) || onSegment(a, b, c)) return false;
    for (let j = i + 2; j < ring.length; j++) {
      if (i === 0 && j === ring.length - 1) continue;
      if (intersects(a, b, ring[j], ring[(j + 1) % ring.length])) return false;
    }
  }
  return true;
}

function strictlyInside(p: Point, ring: Point[]): boolean {
  let inside = false;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if (onSegment(p, a, b)) return false;
    if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

function ringsIntersect(a: Point[], b: Point[]): boolean {
  return a.some((p, i) => b.some((q, j) => intersects(p, a[(i + 1) % a.length], q, b[(j + 1) % b.length])));
}

export function validPolygon(outer: Point[], holes: Point[][]): boolean {
  if (!isSimpleRing(outer) || signedArea(outer) <= 0) return false;
  return holes.every((hole, i) => {
    if (!isSimpleRing(hole) || signedArea(hole) >= 0 || !strictlyInside(hole[0], outer) || ringsIntersect(hole, outer)) return false;
    return holes.slice(0, i).every((other) => !ringsIntersect(hole, other) &&
      !strictlyInside(hole[0], other) && !strictlyInside(other[0], hole));
  });
}
