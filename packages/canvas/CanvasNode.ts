import type { CanvasColor } from "./CanvasColor";

export type CanvasNodeType = "text" | "file" | "link" | "group";

export type CanvasBackgroundStyle = "cover" | "ratio" | "repeat";

export interface CanvasNodeBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: CanvasColor;
}

export interface CanvasTextNode extends CanvasNodeBase {
  type: "text";
  text: string;
}

export interface CanvasFileNode extends CanvasNodeBase {
  type: "file";
  file: string;
  subpath?: string;
}

export interface CanvasLinkNode extends CanvasNodeBase {
  type: "link";
  url: string;
}

export interface CanvasGroupNode extends CanvasNodeBase {
  type: "group";
  label?: string;
  background?: string;
  backgroundStyle?: CanvasBackgroundStyle;
}

export type CanvasNode =
  CanvasTextNode | CanvasFileNode | CanvasLinkNode | CanvasGroupNode;
