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
