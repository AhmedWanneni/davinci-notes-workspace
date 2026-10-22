pub mod capture;
pub mod config;
pub mod fs_atomic;

pub use capture::{capture_note, find_unique_quick_note_path, CaptureTarget};
pub use config::resolve_vault;
pub use fs_atomic::{atomic_append_or_create, atomic_write_new, TempFileGuard};
