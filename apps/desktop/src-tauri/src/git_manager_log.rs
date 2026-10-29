use serde::Serialize;
use std::path::Path;
use tauri::{AppHandle, Manager, WebviewWindow};

use crate::{
    command_auth::reject_plugin_runner,
    git::run_git,
    state::VaultState,
};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitEntry {
    pub hash: String,
    pub parents: Vec<String>,
    pub author_name: String,
    pub author_date: i64,
    pub subject: String,
    pub refs: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitFileChange {
    pub path: String,
    pub status: String,
    pub insertions: u32,
    pub deletions: u32,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitCommitDetail {
    pub hash: String,
    pub author_name: String,
    pub author_email: String,
    pub author_date: i64,
    pub message: String,
    pub files: Vec<GitCommitFileChange>,
}

pub(crate) fn get_log_internal(
    vault_root: &Path,
    limit: usize,
    skip: usize,
    path_filter: Option<&str>,
) -> Result<Vec<GitCommitEntry>, String> {
    let limit_str = limit.to_string();
    let skip_str = skip.to_string();
    let mut args = vec![
        "log",
        "--date-order",
        "-n",
        &limit_str,
        "--skip",
        &skip_str,
        "--pretty=format:%H%x1f%P%x1f%an%x1f%at%x1f%s%x1f%D%x1e",
    ];

    if let Some(p) = path_filter {
        args.push("--");
        args.push(p);
    }

    let output = run_git(vault_root, &args)?;
    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        eprintln!("git log stderr: {err}");
        return Ok(Vec::new());
    }

    let raw = String::from_utf8_lossy(&output.stdout);
    let mut entries = Vec::new();

    for record in raw.split('\x1e') {
        let trimmed = record.trim();
        if trimmed.is_empty() {
            continue;
        }
        let fields: Vec<&str> = trimmed.split('\x1f').collect();
        if fields.len() >= 5 {
            let hash = fields[0].to_string();
            let parents = fields[1].split_whitespace().map(String::from).collect();
            let author_name = fields[2].to_string();
            let author_date = fields[3].parse::<i64>().unwrap_or(0);
            let subject = fields[4].to_string();
            let refs = if fields.len() >= 6 { fields[5].to_string() } else { String::new() };

            entries.push(GitCommitEntry {
                hash, parents, author_name, author_date, subject, refs,
            });
        }
    }

    Ok(entries)
}

pub(crate) fn get_commit_detail_internal(
    vault_root: &Path,
    hash: &str,
) -> Result<GitCommitDetail, String> {
    let meta_out = run_git(
        vault_root,
        &[
            "show",
            "-s",
            "--pretty=format:%H%x1f%an%x1f%ae%x1f%at%x1f%B",
            hash,
        ],
    )?;
    if !meta_out.status.success() {
        return Err(format!("Could not load commit metadata for {hash}"));
    }

    let raw_meta = String::from_utf8_lossy(&meta_out.stdout);
    let parts: Vec<&str> = raw_meta.split('\x1f').collect();
    if parts.len() < 5 {
        return Err(format!("Invalid metadata format for commit {hash}"));
    }

    let author_name = parts[1].to_string();
    let author_email = parts[2].to_string();
    let author_date = parts[3].parse::<i64>().unwrap_or(0);
    let message = parts[4].to_string();

    let numstat_out = run_git(
        vault_root,
        &["diff-tree", "--root", "--no-commit-id", "--numstat", "-r", hash],
    )?;
    let mut files = Vec::new();
    if numstat_out.status.success() {
        let numstat_str = String::from_utf8_lossy(&numstat_out.stdout);
        for line in numstat_str.lines() {
            let cols: Vec<&str> = line.split('\t').collect();
            if cols.len() >= 3 {
                let insertions = cols[0].parse::<u32>().unwrap_or(0);
                let deletions = cols[1].parse::<u32>().unwrap_or(0);
                let path = cols[2].to_string();
                files.push(GitCommitFileChange {
                    path,
                    status: "M".to_string(),
                    insertions,
                    deletions,
                });
            }
        }
    }

    Ok(GitCommitDetail {
        hash: hash.to_string(),
        author_name,
        author_email,
        author_date,
        message,
        files,
    })
}

#[tauri::command]
pub async fn git_manager_get_log(
    app: AppHandle,
    window: WebviewWindow,
    limit: usize,
    skip: usize,
    path_filter: Option<String>,
) -> Result<Vec<GitCommitEntry>, String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    get_log_internal(&root, limit, skip, path_filter.as_deref())
}

#[tauri::command]
pub async fn git_manager_get_commit_details(
    app: AppHandle,
    window: WebviewWindow,
    hash: String,
) -> Result<GitCommitDetail, String> {
    reject_plugin_runner(&window)?;
    let root = app.state::<VaultState>().get_root()?;
    get_commit_detail_internal(&root, &hash)
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
                .join(format!("sophia-git-log-test-{}-{nanos}-{count}", std::process::id()));
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
    fn test_log_and_commit_detail() {
        let repo = TestRepo::new();
        let path = &repo.0;
        let note = path.join("note1.md");
        fs::write(&note, "Initial content\n").unwrap();
        let add_out = std::process::Command::new("git").args(["add", "."]).current_dir(path).output().unwrap();
        assert!(add_out.status.success());
        let commit_out = std::process::Command::new("git").args(["commit", "-m", "feat: first commit"]).current_dir(path).output().unwrap();
        assert!(commit_out.status.success(), "git commit failed: {}", String::from_utf8_lossy(&commit_out.stderr));

        let entries = get_log_internal(path, 10, 0, None).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].subject, "feat: first commit");
        assert_eq!(entries[0].author_name, "Sophia Tester");

        let detail = get_commit_detail_internal(path, &entries[0].hash).unwrap();
        assert_eq!(detail.hash, entries[0].hash);
        assert!(detail.message.contains("feat: first commit"));
        assert_eq!(detail.files.len(), 1);
        assert_eq!(detail.files[0].path, "note1.md");
    }
}
