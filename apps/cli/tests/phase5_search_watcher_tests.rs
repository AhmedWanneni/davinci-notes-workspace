use std::fs;
use std::path::PathBuf;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use davinci_cli::search_engine::search_vault;
use davinci_cli::vault_watcher::VaultWatcher;

fn create_temp_vault(prefix: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("dn_{prefix}_{nanos}"));
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn test_search_engine_line_numbers_and_case_insensitive() {
    let vault = create_temp_vault("search_test");
    fs::create_dir_all(vault.join("Docs")).unwrap();

    fs::write(
        vault.join("Docs").join("Plan.md"),
        "Line 1: Header\nLine 2: Important Secret Keyword\nLine 3: Tail\n",
    )
    .unwrap();
    fs::write(
        vault.join("Other.md"),
        "Line 1: secret keyword in lowercase\n",
    )
    .unwrap();

    let matches = search_vault(&vault, "secret keyword");
    assert_eq!(matches.len(), 2);

    let plan_match = matches.iter().find(|m| m.rel_path.contains("Plan.md")).unwrap();
    assert_eq!(plan_match.line_number, 2);
    assert!(plan_match.line_text.contains("Important Secret Keyword"));

    let other_match = matches.iter().find(|m| m.rel_path.contains("Other.md")).unwrap();
    assert_eq!(other_match.line_number, 1);

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_search_excludes_hidden_dirs() {
    let vault = create_temp_vault("search_hidden");
    let trash = vault.join(".trash");
    fs::create_dir_all(&trash).unwrap();
    fs::write(trash.join("Deleted.md"), "secret text in trash").unwrap();

    let matches = search_vault(&vault, "secret text");
    assert_eq!(matches.len(), 0);

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_search_benchmark_under_100ms() {
    let vault = create_temp_vault("search_bench");
    for i in 0..100 {
        fs::write(
            vault.join(format!("Note_{i:03}.md")),
            format!("Line 1: Item {i}\nLine 2: Content data with random target keyword\n"),
        )
        .unwrap();
    }

    let start = Instant::now();
    let matches = search_vault(&vault, "target keyword");
    let elapsed = start.elapsed();

    assert_eq!(matches.len(), 100);
    assert!(
        elapsed.as_millis() < 100,
        "Search took too long: {} ms",
        elapsed.as_millis()
    );

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_vault_watcher_lifecycle() {
    let vault = create_temp_vault("watch_test");
    let watcher = VaultWatcher::new(&vault);
    assert!(watcher.is_ok());

    let w = watcher.unwrap();
    // Initially no changes
    assert!(!w.has_external_changes());

    // Write a note
    fs::write(vault.join("External.md"), "content").unwrap();
    std::thread::sleep(std::time::Duration::from_millis(50));

    // Watcher catches change
    assert!(w.has_external_changes());

    let _ = fs::remove_dir_all(&vault);
}
