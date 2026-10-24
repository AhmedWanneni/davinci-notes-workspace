/**
 * The page is read by injecting this function with `browser.scripting.executeScript`.
 *
 * Chrome serialises a `func` argument, so it must be completely self-contained:
 * no imports, no closure over module state. It returns only serialisable data.
 *
 * `activeTab` + `scripting` are the only permissions needed to call it
 * (plan §5: minimal permissions, no host permissions for browsing).
 */
export interface PageCapture {
  url: string;
  title: string;
  html: string;
  selection?: string;
  selectionHtml?: string;
}

export function readPage(): PageCapture {
  const selection = window.getSelection();
  let selectionText: string | undefined;
  let selectionHtml: string | undefined;

  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const text = selection.toString().trim();
    if (text.length > 0) {
      selectionText = text;
      const container = document.createElement("div");
      for (let index = 0; index < selection.rangeCount; index += 1) {
        container.append(selection.getRangeAt(index).cloneContents());
      }
      selectionHtml = container.innerHTML;
    }
  }

  const capture: PageCapture = {
    url: location.href,
    title: document.title,
    html: document.documentElement.outerHTML,
  };
  if (selectionText !== undefined) capture.selection = selectionText;
  if (selectionHtml !== undefined) capture.selectionHtml = selectionHtml;
  return capture;
}
