export interface DragPreviewData {
  name: string;
  type: "file" | "folder";
  path?: string;
  count?: number;
}

const PREVIEW_ID = "file-tree-drag-preview";

const FOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z"></path></svg>';

const FILE_TEXT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z"></path></svg>';

const FRAME_CORNERS_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M200,80v32a8,8,0,0,1-16,0V88H160a8,8,0,0,1,0-16h32A8,8,0,0,1,200,80ZM96,168H72V144a8,8,0,0,0-16,0v32a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16ZM232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Z"></path></svg>';

const IMAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z"></path></svg>';

const VIDEO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M164.44,105.34l-48-32A8,8,0,0,0,104,80v64a8,8,0,0,0,12.44,6.66l48-32a8,8,0,0,0,0-13.32ZM120,129.05V95l25.58,17ZM216,40H40A16,16,0,0,0,24,56V168a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,128H40V56H216V168Zm16,40a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16H224A8,8,0,0,1,232,208Z"></path></svg>';

export function getPreviewIconSvg(
  name: string,
  type: "file" | "folder",
): string {
  if (type === "folder") {
    return FOLDER_SVG;
  }
  if (name.endsWith(".canvas")) {
    return FRAME_CORNERS_SVG;
  }
  if (/\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i.test(name)) {
    return IMAGE_SVG;
  }
  if (/\.(mp4|webm|og[gv]|mov|mkv|m4v)$/i.test(name)) {
    return VIDEO_SVG;
  }
  return FILE_TEXT_SVG;
}

export function getOrCreateDragPreviewElement(): HTMLElement {
  let previewEl = document.getElementById(PREVIEW_ID);
  if (!previewEl) {
    previewEl = document.createElement("div");
    previewEl.id = PREVIEW_ID;
    previewEl.className = "file-tree-drag-preview";
    previewEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(previewEl);
  }
  return previewEl;
}

export function updateDragPreview(data: DragPreviewData): HTMLElement {
  const previewEl = getOrCreateDragPreviewElement();
  const iconSvg = getPreviewIconSvg(data.name, data.type);
  const displayName = data.name.replace(/\.(md|canvas)$/i, "");

  const badgeHtml =
    data.count && data.count > 1
      ? `<span class="file-tree-drag-preview__badge">${data.count}</span>`
      : "";

  previewEl.innerHTML = `
    <span class="file-tree-drag-preview__icon">${iconSvg}</span>
    <span class="file-tree-drag-preview__name">${displayName}</span>
    ${badgeHtml}
  `.trim();

  previewEl.removeAttribute("data-visible");
  previewEl.setAttribute("data-type", data.type);
  if (data.path) {
    previewEl.setAttribute("data-path", data.path);
  }

  // Clear or hide visibility on next tick after browser captures snapshot
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      previewEl.setAttribute("data-visible", "false");
    });
  } else {
    previewEl.setAttribute("data-visible", "false");
  }

  return previewEl;
}

export const fileTreeDragPreview = {
  getOrCreateDragPreviewElement,
  updateDragPreview,
  getPreviewIconSvg,
};
