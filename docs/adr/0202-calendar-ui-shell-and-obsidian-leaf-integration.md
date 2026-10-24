# ADR-0202: Calendar UI Shell and Obsidian Leaf Integration

## Context
Phase 4 of the Google Calendar & Meet integration requires desktop UI entry points and rendering for calendar events without violating our strict bundle and performance boundaries. The desktop shell uses an Obsidian-style layout with an Icon Rail on the left, an AppSidebar, tabs, and main editor leaves (e.g. EditorArea, GlobalGraphLeaf).

## Decisions
1. **Left Icon Rail Entry Point**:
   - Added `CalendarCheck` icon from `@phosphor-icons/react` to `IconRail`, positioned right alongside Daily Note (`CalendarBlank`).
   - Controlled via `isCalendarOpen` and `onOpenCalendar` callbacks, rendering active indicator styling matching other rail tools.
2. **Dynamic Lazy-Load Boundary**:
   - `CalendarLeaf` is strictly lazy-loaded via `React.lazy(() => import("./components/CalendarView").then(...))` in `App.tsx` and wrapped in `Suspense`. Zero calendar component JS is loaded on initial app startup until explicitly invoked.
3. **Workspace State Synchronization**:
   - `isCalendarOpen` is integrated into `useWorkspaceStore` via `createNoteNavigationActions`.
   - Activating a note tab (`openNote`, `setActiveNote`), or opening the global graph leaf automatically closes the calendar view, ensuring clean mutual exclusivity across full-pane leaves.
4. **Editorial Design Tokens & Modular Layout**:
   - Sub-components (`MeetJoinButton`, `EventCard`, `DayAgendaView`, `CalendarLeaf`) are strictly modular (<200 lines each) and styled with CSS Modules (`CalendarView.module.scss`).
   - Respects all design rules: zero raw hex/px values, zero box-shadows, zero gradients; uses border-based depth, typography tokens, and kebab-case classes.

## Consequences
- Fast initial vault startup time is completely preserved.
- Users can switch effortlessly between notes, graph, and calendar agenda from the primary navigation rail.
- Full Storybook stories and Vitest test coverage are colocated.
