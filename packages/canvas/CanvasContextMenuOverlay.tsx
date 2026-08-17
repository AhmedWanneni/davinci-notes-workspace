import type { JSX } from "react";
import type { CanvasColor } from "./CanvasColor";
import { CanvasContextMenu } from "./CanvasContextMenu";
import type { CanvasContextMenuState } from "./useCanvasContextMenu";

export interface CanvasContextMenuOverlayProps {
  contextMenu: CanvasContextMenuState | null;
  onCreateTextCard: () => void;
  onCreateFileCard?: () => void;
  onCreateEmptyGroup: () => void;
  onCreateGroupFromSelection: () => void;
  onDeleteNode: (nodeId: string) => void;
  onConvertTextToFile?: () => void;
  onOpenFile?: () => void;
  onDeleteEdge?: () => void;
  onEditEdgeLabel?: () => void;
  onSelectEdgeColor?: (color?: CanvasColor) => void;
  onSelectNodeColor?: (color?: CanvasColor) => void;
  onClose: () => void;
}

export function CanvasContextMenuOverlay({
  contextMenu,
  ...props
}: CanvasContextMenuOverlayProps): JSX.Element | null {
  if (!contextMenu) return null;

  return <CanvasContextMenu menu={contextMenu} {...props} />;
}
