# ADR-0206: In-Process Vim Mode Architecture Evaluation for Built-in Editor

## Status

Proposed

## Context

The DaVinci Notes CLI currently offers two ways to edit notes:
1. External editor handoff (`ADR-0205`), launching the user's native Neovim/Vim with their full configuration and plugins.
2. Built-in rope buffer editor (`ropey`), offering modeless text entry and basic modal motions (`hjkl`, `w`, `b`, `dd`, `yy`, `p`, `:wq`).

Some users desire full Vim keybindings and visual capabilities directly inside the embedded TUI pane without spawning an external process. An architectural evaluation was conducted to assess whether to adopt an off-the-shelf widget (`edtui`, `tui-textarea`), embed Neovim (`nvim --embed`), or expand the custom motion layer.

## Decision

1. **Retain External Handoff (ADR-0205) as Primary Native Vim Solution**:
   External terminal handoff remains the official method for full Neovim/Vim fidelity. It requires 0 KB of binary overhead, adds 0 ms to startup, and provides 100% compatibility with personal configs and plugins.

2. **Reject `edtui` and `tui-textarea` for Native Vim Fidelity**:
   - `edtui` lacks text objects, macros, repeat (`.`), and command-line ex mode, and pulling in its default syntax highlighting (`syntect`) adds 4–8 MB to binary size, violating `PERFORMANCE.md`.
   - `tui-textarea` is modeless and would require writing the entire modal state machine from scratch, offering no advantage over our existing `ropey` buffer.

3. **Gating Future Embedded Neovim (`nvim --embed`) Behind Cargo Feature Flag**:
   If an in-process full Neovim editor is implemented in the future, it must be architected as an embedded msgpack-RPC client (`nvim-rs`) rendering to a Ratatui canvas and gated behind an optional Cargo feature:
   ```toml
   [features]
   default = []
   embedded-nvim = ["tokio", "nvim-rs"]
   ```
   Under no circumstances may `tokio` or `nvim-rs` be included in the default build profile, ensuring the standalone CLI binary maintains its lightweight binary footprint and sub-15ms quick capture budget.

## Consequences

- The default `dn` binary remains ultra-compact (< 7 MB) and lightning-fast (< 9 ms capture latency).
- Users with complex Neovim setups can use external mode (`editor.mode = "external"` or `dn edit <note>`), while users who prefer split-screen terminal editing use the lightweight built-in editor (`editor.mode = "builtin"`).
- A clear blueprint exists should the team decide to proceed with an embedded RPC engine.
