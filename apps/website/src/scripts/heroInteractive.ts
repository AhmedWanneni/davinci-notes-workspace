/**
 * Interactive Hero Drag-and-Drop Engine
 * Lets the user grab and move any note, pen, pencil, or alarm clock in the hero,
 * or pull thoughts/notes directly out of the owl's head and place them anywhere.
 */

interface DragSavedState {
  dx: number;
  dy: number;
  rot: number;
  extracted: boolean;
  z: number;
}

export function initHeroInteractive(): void {
  const stage = document.querySelector<HTMLElement>(".hero-artwork-stage");
  if (!stage) return;

  const resetBtn = document.getElementById(
    "hero-reset-desk",
  ) as HTMLButtonElement | null;
  const items = Array.from(
    stage.querySelectorAll<HTMLElement>("[data-draggable-hero]"),
  );
  if (items.length === 0) return;

  let topZ = 30;
  const stateMap = new WeakMap<HTMLElement, DragSavedState>();

  for (const el of items) {
    const initialRot = parseFloat(el.dataset.rot ?? "0") || 0;
    stateMap.set(el, {
      dx: 0,
      dy: 0,
      rot: initialRot,
      extracted: false,
      z: 4,
    });
  }

  const applyTransform = (
    el: HTMLElement,
    st: DragSavedState,
    dragging: boolean,
  ): void => {
    const scale = dragging ? 1.05 : 1;
    const tilt = dragging ? st.rot * 0.65 : st.rot;
    el.style.transform = `translate3d(${st.dx}px, ${st.dy}px, 0) rotate(${tilt}deg) scale(${scale})`;
    el.style.zIndex = String(st.z);
  };

  const revealResetButton = (): void => {
    if (resetBtn && resetBtn.hidden) {
      resetBtn.hidden = false;
    }
  };

  items.forEach((el) => {
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let baseDx = 0;
    let baseDy = 0;
    let movedDistance = 0;

    el.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest(".cta-hand-btn")) return;
      const st = stateMap.get(el);
      if (!st) return;

      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      baseDx = st.dx;
      baseDy = st.dy;
      movedDistance = 0;

      topZ += 1;
      st.z = topZ;

      el.setPointerCapture(pointerId);
      el.classList.add("is-dragging");

      // If this item is being pulled out of the owl's head for the first time, materialize it
      if (el.dataset.fromHead === "true" && !st.extracted) {
        st.extracted = true;
        el.classList.add("is-extracted");
      }

      applyTransform(el, st, true);
    });

    el.addEventListener("pointermove", (e: PointerEvent) => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      const st = stateMap.get(el);
      if (!st) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      movedDistance = Math.hypot(deltaX, deltaY);

      st.dx = baseDx + deltaX;
      st.dy = baseDy + deltaY;

      applyTransform(el, st, true);
      if (movedDistance > 4) {
        revealResetButton();
      }
    });

    const finishDrag = (e: PointerEvent): void => {
      if (pointerId === null || e.pointerId !== pointerId) return;
      const st = stateMap.get(el);
      if (el.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
      pointerId = null;
      el.classList.remove("is-dragging");

      if (st) {
        // If user clicked a head hotspot without dragging far, pop it out slightly so they see it extracted
        if (
          el.dataset.fromHead === "true" &&
          movedDistance < 6 &&
          st.dx === 0 &&
          st.dy === 0
        ) {
          st.dx = (Math.random() - 0.5) * 44;
          st.dy = -28;
          revealResetButton();
        }
        applyTransform(el, st, false);
      }
    };

    el.addEventListener("pointerup", finishDrag);
    el.addEventListener("pointercancel", finishDrag);

    // Prevent accidental navigation on <a data-draggable-hero> when the user dragged the note
    el.addEventListener("click", (e: MouseEvent) => {
      if (movedDistance > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      topZ = 30;
      for (const el of items) {
        const st = stateMap.get(el);
        if (!st) continue;
        st.dx = 0;
        st.dy = 0;
        st.extracted = false;
        st.z = 4;
        el.classList.remove("is-extracted", "is-dragging");
        el.style.transform = "";
        el.style.zIndex = "";
      }
      resetBtn.hidden = true;
    });
  }
}
