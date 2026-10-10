import type { PluginLifecycleManager } from "@app/plugin-runtime";
import { PluginViewModelRenderer } from "./PluginViewModelRenderer";

interface PluginViewLeafProps {
  manager: PluginLifecycleManager;
  viewId: string;
  revision: number;
}

export function PluginViewLeaf({ manager, viewId, revision: _revision }: PluginViewLeafProps) {
  const view = manager.getPluginView(viewId);
  if (!view) return null;

  return <section data-plugin-view-host={viewId} tabIndex={-1} aria-label={view.name}>
    <PluginViewModelRenderer model={view.model} onEvent={(event) => void manager.dispatchPluginViewEvent(viewId, event)} />
  </section>;
}
