# ADR-0214: Dedicated Agent Tab (`davinci://agent`) and Lazy Subsystem Mounting

## Status

Accepted (extends ADR-0132, ADR-0210)

## Context

The AI Agent requires a dedicated, full-screen conversation space where users can interact with models, review file change diffs, and inspect history without obscuring open notes. At the same time, `PERFORMANCE.md` mandates zero startup penalty for users who never open the agent.

## Decision

1. **Virtual Tab Routing (`davinci://agent`)**:
   - Register `davinci://agent` as a first-class virtual tab, matching the pattern established for `davinci://bookmarks` (ADR-0210).
   - Virtual tabs do not trigger disk reads, auto-save disk writes, or H1-sync renames.
   - Dedicated `Sparkle` icon on `IconRail` and `AppTabs` tab strip.

2. **Lazy Dynamic Import Boundary**:
   - Dynamic `React.lazy()` chunk (`LazyAgentView`) ensures 0 KB of agent UI or execution code ships in the initial application bundle.

3. **Desktop Bridge Serialization**:
   - Connect domain logic (`@app/ai-agent`) to desktop vault actions (`createNoteInVault`, `appendToNoteInVault`, `renameNoteInVault`, `deleteNoteInVault`).
   - All file inspection operations strictly execute under `withDbLock` (ADR-0168).

## Consequences

- Full workspace integration: users can switch between notes, graph, calendar, and the agent tab seamlessly.
- Zero startup time degradation.
- Full compliance with lightweight architectural constraints.
