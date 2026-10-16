import { EditorView } from "@codemirror/view";

/**
 * Handles virtual keyboard display and resize on mobile webviews.
 *
 * In mobile webviews (iOS WKWebView and Android WebView), the software keyboard
 * reduces `window.visualViewport.height`. If not accounted for, the editor
 * cursor on the lower half of the note becomes occluded beneath the keyboard.
 */

export interface ViewportHandlerOptions {
  container: HTMLElement;
  getView: () => EditorView | null;
  paddingBottomPx?: number;
}

export function attachMobileViewportHandler(
  options: ViewportHandlerOptions,
): () => void {
  const { container, getView, paddingBottomPx = 16 } = options;

  const updateViewport = () => {
    const vv = window.visualViewport;
    if (!vv) return;

    // Constrain container to active visual height
    const visibleHeight = Math.round(vv.height);
    container.style.height = `${visibleHeight}px`;
    container.style.maxHeight = `${visibleHeight}px`;

    // Ensure the cursor line stays visible within the reduced viewport
    const view = getView();
    if (view && view.hasFocus) {
      const head = view.state.selection.main.head;
      view.dispatch({
        effects: EditorView.scrollIntoView(head, {
          y: "nearest",
          yMargin: paddingBottomPx,
        }),
      });
    }
  };

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", updateViewport);
    vv.addEventListener("scroll", updateViewport);
  } else {
    window.addEventListener("resize", updateViewport);
  }

  // Initial calculation
  updateViewport();

  return () => {
    if (vv) {
      vv.removeEventListener("resize", updateViewport);
      vv.removeEventListener("scroll", updateViewport);
    } else {
      window.removeEventListener("resize", updateViewport);
    }
  };
}
