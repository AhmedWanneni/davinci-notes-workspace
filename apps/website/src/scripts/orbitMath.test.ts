import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clamp,
  easeOutCubic,
  projectThoughtNode,
  shortestAngleDeltaRad,
} from './orbitMath.ts';

test('clamp bounds values within [min, max]', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(25, 0, 10), 10);
});

test('easeOutCubic maps 0 -> 0 and 1 -> 1 monotonically', () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.5);
});

test('shortestAngleDeltaRad wraps 360-degree yaw across -PI..PI boundary', () => {
  const delta = shortestAngleDeltaRad(Math.PI * 0.9, -Math.PI * 0.9);
  assert.ok(Math.abs(delta - Math.PI * 0.2) < 1e-6);
});

test('projectThoughtNode classifies front vs behind-head occlusion accurately', () => {
  const baseNode = { id: 'n1', thetaDeg: 0, phiDeg: 0, radiusScale: 1 };

  const frontState = projectThoughtNode(baseNode, {
    yawRad: 0,
    pitchRad: 0,
    emergenceProgress: 1,
    convergenceProgress: 0,
    radiusX: 240,
    radiusY: 160,
    radiusZ: 200,
  });
  assert.equal(frontState.depthLayer, 'near');
  assert.ok(frontState.z > 100);
  assert.ok(frontState.scale > 0.95);

  // Rotate 180 degrees (PI radians) to move node behind the portrait's head
  const backState = projectThoughtNode(baseNode, {
    yawRad: Math.PI,
    pitchRad: 0,
    emergenceProgress: 1,
    convergenceProgress: 0,
    radiusX: 240,
    radiusY: 160,
    radiusZ: 200,
  });
  assert.equal(backState.depthLayer, 'behind');
  assert.ok(backState.z < -100);
  assert.ok(backState.scale < frontState.scale);
  assert.ok(backState.opacity < frontState.opacity);
});

test('projectThoughtNode funnels thoughts downward during scroll convergence', () => {
  const node = { id: 'n2', thetaDeg: 65, phiDeg: 20, radiusScale: 1 };
  const orbiting = projectThoughtNode(node, {
    yawRad: 0,
    pitchRad: 0,
    emergenceProgress: 1,
    convergenceProgress: 0,
    radiusX: 240,
    radiusY: 160,
    radiusZ: 200,
  });
  const converged = projectThoughtNode(node, {
    yawRad: 0,
    pitchRad: 0,
    emergenceProgress: 1,
    convergenceProgress: 1,
    radiusX: 240,
    radiusY: 160,
    radiusZ: 200,
  });

  assert.ok(Math.abs(converged.x) < Math.abs(orbiting.x));
  assert.ok(converged.y > orbiting.y + 200);
});
