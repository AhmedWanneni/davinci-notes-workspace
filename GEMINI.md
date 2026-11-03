## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

## Git Branching & Pull Request Rules (Mandatory for all AI agents)

- **Branch Naming**: ALL branches created by an agent MUST start with one of three prefixes:
  - `feat/<feature-name>` — for new features, components, or enhancements
  - `fix/<bug-description>` — for bug fixes, edge cases, and regressions
  - `chore/<task-name>` — for dependencies, tooling, documentation, refactors, or config
  Never create a branch without one of these three prefixes.
- **Push & Pull Request Protocol**:
  - When pushing, the agent must open a Pull Request (e.g. via `gh pr create`).
  - **PR Title**: Must be clear and descriptive about what the changes do (e.g. `feat(editor): add math block live preview`).
  - **PR Description**: Must include:
    1. **Summary**: A thorough description of what the PR accomplishes and why.
    2. **ADR Links**: Clickable markdown links to all relevant Architecture Decision Records in `docs/adr/`.
    3. **Commits Breakdown**: Clear breakdown of the commits included in the PR.
    4. **Checklist**: Completed Before Merging Checklist from `AGENTS.md`.

## Dialog & Modal Design Standard (Mandatory for all AI agents)

All modals, popups, and dialogs MUST follow the `SettingsDialog` and `EditorMenuBarDropdown` design pattern:
- **"Less Boxes Always"**: Unboxed flat list rows with subtle hover backgrounds (`var(--color-bg-hover)`), icon on the left, label in the middle, and trailing metadata/chevrons on the right. Zero nested boxed card grids or heavy container borders. Sections separated by hairline dividers (`height: 1px; background-color: var(--color-border-subtle); margin: 6px 0;`).
- **Colors, Shadow, Fonts & Padding**: Background `var(--color-bg-primary)`, floating soft elevation `box-shadow: 0 4px 20px rgb(0 0 0 / 10%)`, perimeter border `1px solid var(--color-border-subtle)`, radius `10px`. Container `padding: 6px 0;`, list rows `padding: 7px 14px;` with `gap: 10px;`. Item text `font-size: 13px; font-weight: 400;`, shortcuts `font-size: 11px; color: var(--color-text-muted);`.
- Wrapped with `@radix-ui/react-dialog` (`Root`, `Portal`, `Overlay`, `Content`).
- macOS window header with native traffic light controls (`close`, `minimize`, `maximize`), centered title (`font-size: 13px; font-weight: 600;`), and `60px` spacer.
- Entrance animations: `overlay-show` and `content-show` (scale `0.96` to `1`).
- See `.agents/rules/dialog-design.md` and `.claude/skills/create-dialog/SKILL.md` for templates and guidelines.
