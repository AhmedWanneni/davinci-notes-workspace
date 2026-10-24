/**
 * Interactive 360-degree orbital controller, pointer inertia, scroll-linked
 * crown opening, and reduced-motion gate.
 */

import { clamp, projectThoughtNode, shortestAngleDeltaRad, type OrbitNodeInput } from './orbitMath';
import { initOrbitInspector } from './orbitInspector';

interface NodeRuntime {
  el: HTMLElement;
  input: OrbitNodeInput;
  mobileVisible: boolean;
  screenX: number;
  screenY: number;
}

export function mountHeroOrbit(): void {
  const stage = document.getElementById('orbit-stage');
  const heroSection = document.querySelector<HTMLElement>('.hero-stage');
  if (!stage || !heroSection) return;

  const nodeElements = Array.from(stage.querySelectorAll<HTMLElement>('.thought-node'));
  const edgeLines = Array.from(stage.querySelectorAll<SVGLineElement>('.orbit-edge-line'));
  const edgeSvg = document.getElementById('orbit-edges-svg');
  const portraitEl = stage.querySelector<HTMLElement>('.portrait-assembly');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const nodes: NodeRuntime[] = nodeElements.map((el) => ({
    el,
    input: {
      id: el.dataset.thoughtId ?? '',
      thetaDeg: Number(el.dataset.theta ?? 0),
      phiDeg: Number(el.dataset.phi ?? 0),
      radiusScale: Number(el.dataset.radius ?? 1),
    },
    mobileVisible: el.dataset.mobile === 'true',
    screenX: 450,
    screenY: 250,
  }));
  const nodeLookup = new Map<string, NodeRuntime>(nodes.map((n) => [n.input.id, n]));

  let yawRad = 0;
  let pitchRad = 0.08;
  let velocityYaw = 0;
  let velocityPitch = 0;
  let targetYawRad: number | null = null;
  let isDragging = false;
  let isPausedBySelection = false;
  let emergenceProgress = 0.85;
  let convergenceProgress = 0;
  let stageWidth = stage.clientWidth || 800;
  let stageHeight = stage.clientHeight || 620;
  let heroHeight = heroSection.offsetHeight || 760;
  let isCompactMobile = window.innerWidth < 768;
  let isHeroVisible = true;
  let rafId: number | null = null;

  initOrbitInspector(nodeElements, edgeLines, {
    onSelectThought: (_id, targetYaw) => {
      isPausedBySelection = true;
      targetYawRad = yawRad + shortestAngleDeltaRad(yawRad, targetYaw);
      requestTick();
    },
    onCloseInspector: () => {
      isPausedBySelection = false;
      targetYawRad = null;
      requestTick();
    },
  });

  function renderFrame(): void {
    rafId = null;
    let anchorX = stageWidth * 0.5;
    let anchorY = isCompactMobile ? 180 : 220;

    if (portraitEl) {
      const pRect = portraitEl.getBoundingClientRect();
      const sRect = stage.getBoundingClientRect();
      if (pRect.width > 0) {
        anchorX = (pRect.left - sRect.left) + pRect.width * 0.69;
        anchorY = (pRect.top - sRect.top) + pRect.height * 0.11;
      }
    }

    const rx = isCompactMobile ? Math.min(stageWidth * 0.44, 160) : Math.min(stageWidth * 0.48, 340);
    const ry = isCompactMobile ? 80 : 110;
    const rz = isCompactMobile ? 120 : 210;

    for (const item of nodes) {
      if (isCompactMobile && !item.mobileVisible) {
        item.el.style.display = 'none';
        continue;
      }
      item.el.style.display = '';
      const proj = projectThoughtNode(item.input, {
        yawRad,
        pitchRad,
        emergenceProgress,
        convergenceProgress,
        radiusX: rx,
        radiusY: ry,
        radiusZ: rz,
      });
      item.screenX = anchorX + proj.x;
      item.screenY = anchorY + proj.y;
      item.el.style.left = `${item.screenX.toFixed(1)}px`;
      item.el.style.top = `${item.screenY.toFixed(1)}px`;
      item.el.style.transform = `translate3d(-50%, -50%, 0) scale(${proj.scale})`;
      item.el.style.opacity = String(proj.opacity);
      item.el.classList.toggle('is-behind-head', proj.depthLayer === 'behind');
      item.el.classList.toggle('is-near-head', proj.depthLayer === 'near');
    }

    if (edgeSvg) {
      edgeSvg.setAttribute('viewBox', `0 0 ${stageWidth} ${stageHeight}`);
    }

    for (const line of edgeLines) {
      const a = nodeLookup.get(line.dataset.edgeFrom ?? '');
      const b = nodeLookup.get(line.dataset.edgeTo ?? '');
      if (!a || !b || (isCompactMobile && (!a.mobileVisible || !b.mobileVisible))) {
        line.style.display = 'none';
        continue;
      }
      line.style.display = '';
      line.setAttribute('x1', a.screenX.toFixed(1));
      line.setAttribute('y1', a.screenY.toFixed(1));
      line.setAttribute('x2', b.screenX.toFixed(1));
      line.setAttribute('y2', b.screenY.toFixed(1));
    }

    if (reducedMotionQuery.matches || !isHeroVisible) return;
    if (!isDragging) {
      if (targetYawRad !== null) {
        const diff = targetYawRad - yawRad;
        yawRad += diff * 0.12;
        if (Math.abs(diff) < 0.002) targetYawRad = null;
      } else if (!isPausedBySelection) {
        yawRad += 0.0022 + velocityYaw;
        pitchRad = clamp(pitchRad + velocityPitch, -0.45, 0.45);
        velocityYaw *= 0.93;
        velocityPitch *= 0.91;
      }
    }
    if (!isPausedBySelection || targetYawRad !== null || isDragging) {
      rafId = window.requestAnimationFrame(renderFrame);
    }
  }

  function requestTick(): void {
    if (rafId === null && isHeroVisible) rafId = window.requestAnimationFrame(renderFrame);
  }

  let startX = 0, startY = 0, lastX = 0, lastY = 0;
  stage.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging = true;
    targetYawRad = null;
    isPausedBySelection = false;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', (e) => {
    if (!isDragging) {
      if (!reducedMotionQuery.matches) {
        heroSection.style.setProperty('--parallax-x', `${((e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 6).toFixed(1)}px`);
        heroSection.style.setProperty('--parallax-y', `${((e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 6).toFixed(1)}px`);
      }
      return;
    }
    if (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4) {
      velocityYaw = (e.clientX - lastX) * 0.0065;
      velocityPitch = (e.clientY - lastY) * 0.004;
      yawRad += velocityYaw;
      pitchRad = clamp(pitchRad + velocityPitch, -0.45, 0.45);
      lastX = e.clientX;
      lastY = e.clientY;
      renderFrame();
    }
  });

  const endDrag = (): void => {
    if (!isDragging) return;
    isDragging = false;
    requestTick();
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { yawRad -= 0.22; renderFrame(); }
    else if (e.key === 'ArrowRight') { yawRad += 0.22; renderFrame(); }
  });

  window.addEventListener('scroll', () => {
    const ratio = clamp(window.scrollY / Math.max(heroHeight, 1), 0, 1.2);
    const openAmt = clamp(0.72 + ratio * 0.8, 0.35, 1.0);
    emergenceProgress = clamp(0.85 + ratio * 0.5, 0.25, 1.0);
    convergenceProgress = clamp((ratio - 0.48) / 0.52, 0, 1);
    heroSection.style.setProperty('--crown-open-progress', openAmt.toFixed(3));
    if (reducedMotionQuery.matches) renderFrame();
    else requestTick();
  }, { passive: true });

  window.addEventListener('resize', () => {
    stageWidth = stage.clientWidth || 800;
    stageHeight = stage.clientHeight || 620;
    heroHeight = heroSection.offsetHeight || 760;
    isCompactMobile = window.innerWidth < 768;
    renderFrame();
  });

  new IntersectionObserver((entries) => {
    isHeroVisible = entries[0]?.isIntersecting ?? true;
    if (isHeroVisible) requestTick();
  }).observe(heroSection);

  renderFrame();
}
