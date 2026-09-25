import { EPSILON, TAU, fixtureSchema, normalizeRotation, type Fixture } from '@floorx/floor-model';

export type NodeTransform = {
  x: number;
  z: number;
  rotationDegrees: number;
  scaleX: number;
  scaleY: number;
};

// Konva mutates a node's scale. Persist dimensions and a center anchor instead.
export function changesFromNodeTransform(fixture: Fixture, node: NodeTransform):
  Pick<Fixture, 'position' | 'rotation' | 'dimensions'> {
  if (!Number.isFinite(node.scaleX) || !Number.isFinite(node.scaleY) || node.scaleX <= 0 || node.scaleY <= 0) {
    throw new Error('Fixture flips and collapsed dimensions are not supported');
  }
  const changes = {
    position: { x: node.x, z: node.z },
    rotation: normalizeRotation(node.rotationDegrees * Math.PI / 180),
    dimensions: {
      width: fixture.dimensions.width * node.scaleX,
      depth: fixture.dimensions.depth * node.scaleY,
      height: fixture.dimensions.height,
    },
  };
  fixtureSchema.parse({ ...fixture, ...changes });
  return changes;
}

export function hasMeaningfulTransform(fixture: Fixture, changes: ReturnType<typeof changesFromNodeTransform>): boolean {
  const delta = Math.abs(fixture.rotation - changes.rotation);
  return Math.abs(fixture.position.x - changes.position.x) > EPSILON ||
    Math.abs(fixture.position.z - changes.position.z) > EPSILON ||
    Math.abs(fixture.dimensions.width - changes.dimensions.width) > EPSILON ||
    Math.abs(fixture.dimensions.depth - changes.dimensions.depth) > EPSILON ||
    Math.min(delta, TAU - delta) > EPSILON;
}
