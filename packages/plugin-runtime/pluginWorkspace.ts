import type {
  PluginView,
  PluginViewContext,
  PluginWorkspace,
} from "@app/plugin-api";
import { pluginDom } from "./pluginDom.js";
import type { PluginPermission } from "@app/plugin-api";
import { requirePluginPermission } from "./permissionGuard.js";

interface RegisteredView extends PluginView {
  pluginId: string;
}

export class PluginWorkspaceHost {
  constructor(private readonly onChange: () => void = () => {}) {}
  private readonly views = new Map<string, RegisteredView>();
  private openViewId: string | null = null;
  private mountedCleanup: (() => void) | null = null;

  createApi(
    pluginId: string,
    permissions: readonly PluginPermission[],
  ): PluginWorkspace {
    return {
      registerView: (view) => {
        requirePluginPermission(
          pluginId,
          permissions,
          "workspace.registerView",
        );
        if (this.views.has(view.id))
          throw new Error(`View already registered: ${view.id}`);
        this.views.set(view.id, { ...view, pluginId });
        this.onChange();
        return () => this.unregisterView(view.id, pluginId);
      },
      openLeaf: (viewId) => {
        requirePluginPermission(pluginId, permissions, "workspace.openLeaf");
        if (!this.views.has(viewId)) throw new Error(`Unknown view: ${viewId}`);
        this.openViewId = viewId;
        this.onChange();
      },
      closeLeaf: () => {
        requirePluginPermission(pluginId, permissions, "workspace.closeLeaf");
        this.closeLeaf();
      },
      focusLeaf: () => {
        requirePluginPermission(pluginId, permissions, "workspace.focusLeaf");
        document.querySelector<HTMLElement>("[data-plugin-leaf]")?.focus();
      },
      isViewOpen: (viewId) => {
        requirePluginPermission(pluginId, permissions, "workspace.isViewOpen");
        return (
          this.openViewId !== null && (!viewId || viewId === this.openViewId)
        );
      },
    };
  }

  mount(container: HTMLElement): void {
    this.mountedCleanup?.();
    this.mountedCleanup = null;
    const view = this.openViewId ? this.views.get(this.openViewId) : undefined;
    if (!view) {
      container.replaceChildren();
      return;
    }
    const context: PluginViewContext = { container, dom: pluginDom };
    this.mountedCleanup = view.render(context) ?? null;
  }

  closeLeaf(): void {
    this.mountedCleanup?.();
    this.mountedCleanup = null;
    this.openViewId = null;
    this.onChange();
  }

  removePlugin(pluginId: string): void {
    for (const [id, view] of this.views) {
      if (view.pluginId !== pluginId) continue;
      if (this.openViewId === id) this.closeLeaf();
      this.views.delete(id);
    }
    this.onChange();
  }

  isMounted(): boolean {
    return this.mountedCleanup !== null;
  }

  getOpenViewId(): string | null {
    return this.openViewId;
  }

  private unregisterView(id: string, pluginId: string): void {
    if (this.views.get(id)?.pluginId !== pluginId) return;
    if (this.openViewId === id) this.closeLeaf();
    this.views.delete(id);
    this.onChange();
  }
}
