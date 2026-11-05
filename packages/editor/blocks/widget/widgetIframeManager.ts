import { buildWidgetHtml } from "./widgetHtmlBuilder";

export const MAX_ACTIVE_WIDGET_IFRAMES = 6;
export const DEFAULT_WIDGET_MAX_HEIGHT = 500;
export const MIN_WIDGET_HEIGHT = 60;

interface RegisteredWidget {
  id: string;
  container: HTMLElement;
  source: string;
  iframe: HTMLIFrameElement | null;
  placeholder: HTMLElement | null;
  isVisible: boolean;
  lastActiveTime: number;
  height: number;
}

const widgetsMap = new Map<string, RegisteredWidget>();
let resizeListenerAttached = false;
let globalObserver: IntersectionObserver | null = null;

function handleMessage(event: MessageEvent) {
  const data = event.data;
  if (
    !data ||
    typeof data !== "object" ||
    data.type !== "davinci:widget-resize"
  ) {
    return;
  }
  const { widgetId, height } = data as { widgetId?: string; height?: number };
  if (!widgetId || typeof height !== "number") return;

  const reg = widgetsMap.get(widgetId);
  if (!reg || !reg.iframe) return;

  const clamped = Math.min(
    Math.max(height, MIN_WIDGET_HEIGHT),
    DEFAULT_WIDGET_MAX_HEIGHT,
  );
  reg.height = clamped;
  reg.iframe.style.height = `${clamped}px`;
  reg.container.style.minHeight = `${clamped}px`;
}

function ensureResizeListener() {
  if (resizeListenerAttached || typeof window === "undefined") return;
  window.addEventListener("message", handleMessage);
  resizeListenerAttached = true;
}

function getOrCreateObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }
  if (!globalObserver) {
    globalObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.widgetId;
          if (!id) return;
          const reg = widgetsMap.get(id);
          if (!reg) return;
          reg.isVisible = entry.isIntersecting;
          if (entry.isIntersecting) {
            reg.lastActiveTime = Date.now();
            mountIframe(reg);
          } else {
            unmountIframe(reg);
          }
        });
      },
      { rootMargin: "200px 0px" },
    );
  }
  return globalObserver;
}

function getActiveIframeEntries(): RegisteredWidget[] {
  return Array.from(widgetsMap.values()).filter((w) => w.iframe !== null);
}

function enforceActiveIframeCap() {
  const active = getActiveIframeEntries();
  if (active.length < MAX_ACTIVE_WIDGET_IFRAMES) return;

  // Evict offscreen first, then least recently active
  const candidates = active.sort((a, b) => {
    if (a.isVisible !== b.isVisible) {
      return a.isVisible ? 1 : -1;
    }
    return a.lastActiveTime - b.lastActiveTime;
  });

  const overflow = active.length - MAX_ACTIVE_WIDGET_IFRAMES + 1;
  for (let i = 0; i < overflow && i < candidates.length; i++) {
    unmountIframe(candidates[i]);
  }
}

function mountIframe(reg: RegisteredWidget) {
  if (reg.iframe && reg.iframe.isConnected) return;
  enforceActiveIframeCap();

  if (reg.placeholder && reg.placeholder.isConnected) {
    reg.placeholder.remove();
    reg.placeholder = null;
  }

  const iframe = document.createElement("iframe");
  iframe.className = "cm-widget-iframe";
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("referrerpolicy", "no-referrer");
  iframe.style.width = "100%";
  iframe.style.border = "none";
  iframe.style.height = `${reg.height || 180}px`;
  iframe.srcdoc = buildWidgetHtml(reg.source, reg.id);

  reg.iframe = iframe;
  reg.lastActiveTime = Date.now();
  reg.container.appendChild(iframe);
}

function unmountIframe(reg: RegisteredWidget) {
  if (!reg.iframe) return;
  reg.iframe.remove();
  reg.iframe = null;

  if (!reg.placeholder) {
    const ph = document.createElement("div");
    ph.className = "cm-widget-placeholder cm-widget-placeholder--offscreen";
    ph.style.height = `${reg.height || 180}px`;
    ph.innerHTML = `<span class="cm-widget-placeholder-text">Widget · Suspended</span>`;
    reg.placeholder = ph;
    reg.container.appendChild(ph);
  }
}

export function registerWidgetMount(
  container: HTMLElement,
  widgetId: string,
  source: string,
): () => void {
  ensureResizeListener();
  container.dataset.widgetId = widgetId;

  const reg: RegisteredWidget = {
    id: widgetId,
    container,
    source,
    iframe: null,
    placeholder: null,
    isVisible: false,
    lastActiveTime: Date.now(),
    height: 180,
  };
  widgetsMap.set(widgetId, reg);

  const observer = getOrCreateObserver();
  if (observer) {
    observer.observe(container);
  } else {
    mountIframe(reg);
  }

  return () => {
    if (observer) observer.unobserve(container);
    if (reg.iframe) reg.iframe.remove();
    if (reg.placeholder) reg.placeholder.remove();
    widgetsMap.delete(widgetId);
  };
}
