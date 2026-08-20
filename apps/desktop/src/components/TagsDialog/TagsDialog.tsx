import React, { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CaretDown, CaretRight, Hash } from "@phosphor-icons/react";
import type { TagIndex } from "@app/indexer";
import { getCanonicalTag } from "@app/indexer";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

interface TagNode {
  key: string;
  display: string;
  count: number;
  children: TagNode[];
}

export interface TagsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTag: (tagKey: string) => void;
}

function buildTagTree(index: TagIndex | null): TagNode[] {
  if (!index) return [];
  const nodes = new Map<string, TagNode>();
  const ensure = (key: string): TagNode => {
    const existing = nodes.get(key);
    if (existing) return existing;
    const canonical = getCanonicalTag(index, key);
    const node: TagNode = {
      key,
      display: canonical?.display ?? `#${key}`,
      count: index.tagToNotes.get(key)?.size ?? 0,
      children: [],
    };
    nodes.set(key, node);
    const slash = key.lastIndexOf("/");
    if (slash > 0) {
      const parent = ensure(key.slice(0, slash));
      if (!parent.children.includes(node)) parent.children.push(node);
    }
    return node;
  };

  for (const key of index.tagToNotes.keys()) ensure(key);
  const roots = [...nodes.values()].filter((node) => !node.key.includes("/"));
  const sort = (items: TagNode[]) => {
    items.sort((left, right) => left.display.localeCompare(right.display));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
}

function TagTreeNode({
  node,
  depth,
  onSelect,
}: {
  node: TagNode;
  depth: number;
  onSelect: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <div className="tags-dialog__row" style={{ paddingLeft: `${12 + depth * 20}px` }}>
        <button
          type="button"
          className="tags-dialog__expand"
          aria-label={expanded ? `Collapse ${node.display}` : `Expand ${node.display}`}
          onClick={() => hasChildren && setExpanded((value) => !value)}
        >
          {hasChildren ? (expanded ? <CaretDown size={14} /> : <CaretRight size={14} />) : null}
        </button>
        <button type="button" className="tags-dialog__tag" onClick={() => onSelect(node.key)}>
          <Hash size={15} />
          <span>{node.display.slice(1)}</span>
        </button>
        <span className="tags-dialog__count">{node.count}</span>
      </div>
      {expanded && hasChildren && (
        <ul className="tags-dialog__children">
          {node.children.map((child) => (
            <TagTreeNode key={child.key} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TagsDialog({ isOpen, onOpenChange, onSelectTag }: TagsDialogProps) {
  const tagIndex = useWorkspaceStore((state) => state.tagIndex);
  const vaultUpdateCounter = useWorkspaceStore((state) => state.vaultUpdateCounter);
  const tree = useMemo(() => buildTagTree(tagIndex), [tagIndex, vaultUpdateCounter]);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="tags-dialog__overlay" />
        <DialogPrimitive.Content className="tags-dialog__dialog">
          <DialogPrimitive.Title className="tags-dialog__title">Tags</DialogPrimitive.Title>
          {tree.length ? (
            <ul className="tags-dialog__tree">{tree.map((node) => <TagTreeNode key={node.key} node={node} depth={0} onSelect={onSelectTag} />)}</ul>
          ) : <p className="tags-dialog__empty">No tags in this vault.</p>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
