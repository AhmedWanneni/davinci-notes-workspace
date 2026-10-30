export function bindInternalLinks(
  container: HTMLElement,
  source: string,
  onLinkClick: (targetRaw: string) => void,
) {
  for (const match of source.matchAll(
    /^\s*class\s+([\w-]+)\s+internal-link\s*;/gmu,
  )) {
    const target = match[1];
    container.querySelectorAll<SVGGElement>("[id]").forEach((node) => {
      if (node.id.includes(`-${target}-`)) {
        node.classList.add("cm-mermaid-internal-link");
        node.addEventListener("click", () => onLinkClick(target));
      }
    });
  }
}
