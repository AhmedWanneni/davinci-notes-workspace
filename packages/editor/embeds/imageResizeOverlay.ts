export interface ImageResizeOverlayOptions {
  container: HTMLElement;
  image: HTMLImageElement;
  currentWidth?: number;
  currentHeight?: number;
  isReadOnly?: boolean;
  onCommitWidth: (width: number | undefined) => void;
}

const MIN_IMAGE_WIDTH = 80;

function createPresetButton(
  label: string,
  onClick: (e: MouseEvent) => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cm-image-toolbar-btn";
  btn.textContent = label;
  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  });
  return btn;
}

export function attachImageResizeOverlay(
  options: ImageResizeOverlayOptions,
): void {
  const { container, image, isReadOnly, onCommitWidth } = options;

  container.classList.add("cm-image-resizable-wrapper");

  if (isReadOnly) {
    return;
  }

  // Live badge
  const badge = document.createElement("div");
  badge.className = "cm-image-resize-badge";
  badge.setAttribute("aria-hidden", "true");
  container.appendChild(badge);

  // Quick Preset Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "cm-image-toolbar";
  toolbar.setAttribute("role", "toolbar");

  const getContainerMaxWidth = (): number => {
    const parent = container.parentElement ?? container;
    const maxWidth = parent.clientWidth || 800;
    return Math.max(MIN_IMAGE_WIDTH, maxWidth);
  };

  const presets = [
    { label: "25%", ratio: 0.25 },
    { label: "50%", ratio: 0.5 },
    { label: "75%", ratio: 0.75 },
    { label: "100%", ratio: 1.0 },
  ];

  for (const preset of presets) {
    const btn = createPresetButton(preset.label, () => {
      const parentWidth = getContainerMaxWidth();
      const targetWidth = Math.round(parentWidth * preset.ratio);
      onCommitWidth(targetWidth);
    });
    toolbar.appendChild(btn);
  }

  const resetBtn = createPresetButton("Reset", () => {
    onCommitWidth(undefined);
  });
  toolbar.appendChild(resetBtn);
  container.appendChild(toolbar);

  // Resize Drag Handles (Right border & Bottom-Right Corner)
  const handleRight = document.createElement("div");
  handleRight.className = "cm-image-resize-handle cm-image-resize-handle-right";
  handleRight.title = "Drag to resize width";

  const handleCorner = document.createElement("div");
  handleCorner.className =
    "cm-image-resize-handle cm-image-resize-handle-corner";
  handleCorner.title = "Drag to resize";

  const setupDrag = (handle: HTMLElement) => {
    handle.addEventListener("mousedown", (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const initialRect = image.getBoundingClientRect();
      const startWidth = initialRect.width || image.offsetWidth || 300;
      const maxWidth = getContainerMaxWidth();

      let lastComputedWidth = startWidth;
      container.classList.add("is-resizing");
      badge.style.display = "block";
      badge.textContent = `${Math.round(startWidth)} px`;

      const onMouseMove = (moveEvt: MouseEvent) => {
        const deltaX = moveEvt.clientX - startX;
        lastComputedWidth = Math.max(
          MIN_IMAGE_WIDTH,
          Math.min(maxWidth, Math.round(startWidth + deltaX)),
        );
        image.style.width = `${lastComputedWidth}px`;
        image.style.height = "auto";
        badge.textContent = `${lastComputedWidth} px`;
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        container.classList.remove("is-resizing");
        badge.style.display = "";

        if (Math.abs(lastComputedWidth - startWidth) >= 2) {
          onCommitWidth(lastComputedWidth);
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  };

  setupDrag(handleRight);
  setupDrag(handleCorner);

  container.appendChild(handleRight);
  container.appendChild(handleCorner);
}
