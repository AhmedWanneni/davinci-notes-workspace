# Mobile App — Stack & Architecture

Same core app as desktop (Tauri, shared React/TS frontend, CodeMirror editor, SQLite index), adapted for mobile constraints: sandboxed storage, touch input, battery/CPU limits, and sync instead of direct filesystem access.

---

## Stack Summary

| Layer | Choice | Notes |
|---|---|---|
| Shell | **Tauri v2 (mobile target)** | Same codebase as desktop — iOS + Android from one Rust core + React frontend. |
| Frontend | **React + TypeScript** (shared with desktop) | Same components where possible; mobile-specific layout variants where touch requires it. |
| Editor | **CodeMirror 6** (shared) | Same core, mobile-tuned touch/scroll handling. |
| Local storage | **App sandbox storage** (not arbitrary folder access) | iOS/Android don't allow desktop-style "pick any folder" — vault lives in app-private storage, synced in/out. |
| Index | **SQLite** (shared schema with desktop) | Same tables (`notes`, `links`), same query patterns. |
| Sync | **Manifest-diff sync client** (see sync doc) | Hash + mtime comparison against sync server, not continuous. |
| Background work | **Platform background task APIs** (iOS BGTaskScheduler / Android WorkManager, via Tauri plugin or native bridge) | For periodic sync — bounded, not continuous polling. |

---

## Key Platform Differences from Desktop

| Concern | Desktop | Mobile |
|---|---|---|
| File access | Arbitrary folder, OS-level sync client (iCloud/Dropbox) handles sync | Sandboxed storage, app owns sync directly |
| Sync trigger | File watcher on external changes | Foreground/background transition + pull-to-refresh + bounded background task |
| Input | Keyboard, mouse, hover states | Touch, no hover — every interactive element needs a touch target, not a hover affordance |
| Window | Multi-pane, resizable | Single-pane primary, tab/stack navigation between views |
| Plugin parity | Full Tauri plugin set | Check plugin support before assuming a desktop feature "just works" — fewer plugins ported to mobile |

---

## Architecture

```
┌──────────────────────────────────────────┐
│  React UI — mobile layout                  │
│  (stack navigation: List → Note → Search)  │
├──────────────────────────────────────────┤
│  Shared app logic (indexer, link parser,   │
│  same package as desktop)                  │
├──────────────────────────────────────────┤
│  Sync client (manifest diff, background)   │
├──────────────────────────────────────────┤
│  Tauri IPC bridge                          │
├──────────────────────────────────────────┤
│  Rust: sandboxed fs, SQLite, background    │
│  task scheduling, native sync bridge       │
└──────────────────────────────────────────┘
                     │
                     ▼
            Sync server (shared with
             desktop, see sync doc)
```

**Shared vs mobile-specific code:**
- Shared package: indexer, link parsing, graph building, sync client logic, design system tokens/primitives — anything not tied to layout or input model.
- Mobile-specific: navigation shell, touch-optimized components (larger tap targets, swipe gestures), any view intentionally simplified for small screens (e.g. graph view may be reduced-scope on mobile — see performance notes).

---

## Navigation Model

Desktop uses multi-pane/split view. Mobile should not try to replicate this — use stack-based navigation instead:

```
Vault Home (file list / recent notes)
  → Note (full-screen editor)
      → Backlinks (sheet/modal, not a side panel)
      → Linked note (pushes new screen)
  → Search (full-screen, not inline palette)
  → Graph (optional, see below)
```

- [ ] Use a standard mobile stack navigator (React Navigation if going native-feel, or a lightweight custom router if staying web-based inside the webview).
- [ ] Backlinks/graph/tags become bottom sheets or dedicated screens, not always-visible side panels.

---

## Storage Model

- Vault content stored in app-sandboxed storage (`AppData`/`Documents` sandbox depending on platform, via Tauri's mobile fs APIs).
- Same file-per-note + SQLite index pattern as desktop — **schema stays identical** so sync logic and indexer code can be shared unmodified.
- No file watcher needed for external changes (nothing else writes into the sandbox) — all incoming changes arrive through the sync client instead.

---

## Sync Client (Mobile-Specific Behavior)

- **Triggers**: app foreground, app background (before suspension), explicit pull-to-refresh. No continuous polling.
- **Background sync**: use the platform's bounded background task API (iOS `BGTaskScheduler`, Android `WorkManager`) for periodic catch-up sync when the app isn't open — these are OS-throttled by design, treat sync as best-effort in the background, guaranteed on foreground.
- **Payload**: manifest (hash + mtime) first, content only for files that actually changed — critical on mobile data connections.
- **Conflict handling**: identical to desktop — server-canonical + conflicted-copy file on divergence, no in-editor merge UI needed.

---

## Performance Priorities (in order of impact)

1. **Lazy-load non-critical views.** Editor + file list in the initial bundle; graph view, settings, command palette loaded on demand.
2. **Debounce indexing.** Parse links/frontmatter on typing pause, not per keystroke — mobile CPUs throttle harder under sustained load than desktop.
3. **Batch SQLite writes.** Write on pause/blur/background transition, not every keystroke.
4. **Cap graph view complexity.** Mobile GPUs are weaker and screens smaller — cluster/fade distant nodes, or scope graph view down to backlinks-only for v1 and revisit full graph rendering once core app is validated.
5. **Bundle size discipline.** Tree-shake aggressively; audit `d3`/`react-force-graph`-class dependencies specifically since they're the heaviest. Add a bundle-size check to CI.
6. **Test on real low-end Android hardware early** — simulators and high-end personal devices hide the problems that actually matter.

---

## Suggested Build Order

1. Get desktop app + sync server working first (mobile reuses both the shared logic and the server).
2. Stand up Tauri mobile target with the shared package — validate build/deploy pipeline before building mobile-specific UI.
3. Build mobile navigation shell (stack nav) around existing shared components.
4. Wire sync client into mobile app — foreground/background triggers first, background task scheduling after that's proven.
5. Touch-optimize editor interactions (selection, scrolling, keyboard avoidance) — budget real device-testing time here.
6. Graph view last, and only if backlinks-only isn't sufficient once you're using the app daily on a phone.