pub mod capture;
pub mod config;
pub mod fs_atomic;
pub mod terminal_guard;
pub mod tui_app;
pub mod tui_state;
pub mod tui_tree;
pub mod tui_view;

pub use capture::{capture_note, find_unique_quick_note_path, CaptureTarget};
pub use config::resolve_vault;
pub use fs_atomic::{atomic_append_or_create, atomic_write_new, TempFileGuard};
pub use terminal_guard::TerminalGuard;
pub use tui_app::run_tui;
pub use tui_state::TuiState;
pub use tui_tree::TreeNode;
