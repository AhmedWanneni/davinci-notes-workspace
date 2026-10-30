import { useState, useCallback, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  ArrowsVertical,
  Trash,
} from "@phosphor-icons/react";
import styles from "./NoteCoverImage.module.scss";

export interface NoteCoverImageProps {
  coverUrl: string;
  coverY?: number;
  resolveMediaUrl?: (url: string) => string;
  onChangeCover: () => void;
  onRemoveCover: () => void;
  onSavePosition: (newY: number) => void;
  children?: React.ReactNode;
}

export function NoteCoverImage({
  coverUrl,
  coverY = 50,
  resolveMediaUrl,
  onChangeCover,
  onRemoveCover,
  onSavePosition,
  children,
}: NoteCoverImageProps) {
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [currentY, setCurrentY] = useState(coverY);
  const isDraggingRef = useRef(false);
  const startDragYRef = useRef(0);
  const startPosYRef = useRef(coverY);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentY(coverY);
  }, [coverY]);

  const resolvedSrc = resolveMediaUrl ? resolveMediaUrl(coverUrl) : coverUrl;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startDragYRef.current = e.clientY;
    startPosYRef.current = currentY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [currentY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const height = containerRef.current.offsetHeight || 200;
    const deltaY = e.clientY - startDragYRef.current;
    // Dragging down moves focal point up (decreases Y percentage), dragging up increases
    const deltaPercent = (deltaY / height) * 100;
    const nextY = Math.min(100, Math.max(0, Math.round(startPosYRef.current - deltaPercent)));
    setCurrentY(nextY);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles["note-cover"]}
      role="banner"
      aria-label="Note cover image"
    >
      <img
        src={resolvedSrc}
        alt="Note cover"
        className={styles["note-cover-image"]}
        style={{ objectPosition: `center ${currentY}%` }}
        draggable={false}
      />

      {!isRepositioning && children}

      {isRepositioning ? (
        <>
          <div
            className={styles["note-cover-reposition-overlay"]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div className={styles["note-cover-reposition-bar"]}>
            <span className={styles["note-cover-reposition-hint"]}>
              Drag up or down to reposition ({currentY}%)
            </span>
            <button
              type="button"
              className={styles["note-cover-reposition-btn"]}
              data-variant="save"
              onClick={() => {
                onSavePosition(currentY);
                setIsRepositioning(false);
              }}
            >
              Save position
            </button>
            <button
              type="button"
              className={styles["note-cover-reposition-btn"]}
              data-variant="cancel"
              onClick={() => {
                setCurrentY(coverY);
                setIsRepositioning(false);
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className={styles["note-cover-actions"]}>
          <button
            type="button"
            className={styles["note-cover-action-button"]}
            onClick={onChangeCover}
            title="Change cover image"
          >
            <ImageIcon size={14} />
            <span>Change cover</span>
          </button>
          <button
            type="button"
            className={styles["note-cover-action-button"]}
            onClick={() => setIsRepositioning(true)}
            title="Reposition banner"
          >
            <ArrowsVertical size={14} />
            <span>Reposition</span>
          </button>
          <button
            type="button"
            className={styles["note-cover-action-button"]}
            onClick={onRemoveCover}
            title="Remove cover image"
          >
            <Trash size={14} />
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  );
}
