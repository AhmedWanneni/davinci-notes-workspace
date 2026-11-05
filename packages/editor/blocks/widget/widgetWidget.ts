import { WidgetType, EditorView } from "@codemirror/view";
import type { WidgetBlock, WidgetExtensionOptions } from "./widgetTypes";
import { registerWidgetMount } from "./widgetIframeManager";

export class WidgetBlockWidget extends WidgetType {
  private widgetId: string;
  private cleanup?: () => void;

  constructor(
    readonly block: WidgetBlock,
    readonly options?: WidgetExtensionOptions,
  ) {
    super();
    this.widgetId = `cm-w-${block.from}-${block.to}`;
  }

  eq(other: WidgetBlockWidget): boolean {
    return this.block.source === other.block.source;
  }

  updateDOM(_dom: HTMLElement): boolean {
    // Returning true tells CodeMirror to keep the existing DOM node across transactions
    return true;
  }

  toDOM(_view: EditorView): HTMLElement {
    const container = document.createElement("div");
    container.className = "cm-widget-block";
    this.cleanup = registerWidgetMount(
      container,
      this.widgetId,
      this.block.source,
    );
    return container;
  }

  destroy(_dom: HTMLElement): void {
    this.cleanup?.();
    this.cleanup = undefined;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
