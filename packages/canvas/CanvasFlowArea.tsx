import type { JSX, MouseEvent as ReactMouseEvent } from "react";
import type { Edge, Node, OnConnect, OnEdgesChange, OnNodeDrag, OnNodesChange, OnNodesDelete, OnReconnect } from "@xyflow/react";
import { CanvasReactFlow } from "./CanvasReactFlow";
import { CanvasEmptyState } from "./CanvasEmptyState";
import { CanvasBottomDock } from "./CanvasBottomDock";
import { CanvasNavToolbar } from "./CanvasNavToolbar";
import { CanvasContextMenuOverlay } from "./CanvasContextMenuOverlay";
import type { CanvasContextMenuState } from "./useCanvasContextMenu";
import type { CanvasColor } from "./CanvasColor";
import styles from "./CanvasView.module.scss";

export interface CanvasFlowAreaProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeDragStart?: OnNodeDrag;
  onNodeDrag?: OnNodeDrag;
  onNodeDragStop?: OnNodeDrag;
  onNodesDelete?: OnNodesDelete;
  onConnect?: OnConnect;
  onReconnect?: OnReconnect;
  onReconnectStart?: (e: ReactMouseEvent | MouseEvent, edge: Edge, handleType: "source" | "target") => void;
  onReconnectEnd?: (e: MouseEvent | TouchEvent, edge: Edge, handleType: "source" | "target") => void;
  onEdgeContextMenu?: (e: ReactMouseEvent | MouseEvent, edge: Edge) => void;
  onPaneClick?: (e: ReactMouseEvent | MouseEvent) => void;
  onPaneContextMenu?: (e: ReactMouseEvent | MouseEvent) => void;
  onNodeContextMenu?: (e: ReactMouseEvent | MouseEvent, node: Node) => void;
  isExporting?: boolean;
  allNotePaths: readonly string[];
  onCreateTextCard: () => void;
  onCreateFileCard: (filePath: string) => void;
  onPickMedia?: () => Promise<string | null>;
  onSaveMediaFile?: (fileName: string, data: Uint8Array) => Promise<string>;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  contextMenu: CanvasContextMenuState | null;
  handleContextCreateCard: () => void;
  handleContextCreateFileCard: () => void;
  handleContextCreateEmptyGroup: () => void;
  handleContextCreateGroupFromSelection: () => void;
  deleteNode: (id: string) => void;
  handleContextConvertTextToFile: () => void;
  handleContextOpenFile: () => void;
  handleContextDeleteEdge: () => void;
  handleContextEditEdgeLabel: () => void;
  handleContextSelectEdgeColor: (color?: CanvasColor) => void;
  handleContextSelectNodeColor: (color?: CanvasColor) => void;
  closeContextMenu: () => void;
}

export function CanvasFlowArea(props: CanvasFlowAreaProps): JSX.Element {
  return (
    <div className={styles["canvas-container"]}>
      <CanvasReactFlow
        nodes={props.nodes}
        edges={props.edges}
        onNodesChange={props.onNodesChange}
        onEdgesChange={props.onEdgesChange}
        onNodeDragStart={props.onNodeDragStart}
        onNodeDrag={props.onNodeDrag}
        onNodeDragStop={props.onNodeDragStop}
        onNodesDelete={props.onNodesDelete}
        onConnect={props.onConnect}
        onReconnect={props.onReconnect}
        onReconnectStart={props.onReconnectStart}
        onReconnectEnd={props.onReconnectEnd}
        onEdgeContextMenu={props.onEdgeContextMenu}
        onPaneClick={props.onPaneClick}
        onPaneContextMenu={props.onPaneContextMenu}
        onNodeContextMenu={props.onNodeContextMenu}
      />

      {props.nodes.length === 0 && <CanvasEmptyState />}

      {props.isExporting && (
        <div className={styles["canvas-export-overlay"]} data-testid="export-overlay">
          <div className={styles["canvas-export-overlay__content"]}>
            <span>Exporting Canvas...</span>
          </div>
        </div>
      )}

      <CanvasBottomDock
        allNotePaths={props.allNotePaths}
        onCreateTextCard={props.onCreateTextCard}
        onCreateFileCard={props.onCreateFileCard}
        onPickMedia={props.onPickMedia}
        onSaveMediaFile={props.onSaveMediaFile}
      />

      <CanvasNavToolbar
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
      />

      <CanvasContextMenuOverlay
        contextMenu={props.contextMenu}
        onCreateTextCard={props.handleContextCreateCard}
        onCreateFileCard={props.handleContextCreateFileCard}
        onCreateEmptyGroup={props.handleContextCreateEmptyGroup}
        onCreateGroupFromSelection={props.handleContextCreateGroupFromSelection}
        onDeleteNode={props.deleteNode}
        onConvertTextToFile={props.handleContextConvertTextToFile}
        onOpenFile={props.handleContextOpenFile}
        onDeleteEdge={props.handleContextDeleteEdge}
        onEditEdgeLabel={props.handleContextEditEdgeLabel}
        onSelectEdgeColor={props.handleContextSelectEdgeColor}
        onSelectNodeColor={props.handleContextSelectNodeColor}
        onClose={props.closeContextMenu}
      />
    </div>
  );
}
