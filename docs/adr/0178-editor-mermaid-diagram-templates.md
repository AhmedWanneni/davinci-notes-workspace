# ADR-0178: Editor Mermaid Diagram Templates and Sub-Grouping

## Status
Accepted

## Context
Phase 4 requires adding diagram templates to the DaVinci Notes editor insert system. The templates must integrate directly into the existing insert registry (`insertRegistry`) so they automatically appear in the `"..."` header insert menu, the `/` slash menu, and the Command Palette without introducing secondary lists or parallel insertion pipelines.

Standing constraints from `PERFORMANCE.md` and `AGENTS.md` require:
1. Zero premature bundle weight: loading menus, palettes, or the slash completion engine must never eagerly pull in `mermaid` (which weighs ~543 KB raw / ~123 KB gzip in `mermaid.core`).
2. Verification against the installed Mermaid version (`11.16.1`): all templates must be verified against this exact version without upgrading dependencies.
3. CodeMirror snippet placeholders (`${1:...}`) for editable elements (labels, values, names) that render valid diagrams immediately when inserted and preserved, while surviving user replacement.
4. Each template must be concise (under 15 lines) with no external URLs, images, or click directives.

## Decision
1. **Registry Integration & Sub-Grouping**:
   - Extend `InsertGroup` with `"Diagrams"`.
   - Categorize diagram templates into four sub-groups via `subgroup?: DiagramSubgroup`:
     - **Flow and structure**: Flowchart, Sequence, Class, State, Entity-relationship, Block, Packet, Architecture.
     - **Time and planning**: User journey, Gantt, Timeline, Kanban, Git graph.
     - **Data and charts**: Pie, Quadrant, XY chart, Sankey, Radar, Treemap.
     - **Frameworks**: Mindmap, Cynefin framework (`cynefin-beta`).
   - Group modular template definitions into feature sub-modules under `packages/editor/insert/diagrams/` to respect the 150-200 line file cap.

2. **Mermaid Version Compatibility (11.16.1)**:
   - Evaluated all candidate diagram types against Mermaid 11.16.1. All 12 core diagram types and 9 newer/beta diagram types (Kanban, Sankey, XY chart, Block, Packet, Architecture, Radar, Treemap, and Cynefin) parsed cleanly under 11.16.1 and are supported. No diagram types are deferred.

3. **Strict Lazy-Loading**:
   - Diagram templates are stored as static strings with CodeMirror snippet placeholders.
   - The `insertRegistry`, `loadInsertRegistry`, slash autocomplete, and command palette never import `mermaid`.
   - `mermaid` is only dynamically imported via `loadMermaid()` in `mermaidExtension.ts` when a fenced ` ```mermaid ` code block is detected and rendered.

4. **Insertion Pipeline & Placeholder Semantics**:
   - All diagram items use the canonical `insertItem()` function: one undo transaction, blank-line boundary padding, first placeholder focused upon insertion, and Tab traversal between placeholders.
   - Unedited placeholders resolve to sensible default values that parse and render valid SVGs immediately in live preview upon insertion.

## Consequences
- Unified insert UX across `"..."` menu, `/` slash menu, and Command Palette (`Insert: <label>`).
- Live preview renders all 21 diagram types with DaVinci theme tokens immediately upon insertion.
- Bundle budget preserved: zero impact on startup time or entry JS chunks.
