const CELLS = Array.from({ length: 36 }, (_, index) => index);

export function FileTreeEmojiSkeleton() {
  return (
    <div
      className="file-tree__emoji-loading"
      role="status"
      aria-live="polite"
    >
      <span className="file-tree__emoji-loading-label">Loading emoji…</span>
      <div className="file-tree__emoji-skeleton" aria-hidden="true">
        {CELLS.map((cell) => (
          <span key={cell} className="file-tree__emoji-skeleton-cell" />
        ))}
      </div>
    </div>
  );
}
