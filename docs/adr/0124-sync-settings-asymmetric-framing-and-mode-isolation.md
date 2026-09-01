# ADR-0124: Sync Settings Asymmetric Framing and Mode Isolation

## Status

Accepted

## Context

Phase 6 introduces the Sync Setup and Mode Configuration UI. Per sync plan §5, Google Drive and Syncthing (folder sync mode) are not equal peers. Drive is the built-in, recommended path featuring automatic text diff3 merging and private app-data backup. Syncthing is an external bring-your-own-tool path requiring manual review of conflict files.

Additionally, per sync plan §6 non-goals, mid-use live mode switching on an already-configured vault is out of scope for v1. The settings UI must accurately reflect these constraints without presenting false or destructive affordances.

## Decision

1. **Asymmetric Mode Selection Framing**:
   - The unconfigured settings state (`mode === "off"`) displays Google Drive as a primary, prominent option tagged with `<Badge variant="primary">Recommended</Badge>`.
   - Folder sync (Syncthing) is presented with secondary visual weight tagged with `<Badge variant="secondary">External</Badge>`.
2. **Opt-in Default & Per-Mode Configuration Panels**:
   - Vault sync is explicitly opt-in (`"off"` by default).
   - Once configured, the panel renders the active mode's dedicated status view (`"drive"` or `"folder"`).
3. **No Mid-Use Mode Switching Affordance**:
   - Active mode configurations do not expose a "Switch mode" button.
   - To change mode, a user disconnects/disables the current sync mode, returning the vault to the unconfigured (`"off"`) state where a new mode can be selected.

## Consequences

- Clear visual hierarchy prevents users from accidentally choosing an external tool under the misconception that it is the primary built-in sync engine.
- Prevents data corruption or state confusion by disallowing unsupported live mode switching.
- Standardizes per-mode settings layout across current and future integration panels.
