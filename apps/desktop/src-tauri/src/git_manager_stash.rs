use std::path::Path;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::{require_success, with_git_lock},
    state::VaultState,
};

pub(crate) fn stash_internal(vault_root: &Path, message: Option<&str>) -> Result<(), String> {
    with_git_lock(|| {
        let mut args = vec!["stash", "push", "-u"];
        if let Some(msg) = message {
            args.push("-m");
            args.push(msg);
        }
        require_success(vault_root, &args)?;
        Ok(())
    })
}

pub(crate) fn stash_pop_internal(vault_root: &Path) -> Result<(), String> {
    with_git_lock(|| {
        require_success(vault_root, &["stash", "pop"])?;
        Ok(())
    })
}

#[tauri::command]
pub async fn git_manager_stash(
    app: AppHandle,
    window: WebviewWindow,
    message: Option<String>,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    stash_internal(&root, message.as_deref())
}

#[tauri::command]
pub async fn git_manager_stash_pop(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<(), String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    stash_pop_internal(&root)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        path::PathBuf,
        sync::atomic::{AtomicU64, Ordering},
        time::{SystemTime, UNIX_EPOCH},
    };

    static TEST_COUNTER: AtomicU64 = AtomicU64::new(1);

    struct TestRepo(PathBuf);

    impl TestRepo {
        fn new() -> Self {
            let count = TEST_COUNTER.fetch_add(1, Ordering::Relaxed);
            let nanos = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let root = std::env::temp_dir()
                .join(format!("sophia-git-stash-test-{}-{nanos}-{count}", std::process::id()));
            fs::create_dir_all(&root).unwrap();

            std::process::Command::new("git").args(["init"]).current_dir(&root).output().unwrap();
            std::process::Command::new("git").args(["config", "user.name", "Sophia Tester"]).current_dir(&root).output().unwrap();
            std::process::Command::new("git").args(["config", "user.email", "test@test.local"]).current_dir(&root).output().unwrap();
            Self(root)
        }
    }

    impl Drop for TestRepo {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn test_stash_push_and_pop() {
        let repo = TestRepo::new();
        let path = &repo.0;
        let file = path.join("file.txt");
        fs::write(&file, "first\n").unwrap();
        std::process::Command::new("git").args(["add", "."]).current_dir(path).output().unwrap();
        std::process::Command::new("git").args(["commit", "-m", "init"]).current_dir(path).output().unwrap();

        fs::write(&file, "dirty changes\n").unwrap();
        stash_internal(path, Some("work in progress")).unwrap();
        assert_eq!(fs::read_to_string(&file).unwrap(), "first\n");

        stash_pop_internal(path).unwrap();
        assert_eq!(fs::read_to_string(&file).unwrap(), "dirty changes\n");
    }
}
