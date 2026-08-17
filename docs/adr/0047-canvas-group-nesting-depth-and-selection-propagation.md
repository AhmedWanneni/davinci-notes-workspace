# ADR-0047: Canvas group nesting depth & selection/move propagation

## Status
Accepted

## Context
Phase 5 requires groups to support nesting. Two questions remain open:
1. **Maximum depth**: Should nesting be unlimited or capped? Unlimited depth risks pathological cases (1000-level nested groups) that cause O(depth) per-node work in containment resolution, selection expansion, and duplicate recursion. Real canvases never need more than a handful of levels.
2. **Selection semantics**: When a user clicks a group frame, should (a) only the group's own frame node be selected, or (b) every member (transitive) be selected along with it? Option (a) requires selection to "expand" before operations (align/duplicate/delete) can act on the whole set. Option (b) is simpler but makes it impossible to select just the frame itself for rename/color without dragging its contents.
3. **Move propagation**: Moving a group must move its direct children, their children, etc. — but React Flow's `parentNode` already handles this, so the question is whether we additionally guard against cycles and whether the UI should prevent creating a parent→child cycle.

## Decision
- **Max depth cap of 10 levels**. Any attempt to create the 11th level of nesting (e.g., dragging Group A inside Group B already at depth 9) is rejected silently. This matches Figma's practical cap, keeps all tree-walking algorithms bounded to a fixed small constant, and is more than sufficient for any realistic knowledge work. The cap is enforced in `setParentForNodes` / group creation helpers.
- **Selection: frame-only on click, expand-to-members before ops**.
  - Clicking a group selects **only the group node**, same as a text card. This lets the user rename/color just the frame without dragging contents.
  - Before any multi-node operation (duplicate, delete, align, distribute, move via drag on a selected group), the selection is expanded transitively: if the set contains a group id, add every node whose transitive parent chain reaches that group.
  - Result: align/duplicate "just work" on group selections without extra UI, while rename/color stay scoped to the frame.
- **Move propagation**: delegated entirely to React Flow's `parentNode` mechanism, which already applies parent position deltas to children recursively. Cycles are prevented by the depth cap + the rule that a group can never be reparented to one of its own transitive descendants (checked before any `parentNode` write).
- **Deleting a group**: deletes members too (consistent with Figma/Obsidian). If a user wants to keep children and remove only the frame, the operation is "Ungroup" (not in Phase 5 scope but reserved name) — delete is for "remove frame and everything inside it".

## Consequences
- Depth cap: worst-case tree walk (depth 10) is a fixed ~10× constant factor, no recursion risk.
- Selection expansion: ops code (duplicate, align, distribute) receives a flat node set and needs zero group-awareness — the expansion happens in one shared helper.
- No custom drag-sync code: React Flow's `parentNode` propagates drags through all 10 levels automatically.
- Cycle prevention is cheap: traverse upward from the candidate parent at most 10 steps looking for the child id.
