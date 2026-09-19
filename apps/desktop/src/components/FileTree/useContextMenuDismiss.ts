import { type RefObject, useEffect, useRef } from "react";

interface UseContextMenuDismissOptions {
  menuRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function useContextMenuDismiss({
  menuRef,
  onClose,
}: UseContextMenuDismissOptions) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;

    const firstButton = menuRef.current?.querySelector<HTMLButtonElement>(
      "button.file-tree__context-menu-item",
    );
    firstButton?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (!menuRef.current) return;

      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLButtonElement>(
          "button.file-tree__context-menu-item",
        ),
      );
      if (items.length === 0) return;

      const currentIndex = items.findIndex(
        (el) => el === document.activeElement,
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex =
          currentIndex === -1 || currentIndex === items.length - 1
            ? 0
            : currentIndex + 1;
        items[nextIndex]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevIndex =
          currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    const handleBlur = () => onClose();
    const handleScroll = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      previousActiveElementRef.current?.focus?.();
    };
  }, [menuRef, onClose]);
}
