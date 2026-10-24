/**
 * Pure 3D spherical projection, z-occlusion, and scroll choreography math
 * for the "Opened Mind" orbital thought cloud. Zero DOM dependencies.
 */

export interface OrbitNodeInput {
  id: string;
  thetaDeg: number;
  phiDeg: number;
  radiusScale: number;
}

export interface OrbitProjectionConfig {
  yawRad: number;
  pitchRad: number;
  /** 0 = tucked inside skull cut cavity, 1 = fully emerged into orbital ring */
  emergenceProgress: number;
  /** 0 = normal hero orbit, 1 = funneled downward into Workbench section below */
  convergenceProgress: number;
  radiusX: number;
  radiusY: number;
  radiusZ: number;
}

export interface ProjectedThoughtState {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  depthLayer: 'behind' | 'mid' | 'near';
}

const DEG_TO_RAD = Math.PI / 180;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function easeOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

export function shortestAngleDeltaRad(currentRad: number, targetRad: number): number {
  const twoPi = Math.PI * 2;
  const diff = ((targetRad - currentRad + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  return diff;
}

export function projectThoughtNode(
  node: OrbitNodeInput,
  config: OrbitProjectionConfig
): ProjectedThoughtState {
  const theta = node.thetaDeg * DEG_TO_RAD + config.yawRad;
  const phi = node.phiDeg * DEG_TO_RAD;
  const rScale = node.radiusScale;

  // 1. Ellipsoid Cartesian coordinates around the crown center
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const x0 = config.radiusX * rScale * cosPhi * Math.sin(theta);
  const y0 = -config.radiusY * rScale * sinPhi;
  const z0 = config.radiusZ * rScale * cosPhi * Math.cos(theta);

  // 2. Pitch rotation around the horizontal X-axis
  const cosPitch = Math.cos(config.pitchRad);
  const sinPitch = Math.sin(config.pitchRad);
  const x1 = x0;
  const y1 = y0 * cosPitch - z0 * sinPitch;
  const z1 = y0 * sinPitch + z0 * cosPitch;

  // 3. Emergence interpolation from the skull cut cavity (0, +22px, 0)
  const emerge = easeOutCubic(config.emergenceProgress);
  const cavityOriginY = 22;
  let x = x1 * emerge;
  let y = cavityOriginY * (1 - emerge) + y1 * emerge;
  const z = z1 * emerge;

  // 4. Scroll-past-hero convergence: funnel thoughts down into the Workbench
  const conv = clamp(config.convergenceProgress, 0, 1);
  if (conv > 0) {
    const funnelTightness = 1 - conv * 0.68;
    x *= funnelTightness;
    y += conv * 320;
  }

  // 5. Perspective depth cueing (no CSS filter:blur to preserve 60fps mobile GPU)
  const normalizedDepth = config.radiusZ > 0 ? clamp(z / config.radiusZ, -1.2, 1.2) : 0;
  const baseScale = clamp(0.84 + normalizedDepth * 0.2, 0.64, 1.1);
  const scale = Number((baseScale * (0.42 + 0.58 * emerge) * (1 - conv * 0.22)).toFixed(3));

  const baseOpacity = clamp(0.62 + normalizedDepth * 0.36, 0.28, 1.0);
  const opacity = Number(
    (baseOpacity * clamp(emerge * 1.15, 0.18, 1.0) * (1 - conv * 0.45)).toFixed(3)
  );

  // 6. Z-index occlusion classification relative to portrait base & lifted crown
  let depthLayer: 'behind' | 'mid' | 'near' = 'mid';
  if (z < -16) {
    depthLayer = 'behind';
  } else if (z > 28) {
    depthLayer = 'near';
  }

  return {
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
    z: Number(z.toFixed(1)),
    scale,
    opacity,
    depthLayer,
  };
}
