import { Minus, Square, X } from "@phosphor-icons/react";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

interface WindowControlsProps {
  variant?: "default" | "mac";
}

export function WindowControls({ variant = "default" }: WindowControlsProps) {
  const handleClose = () => {
    if (hasPlatformAdapters()) {
      void getPlatformAdapters().windowControls.close();
    }
  };

  const handleMinimize = () => {
    if (hasPlatformAdapters()) {
      void getPlatformAdapters().windowControls.minimize();
    }
  };

  const handleMaximize = () => {
    if (hasPlatformAdapters()) {
      void getPlatformAdapters().windowControls.maximize();
    }
  };

  return (
    <div
      className={`window-controls window-controls--${variant}`}
      aria-label="Window controls"
    >
      <button
        type="button"
        className="window-controls__button window-controls__button--close"
        onClick={handleClose}
        aria-label="Close window"
      >
        <X size={14} weight="bold" />
      </button>
      <button
        type="button"
        className="window-controls__button"
        onClick={handleMinimize}
        aria-label="Minimize window"
      >
        <Minus size={14} weight="bold" />
      </button>
      <button
        type="button"
        className="window-controls__button"
        onClick={handleMaximize}
        aria-label="Maximize or restore window"
      >
        <Square size={12} weight="regular" />
      </button>
    </div>
  );
}
