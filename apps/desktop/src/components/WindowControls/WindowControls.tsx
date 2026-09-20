import { Minus, Square, X } from "@phosphor-icons/react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface WindowControlsProps {
  variant?: "default" | "mac";
}

export function WindowControls({ variant = "default" }: WindowControlsProps) {
  return (
    <div
      className={`window-controls window-controls--${variant}`}
      aria-label="Window controls"
    >
      <button
        type="button"
        className="window-controls__button"
        onClick={() => void getCurrentWindow().minimize()}
        aria-label="Minimize window"
      >
        <Minus size={14} weight="bold" />
      </button>
      <button
        type="button"
        className="window-controls__button"
        onClick={() => void getCurrentWindow().toggleMaximize()}
        aria-label="Maximize or restore window"
      >
        <Square size={12} weight="regular" />
      </button>
      <button
        type="button"
        className="window-controls__button window-controls__button--close"
        onClick={() => void getCurrentWindow().close()}
        aria-label="Close window"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}
