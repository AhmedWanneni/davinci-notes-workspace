import { useEffect, useMemo, useRef, useState } from "react";
import type { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Popover, PopoverAnchor, PopoverContent } from "@app/design-system";
import {
  insertItem,
  loadInsertRegistry,
  useRecentInsertIds,
  recordRecentInsert,
  type InsertItem,
} from "@app/editor";

interface InsertMenuProps {
  anchor: DOMRect;
  selection: EditorSelection;
  view: EditorView;
  onClose: () => void;
}

export function InsertMenu({ anchor, selection, view, onClose }: InsertMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<readonly InsertItem[]>([]);
  const [query, setQuery] = useState("");
  const recentIds = useRecentInsertIds();
  const [active, setActive] = useState(0);

  useEffect(() => {
    void loadInsertRegistry().then(({ insertRegistry }) => setItems(insertRegistry));
    inputRef.current?.focus();
  }, []);

  const recent = useMemo(() => {
    return recentIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is InsertItem => Boolean(item));
  }, [items, recentIds]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? items.filter((item) =>
          [item.label, ...item.keywords].some((value) => value.toLowerCase().includes(normalized)),
        )
      : items;
  }, [items, query]);

  const choose = (item: InsertItem) => {
    if (insertItem(view, item, selection)) {
      recordRecentInsert(item.id);
    }
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(0, Math.min(visible.length - 1, current + (event.key === "ArrowDown" ? 1 : -1))));
    } else if (event.key === "Enter" && visible[active]) {
      event.preventDefault();
      choose(visible[active]);
    }
  };

  const grouped = ["Basics", "Code and data", "HTML"].map((group) => [
    group,
    visible.filter((item) => item.group === group),
  ] as const);

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor asChild>
        <span className="insert-menu__anchor" style={{ left: anchor.left, top: anchor.bottom }} />
      </PopoverAnchor>
      <PopoverContent className="insert-menu" align="end" onOpenAutoFocus={(event) => event.preventDefault()}>
        <input ref={inputRef} className="insert-menu__search" value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={onKeyDown} placeholder="Search insert options" aria-label="Search insert options" />
        {!query && recent.length > 0 && <InsertGroup label="Recently used" items={recent} active={active} visible={visible} onChoose={choose} />}
        {grouped.map(([label, groupItems]) => groupItems.length > 0 && <InsertGroup key={label} label={label} items={groupItems} active={active} visible={visible} onChoose={choose} />)}
      </PopoverContent>
    </Popover>
  );
}

function InsertGroup({ label, items, active, visible, onChoose }: { label: string; items: readonly InsertItem[]; active: number; visible: readonly InsertItem[]; onChoose: (item: InsertItem) => void }) {
  return <section className="insert-menu__group"><h2>{label}</h2>{items.map((item) => <button className="insert-menu__item" data-active={visible[active]?.id === item.id || undefined} key={item.id} type="button" onClick={() => onChoose(item)}>{item.label}</button>)}</section>;
}
