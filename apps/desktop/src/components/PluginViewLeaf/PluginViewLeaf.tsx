import { useEffect, useRef } from "react";
import type { PluginLifecycleManager } from "@app/plugin-runtime";

interface PluginViewLeafProps {
  manager: PluginLifecycleManager;
  viewId: string;
}

export function PluginViewLeaf({ manager, viewId }: PluginViewLeafProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || manager.getOpenPluginViewId() !== viewId)
      return;
    containerRef.current.dataset.pluginLeaf = viewId;
    manager.mountPluginView(containerRef.current);
    return () => {
      manager.closePluginView();
      delete containerRef.current?.dataset.pluginLeaf;
    };
  }, [manager, viewId]);

  return <div ref={containerRef} tabIndex={-1} aria-label={viewId} />;
}
