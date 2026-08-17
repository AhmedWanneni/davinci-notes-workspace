import { useCallback, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { toPng } from "html-to-image";

export interface UseCanvasExportOptions {
  onExport?: (dataUrl: string) => void;
}

export function useCanvasExport({ onExport }: UseCanvasExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const { getNodes, fitView, getViewport, setViewport } = useReactFlow();

  const exportViewport = useCallback(async () => {
    const viewportElement = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!viewportElement) return;

    setIsExporting(true);
    try {
      // Ensure all elements are rendered for export if virtualization is on
      // However, Phase 12 constraints say "Reuse what's already on screen"
      // and "onlyRenderVisibleElements" is true in CanvasReactFlow.
      // For viewport export, this is fine as they ARE visible.
      
      const dataUrl = await toPng(viewportElement, {
        backgroundColor: "var(--color-bg-primary)",
        // Filtering out controls or other overlays if needed
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return !node.classList.contains("react-flow__controls") && 
                   !node.classList.contains("canvas-controls") &&
                   !node.classList.contains("react-flow__attribution");
          }
          return true;
        }
      });
      
      onExport?.(dataUrl);
    } catch (error) {
      console.error("Failed to export viewport:", error);
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);

  const exportFullCanvas = useCallback(async () => {
    const nodes = getNodes();
    if (nodes.length === 0) return;

    setIsExporting(true);
    const originalViewport = getViewport();
    
    try {
      // 1. Calculate bounding box of all content
      // React Flow's fitView handles this, but we want to ensure everything is rendered.
      // If onlyRenderVisibleElements={true}, we MUST fitView first so they become "visible".
      
      await fitView({ padding: 0.1, duration: 0 });
      
      // Give it a frame to ensure all nodes are mounted/rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const viewportElement = document.querySelector(".react-flow__viewport") as HTMLElement;
      if (viewportElement) {
        const dataUrl = await toPng(viewportElement, {
          backgroundColor: "var(--color-bg-primary)",
          filter: (node) => {
            if (node instanceof HTMLElement) {
              return !node.classList.contains("react-flow__controls") && 
                     !node.classList.contains("canvas-controls") &&
                     !node.classList.contains("react-flow__attribution");
            }
            return true;
          }
        });
        onExport?.(dataUrl);
      }
    } catch (error) {
      console.error("Failed to export full canvas:", error);
    } finally {
      // Restore original viewport
      setViewport(originalViewport);
      setIsExporting(false);
    }
  }, [fitView, getNodes, getViewport, onExport, setViewport]);

  return {
    isExporting,
    exportViewport,
    exportFullCanvas,
  };
}
