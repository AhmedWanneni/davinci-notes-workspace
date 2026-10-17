import { EditorView } from "@codemirror/view";

/**
 * iOS WebKit Focus Workaround.
 *
 * Problem:
 * On iOS WKWebView / Safari, programmatic `element.focus()` calls that occur
 * asynchronously (e.g. after React navigation, setTimeout, or asynchronous note
 * loading) are silently dropped by WebKit because there is no active user
 * gesture in the current JavaScript call stack.
 *
 * Solutions implemented here:
 * 1. Synchronous gesture forwarding: if called during a native button tap or
 *    touch event, focus is synchronously applied to `view.contentDOM`.
 * 2. Gesture-priming overlay: if programmatic focus fails (e.g. on route change),
 *    a lightweight transparent tap target intercepts the first touch and
 *    synchronously focuses the editor without requiring a second tap.
 * 3. Fallback cursor positioning: places selection at end of document or line 1.
 */

export interface FocusOptions {
  position?: "start" | "end";
  preventScroll?: boolean;
}

export function requestEditorFocus(
  view: EditorView,
  options: FocusOptions = {},
): boolean {
  try {
    const { position = "end", preventScroll = false } = options;
    const targetPos =
      position === "start" ? 0 : view.state.doc.length;

    view.dispatch({
      selection: { anchor: targetPos, head: targetPos },
      scrollIntoView: !preventScroll,
    });

    view.focus();

    // Check if WebKit actually accepted focus
    const isFocused =
      typeof document !== "undefined" &&
      document.activeElement === view.contentDOM;

    return isFocused;
  } catch {
    return false;
  }
}

/**
 * Attaches a one-time gesture priming overlay for iOS WebViews.
 * When programmatic focus fails after opening a new note, this overlay captures
 * the user's initial screen tap and synchronously focuses the editor.
 */
export function createIosFocusPrimingOverlay(
  container: HTMLElement,
  viewGetter: () => EditorView | null,
  onFocused?: () => void,
): () => void {
  const overlay = document.createElement("div");
  overlay.className = "ios-focus-priming-overlay";
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.bottom = "0";
  overlay.style.zIndex = "10";
  overlay.style.background = "transparent";

  const handleTouch = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const view = viewGetter();
    if (view) {
      view.focus();
      const pos = view.state.doc.length;
      view.dispatch({
        selection: { anchor: pos, head: pos },
        scrollIntoView: true,
      });
      onFocused?.();
    }

    overlay.remove();
  };

  overlay.addEventListener("touchend", handleTouch, { once: true, passive: false });
  overlay.addEventListener("click", handleTouch, { once: true });

  container.style.position = "relative";
  container.appendChild(overlay);

  return () => {
    overlay.remove();
  };
}
