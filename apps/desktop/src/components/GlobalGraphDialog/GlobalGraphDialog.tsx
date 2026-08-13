import { Dialog, DialogContent } from "@app/design-system";
import { GraphIndex } from "@app/indexer";
import { GraphView } from "../GraphView";

interface GlobalGraphDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  graph: GraphIndex | null;
  onNavigate: (path: string) => void;
}

export function GlobalGraphDialog({
  isOpen,
  onOpenChange,
  graph,
  onNavigate,
}: GlobalGraphDialogProps) {
  if (!graph) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="global-graph-dialog"
        showCloseButton={false}
        title="Global Graph View"
      >
        <div className="global-graph-dialog__graph-wrapper">
          <GraphView
            graph={graph}
            defaultMode="global"
            onNavigate={(path) => {
              onNavigate(path);
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
