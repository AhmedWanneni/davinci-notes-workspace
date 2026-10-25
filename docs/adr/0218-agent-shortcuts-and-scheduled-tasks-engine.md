# 0218. Agent Shortcuts & Scheduled Tasks Engine

Date: 2026-10-25

## Context

Users want to automate repetitive workflows (e.g. "Every Sunday, prepare my weekly to-do list", "Summarize this week's notes") with quick-action shortcuts and recurring background schedules.
However:
1. Executing mutating agent actions autonomously in the background while the user is away from keyboard poses severe data loss and unmonitored corruption risks.
2. If the user's computer or app was closed during a scheduled time, firing multi-day backlogged executions at once on launch could overwhelm the vault and cause duplicate notes.
3. Adding external node cron or native OS daemon services would violate the local-first, lightweight architecture.

## Decision

1. **Storage in Vault JSON**:
   Store shortcuts in `<vault>/.davinci/agent/shortcuts.json` and schedules in `<vault>/.davinci/agent/schedules.json`. Execution logs live in `<vault>/.davinci/agent/schedule_runs.json` bounded to 50 entries.
2. **Review-First & Catch-Up Policy**:
   If a recurring task is missed while the application was closed (> 1 hour overdue), DaVinci Notes flags it as `missedWhileClosed` and presents a review banner on launch: *"Missed scheduled task while DaVinci Notes was closed: ... Run now?"*.
3. **Never Silent Mutations**:
   Scheduled tasks require user confirmation before executing file mutations, preserving user control and safety.

## Consequences

- Users gain recurring automation without risking unmonitored vault corruption.
- Catch-up banner gives clear transparency for missed tasks without duplicate execution cascades.
- Pure zero-dependency scheduling engine in `@app/ai-agent`.
