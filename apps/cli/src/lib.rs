pub mod builtin_editor;
pub mod builtin_editor_buffer;
pub mod capture;
pub mod command_parser;
pub mod config;
pub mod editor_config;
pub mod editor_resolver;
pub mod external_editor;
pub mod fs_atomic;
pub mod note_ops;
pub mod search_engine;
pub mod terminal_guard;
pub mod tui_app;
pub mod tui_events;
pub mod tui_state;
pub mod tui_tree;
pub mod tui_view;
pub mod vault_watcher;
pub mod vim_command;
pub mod vim_motions;
pub mod vim_ops;

pub use builtin_editor::run_builtin_editor;
pub use builtin_editor_buffer::EditorBuffer;
pub use capture::{capture_note, find_unique_quick_note_path, CaptureTarget};
pub use command_parser::parse_shell_words;
pub use config::resolve_vault;
pub use editor_config::{read_editor_settings, EditorMode, EditorSettings};
pub use editor_resolver::{find_executable, resolve_editor_chain, ResolvedEditor};
pub use external_editor::{
    launch_custom_editor, launch_editor_from_tui, launch_external_editor, launch_vim_editor,
    resolve_editor, resolve_vim, EditorExitStatus,
};
pub use fs_atomic::{atomic_append_or_create, atomic_write_new, TempFileGuard};
pub use note_ops::{create_new_note, delete_note, find_best_match, list_notes, rename_note};
pub use search_engine::{search_vault, SearchMatch};
pub use terminal_guard::TerminalGuard;
pub use tui_app::run_tui;
pub use tui_state::TuiState;
pub use tui_tree::TreeNode;
pub use vault_watcher::VaultWatcher;
pub use vim_command::{execute_vim_command, VimCommandAction};
pub use vim_motions::YankRegister;
pub use vim_ops::PendingOp;
