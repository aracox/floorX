import { EPSILON, rotationToThreeY, type FloorDocument, type Fixture } from '@floorx/floor-model';

export type BoxPose = {
  position: [number, number, number];
  size: [number, number, number];
  rotationY: number;
};

export function floorBounds(document: FloorDocument) {
  const points = document.boundary.outer;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minZ = Math.min(...points.map((point) => point.z));
  const maxZ = Math.max(...points.map((point) => point.z));
  return { centerX: (minX + maxX) / 2, centerZ: (minZ + maxZ) / 2, span: Math.max(maxX - minX, maxZ - minZ) };
}

export function fixtureBox(fixture: Fixture, baseElevation: number): BoxPose {
  const { width, depth, height } = fixture.dimensions;
  return {
    position: [fixture.position.x, baseElevation + height / 2, fixture.position.z],
    size: [width, height, depth],
    rotationY: rotationToThreeY(fixture.rotation),
  };
}

export function wallBoxes(document: FloorDocument): (BoxPose & { wallId: string })[] {
  return document.walls.flatMap((wall) => {
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.hypot(dx, dz);
    const openings = document.openings.filter((opening) => opening.wallId === wall.id);
    const cuts = [...new Set([0, length, ...openings.flatMap((opening) => [opening.offset, opening.offset + opening.width])])]
      .sort((a, b) => a - b);
    const boxes: (BoxPose & { wallId: string })[] = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const start = cuts[i], end = cuts[i + 1];
      if (end - start <= EPSILON) continue;
      const gaps = openings.filter((opening) => opening.offset < end - EPSILON && opening.offset + opening.width > start + EPSILON)
        .map((opening) => [opening.sillHeight, opening.sillHeight + opening.height] as const)
        .sort((a, b) => a[0] - b[0]);
      const addBox = (bottom: number, top: number) => {
        if (top - bottom <= EPSILON) return;
        const distance = (start + end) / 2;
        boxes.push({ wallId: wall.id,
          position: [wall.start.x + dx / length * distance, document.baseElevation + (bottom + top) / 2,
            wall.start.z + dz / length * distance],
          size: [end - start, top - bottom, wall.thickness],
          rotationY: -Math.atan2(dz, dx) });
      };
      let solidFrom = 0;
      for (const [gapBottom, gapTop] of gaps) {
        addBox(solidFrom, gapBottom);
        solidFrom = Math.max(solidFrom, gapTop);
      }
      addBox(solidFrom, wall.height);
    }
    return boxes;
  });
}
