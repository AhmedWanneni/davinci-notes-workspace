pub mod api_key;
pub mod client;
pub mod commands;
pub mod config;
pub mod devices;
pub mod devices_pending;
pub mod folders;
pub mod folders_pending;
pub mod lifecycle;
pub mod lifecycle_starter;
pub mod lifecycle_stopper;
pub mod process;
pub mod stignore;
pub mod sync_check;
pub mod sync_check_marker;
pub mod sync_check_types;
pub mod types;

#[cfg(test)]
mod tests;
#[cfg(test)]
mod lifecycle_tests;

pub use commands::*;
pub use lifecycle::SyncthingManager;
#[allow(unused_imports)]
pub use types::*;
