/**
 * Handles linked-thought backlink hover highlighting and the Fly-Forward
 * Note Inspector Card interactions.
 */

export interface InspectorCallbacks {
  onSelectThought: (thoughtId: string, targetYawRad: number) => void;
  onCloseInspector: () => void;
}

export function initOrbitInspector(
  nodeElements: HTMLElement[],
  edgeLines: SVGLineElement[],
  callbacks: InspectorCallbacks
): {
  highlightConnections: (activeId: string | null) => void;
  selectThoughtById: (thoughtId: string) => void;
} {
  const nodeMap = new Map<string, HTMLElement>();
  const adjacency = new Map<string, Set<string>>();

  for (const el of nodeElements) {
    const id = el.dataset.thoughtId;
    if (!id) continue;
    nodeMap.set(id, el);
    const rawLinks = (el.dataset.links ?? '').split(',').filter(Boolean);
    if (!adjacency.has(id)) adjacency.set(id, new Set());
    for (const target of rawLinks) {
      adjacency.get(id)!.add(target);
      if (!adjacency.has(target)) adjacency.set(target, new Set());
      adjacency.get(target)!.add(id);
    }
  }

  const inspectorEl = document.getElementById('thought-inspector');
  const kindEl = document.getElementById('inspector-kind');
  const countEl = document.getElementById('inspector-links-count');
  const titleEl = document.getElementById('inspector-title');
  const markdownEl = document.getElementById('inspector-markdown');
  const neighborsContainer = document.getElementById('inspector-neighbors');
  const sectionLink = document.getElementById('inspector-section-link') as HTMLAnchorElement | null;
  const sectionLabel = document.getElementById('inspector-section-label');
  const closeBtn = document.getElementById('inspector-close-btn');

  let lockedThoughtId: string | null = null;

  function highlightConnections(activeId: string | null): void {
    const focusId = activeId ?? lockedThoughtId;
    if (!focusId) {
      for (const el of nodeElements) {
        el.classList.remove('is-highlighted', 'is-dimmed');
      }
      for (const line of edgeLines) {
        line.classList.remove('is-active', 'is-dimmed');
      }
      return;
    }

    const neighbors = adjacency.get(focusId) ?? new Set<string>();
    for (const el of nodeElements) {
      const id = el.dataset.thoughtId ?? '';
      const isSelfOrNeighbor = id === focusId || neighbors.has(id);
      el.classList.toggle('is-highlighted', isSelfOrNeighbor);
      el.classList.toggle('is-dimmed', !isSelfOrNeighbor);
    }

    for (const line of edgeLines) {
      const from = line.dataset.edgeFrom ?? '';
      const to = line.dataset.edgeTo ?? '';
      const isIncident = from === focusId || to === focusId;
      line.classList.toggle('is-active', isIncident);
      line.classList.toggle('is-dimmed', !isIncident);
    }
  }

  function selectThoughtById(thoughtId: string): void {
    const el = nodeMap.get(thoughtId);
    if (!el) return;

    lockedThoughtId = thoughtId;
    for (const node of nodeElements) {
      const isSelected = node.dataset.thoughtId === thoughtId;
      node.classList.toggle('is-selected', isSelected);
      node.setAttribute('aria-expanded', isSelected ? 'true' : 'false');
    }

    const neighbors = Array.from(adjacency.get(thoughtId) ?? []);
    if (inspectorEl) inspectorEl.dataset.open = 'true';
    if (kindEl) kindEl.textContent = el.dataset.kind ?? 'NOTE';
    if (countEl) countEl.textContent = `${neighbors.length} connected thoughts`;
    if (titleEl) titleEl.textContent = el.dataset.title ?? '';
    if (markdownEl) markdownEl.textContent = el.dataset.markdown ?? '';
    if (sectionLink && el.dataset.href) sectionLink.href = el.dataset.href;
    if (sectionLabel) sectionLabel.textContent = el.dataset.sectionLabel ?? '';

    if (neighborsContainer) {
      neighborsContainer.innerHTML = '';
      for (const nId of neighbors) {
        const targetNode = nodeMap.get(nId);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'inspector-neighbor-btn';
        btn.textContent = targetNode?.dataset.title ?? `[[${nId}]]`;
        btn.addEventListener('click', () => selectThoughtById(nId));
        neighborsContainer.appendChild(btn);
      }
    }

    highlightConnections(thoughtId);

    // Rotate sphere so selected thought flies to front-center (theta + yaw = 0)
    const thetaDeg = Number(el.dataset.theta ?? 0);
    const targetYawRad = (-thetaDeg * Math.PI) / 180;
    callbacks.onSelectThought(thoughtId, targetYawRad);
  }

  for (const el of nodeElements) {
    const id = el.dataset.thoughtId;
    if (!id) continue;
    el.addEventListener('pointerenter', () => highlightConnections(id));
    el.addEventListener('pointerleave', () => highlightConnections(null));
    el.addEventListener('focus', () => highlightConnections(id));
    el.addEventListener('blur', () => highlightConnections(null));
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectThoughtById(id);
    });
  }

  closeBtn?.addEventListener('click', () => {
    lockedThoughtId = null;
    if (inspectorEl) inspectorEl.dataset.open = 'false';
    for (const node of nodeElements) {
      node.classList.remove('is-selected');
      node.setAttribute('aria-expanded', 'false');
    }
    highlightConnections(null);
    callbacks.onCloseInspector();
  });

  neighborsContainer?.querySelectorAll<HTMLButtonElement>('[data-neighbor-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.neighborJump) selectThoughtById(btn.dataset.neighborJump);
    });
  });

  return { highlightConnections, selectThoughtById };
}
