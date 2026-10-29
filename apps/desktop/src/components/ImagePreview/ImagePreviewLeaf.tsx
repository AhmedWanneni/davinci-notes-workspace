import React, { useState, useEffect, useCallback } from "react";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";
import { statNote } from "../../vault/vaultCommands";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { ImagePreviewToolbar } from "./ImagePreviewToolbar";
import { ImagePreviewInfoBar } from "./ImagePreviewInfoBar";
import styles from "./ImagePreview.module.scss";

export interface ImagePreviewLeafProps {
  path: string;
  onClose?: () => void;
}

export function ImagePreviewLeaf({ path, onClose }: ImagePreviewLeafProps) {
  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const [zoom, setZoom] = useState(1.0);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width?: number;
    height?: number;
  }>({});
  const [fileSizeBytes, setFileSizeBytes] = useState<number | undefined>(
    undefined,
  );

  // Query file stats (size)
  useEffect(() => {
    let active = true;
    void statNote(path)
      .then((stat) => {
        if (active && stat && typeof stat.size === "number") {
          setFileSizeBytes(stat.size);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [path]);

  // Resolve media URL
  const resolveUrl = useCallback(() => {
    if (!path) return "";
    const isAbsolute = path.startsWith("/") || /^[a-zA-Z]:[/\\]/.test(path);
    const absolutePath = isAbsolute
      ? path
      : vaultPath
        ? `${vaultPath.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
        : path;

    try {
      if (hasPlatformAdapters()) {
        return getPlatformAdapters().fs.resolveFileUrl(absolutePath);
      }
      return path;
    } catch {
      return path;
    }
  }, [path, vaultPath]);

  const imageUrl = resolveUrl();

  const handleZoomIn = () =>
    setZoom((z) => Math.min(5.0, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () =>
    setZoom((z) => Math.max(0.2, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => setZoom(1.0);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((z) =>
        Math.max(0.2, Math.min(5.0, Number((z + delta).toFixed(2)))),
      );
    }
  };

  const fileName = path.split("/").pop() ?? path;

  return (
    <div className={styles["image-preview-leaf"]} onWheel={handleWheel}>
      <ImagePreviewToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onClose={onClose}
      />

      <div className={styles["viewport"]}>
        <div
          className={styles["canvas"]}
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={imageUrl}
            alt={fileName}
            className={styles["image"]}
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            }}
          />
        </div>
      </div>

      <ImagePreviewInfoBar
        fileName={fileName}
        naturalWidth={naturalDimensions.width}
        naturalHeight={naturalDimensions.height}
        fileSizeBytes={fileSizeBytes}
      />
    </div>
  );
}
