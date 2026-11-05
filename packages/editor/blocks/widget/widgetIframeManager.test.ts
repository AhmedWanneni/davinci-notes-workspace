// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  registerWidgetMount,
  MAX_ACTIVE_WIDGET_IFRAMES,
} from "./widgetIframeManager";

describe("widgetIframeManager", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("mounts a sandboxed iframe with strict permissions and no-referrer", () => {
    const unregister = registerWidgetMount(
      container,
      "test-widget-1",
      "<div>Hello Widget</div>",
    );

    const iframe = container.querySelector<HTMLIFrameElement>("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("sandbox")).toBe("allow-scripts");
    expect(iframe?.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(iframe?.srcdoc).toContain("Hello Widget");
    expect(iframe?.srcdoc).toContain("Content-Security-Policy");

    unregister();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("adjusts height safely on postMessage within min and max boundaries", () => {
    const unregister = registerWidgetMount(
      container,
      "test-widget-resize",
      "<div>Height test</div>",
    );

    const iframe = container.querySelector<HTMLIFrameElement>("iframe");
    expect(iframe).not.toBeNull();

    // Simulate postMessage resize from iframe
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "davinci:widget-resize",
          widgetId: "test-widget-resize",
          height: 340,
        },
      }),
    );

    expect(iframe?.style.height).toBe("340px");

    // Clamps excessive height to DEFAULT_WIDGET_MAX_HEIGHT (500)
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "davinci:widget-resize",
          widgetId: "test-widget-resize",
          height: 2500,
        },
      }),
    );

    expect(iframe?.style.height).toBe("500px");
    unregister();
  });

  it("caps maximum live iframes to prevent memory exhaustion", () => {
    expect(MAX_ACTIVE_WIDGET_IFRAMES).toBe(6);
    const cleanups: Array<() => void> = [];

    // Mount 8 widgets
    for (let i = 0; i < 8; i++) {
      const c = document.createElement("div");
      document.body.appendChild(c);
      const clean = registerWidgetMount(
        c,
        `cap-widget-${i}`,
        `<div>Widget ${i}</div>`,
      );
      cleanups.push(() => {
        clean();
        c.remove();
      });
    }

    const iframes = document.querySelectorAll("iframe.cm-widget-iframe");
    // Maximum active iframes cannot exceed MAX_ACTIVE_WIDGET_IFRAMES (6)
    expect(iframes.length).toBeLessThanOrEqual(MAX_ACTIVE_WIDGET_IFRAMES);

    cleanups.forEach((fn) => fn());
  });
});
