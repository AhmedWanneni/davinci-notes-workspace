import {
  isPluginViewModel,
  type PluginViewModel,
} from "@app/plugin-api";

export interface RegisteredPluginView {
  id: string;
  name: string;
  pluginId: string;
  model: PluginViewModel;
}

interface RunnerViewSnapshot {
  id: string;
  name: string;
  model: unknown;
  open?: boolean;
}

export class PluginViewRegistry {
  private readonly views = new Map<string, RegisteredPluginView>();
  private openViewId: string | null = null;

  replacePluginViews(pluginId: string, result: unknown): void {
    const snapshots = (result as { views?: unknown })?.views;
    if (!Array.isArray(snapshots)) return;
    if (!(snapshots as RunnerViewSnapshot[]).every((snapshot) => this.isSnapshot(snapshot))) {
      throw new Error(`Plugin ${pluginId} returned an invalid declarative view model`);
    }
    this.removePlugin(pluginId);
    for (const snapshot of snapshots as Array<RunnerViewSnapshot & { model: PluginViewModel }>) {
      this.views.set(snapshot.id, { ...snapshot, pluginId });
      if (snapshot.open) this.openViewId = snapshot.id;
    }
  }

  update(pluginId: string, viewId: string, model: unknown): void {
    const view = this.views.get(viewId);
    if (!view || view.pluginId !== pluginId || !isPluginViewModel(model)) {
      throw new Error(`Invalid view update for ${viewId}`);
    }
    view.model = model;
  }

  get(viewId: string): RegisteredPluginView | undefined { return this.views.get(viewId); }
  getOpenViewId(): string | null { return this.openViewId; }

  close(): void { this.openViewId = null; }

  removePlugin(pluginId: string): void {
    for (const [id, view] of this.views) {
      if (view.pluginId !== pluginId) continue;
      this.views.delete(id);
      if (this.openViewId === id) this.openViewId = null;
    }
  }

  private isSnapshot(snapshot: RunnerViewSnapshot): snapshot is RunnerViewSnapshot & { model: PluginViewModel } {
    return typeof snapshot?.id === "string" && typeof snapshot.name === "string" && isPluginViewModel(snapshot.model);
  }
}
