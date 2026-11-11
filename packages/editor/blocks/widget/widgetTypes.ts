export interface WidgetBlock {
  from: number;
  to: number;
  source: string;
  lineFrom: number;
  lineTo: number;
}

export interface WidgetExtensionOptions {
  isReadOnly?: boolean;
  maxLiveIframes?: number;
  maxHeight?: number;
}

export interface WidgetResizePayload {
  type: "davinci:widget-resize";
  widgetId: string;
  height: number;
}
