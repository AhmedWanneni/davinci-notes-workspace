use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

pub struct TempFileGuard {
    pub path: PathBuf,
    pub committed: bool,
}

impl TempFileGuard {
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            committed: false,
        }
    }
}

impl Drop for TempFileGuard {
    fn drop(&mut self) {
        if !self.committed && self.path.exists() {
            let _ = std::fs::remove_file(&self.path);
        }
    }
}

fn generate_temp_path(target_path: &Path) -> PathBuf {
    let parent = target_path.parent().unwrap_or_else(|| Path::new("."));
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let pid = std::process::id();
    parent.join(format!(".dn-tmp-{pid}-{nanos}.tmp"))
}

pub fn atomic_write_new(target_path: &Path, content: &str) -> std::io::Result<()> {
    if let Some(parent) = target_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let temp_path = generate_temp_path(target_path);
    let mut guard = TempFileGuard::new(temp_path.clone());

    {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp_path)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
    }

    std::fs::rename(&temp_path, target_path)?;
    guard.committed = true;
    Ok(())
}

pub fn atomic_append_or_create(
    target_path: &Path,
    entry_text: &str,
    header_if_new: Option<&str>,
) -> std::io::Result<()> {
    if let Some(parent) = target_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let temp_path = generate_temp_path(target_path);
    let mut guard = TempFileGuard::new(temp_path.clone());

    let new_content = if target_path.exists() {
        let mut existing = String::new();
        let mut file = File::open(target_path)?;
        file.read_to_string(&mut existing)?;

        let mut buf = existing;
        if !buf.is_empty() && !buf.ends_with('\n') {
            buf.push('\n');
        }
        buf.push_str(entry_text);
        if !buf.ends_with('\n') {
            buf.push('\n');
        }
        buf
    } else {
        let mut buf = String::new();
        if let Some(header) = header_if_new {
            buf.push_str(header);
            if !buf.ends_with('\n') {
                buf.push('\n');
            }
        }
        buf.push_str(entry_text);
        if !buf.ends_with('\n') {
            buf.push('\n');
        }
        buf
    };

    {
        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&temp_path)?;
        file.write_all(new_content.as_bytes())?;
        file.sync_all()?;
    }

    std::fs::rename(&temp_path, target_path)?;
    guard.committed = true;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_atomic_write_new() {
        let dir = std::env::temp_dir().join(format!("dn_test_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&dir);
        let target = dir.join("test_note.md");

        atomic_write_new(&target, "hello world\n").expect("write should succeed");
        assert!(target.exists());
        let read = std::fs::read_to_string(&target).unwrap();
        assert_eq!(read, "hello world\n");

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_atomic_append_or_create() {
        let dir = std::env::temp_dir().join(format!("dn_test_app_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&dir);
        let target = dir.join("daily.md");

        atomic_append_or_create(&target, "- item 1", Some("# Daily\n")).unwrap();
        let read1 = std::fs::read_to_string(&target).unwrap();
        assert_eq!(read1, "# Daily\n- item 1\n");

        atomic_append_or_create(&target, "- item 2", Some("# Daily\n")).unwrap();
        let read2 = std::fs::read_to_string(&target).unwrap();
        assert_eq!(read2, "# Daily\n- item 1\n- item 2\n");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
