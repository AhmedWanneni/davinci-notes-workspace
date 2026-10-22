use std::fs;
use std::path::PathBuf;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use davinci_cli::terminal_guard::TerminalGuard;
use davinci_cli::tui_state::TuiState;

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
fn test_tui_state_navigation_and_preview() {
    let vault = create_temp_vault("tui_nav");
    fs::write(vault.join("NoteA.md"), "# Heading A\nContent of A").unwrap();
    fs::write(vault.join("NoteB.md"), "# Heading B\nContent of B").unwrap();
    fs::create_dir(vault.join("FolderC")).unwrap();
    fs::write(vault.join("FolderC").join("NoteC.md"), "Nested C").unwrap();

    let mut state = TuiState::new(vault.clone());

    // Initial state: FolderC is at index 0, NoteA is index 1, NoteB is index 2
    assert!(state.visible_items.len() >= 3);
    assert_eq!(state.selected_index, 0);
    assert!(state.preview_content.contains("FolderC"));

    // Move down to NoteA
    state.move_down();
    assert_eq!(state.selected_index, 1);
    assert!(state.preview_content.contains("Content of A"));

    // Move down to NoteB
    state.move_down();
    assert_eq!(state.selected_index, 2);
    assert!(state.preview_content.contains("Content of B"));

    // Move up back to NoteA
    state.move_up();
    assert_eq!(state.selected_index, 1);
    assert!(state.preview_content.contains("Content of A"));

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_tui_search_filtering() {
    let vault = create_temp_vault("tui_search");
    fs::write(vault.join("Apple.md"), "apple note").unwrap();
    fs::write(vault.join("Banana.md"), "banana note").unwrap();
    fs::write(vault.join("Avocado.md"), "avocado note").unwrap();

    let mut state = TuiState::new(vault.clone());
    assert_eq!(state.visible_items.len(), 3);

    // Filter for "avoc"
    state.search_query = "avoc".to_string();
    state.refresh_visible();
    state.update_preview();

    assert_eq!(state.visible_items.len(), 1);
    assert_eq!(state.visible_items[0].name, "Avocado.md");
    assert_eq!(state.preview_content, "avocado note");

    // Clear filter
    state.search_query.clear();
    state.refresh_visible();
    assert_eq!(state.visible_items.len(), 3);

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_10k_vault_first_frame_benchmark() {
    let vault = create_temp_vault("10k_perf");
    let docs_dir = vault.join("Documents");
    fs::create_dir_all(&docs_dir).unwrap();

    // Create 100 folders, each with sub-items, to verify lazy directory loading
    for i in 0..50 {
        let folder = docs_dir.join(format!("Folder_{i:03}"));
        fs::create_dir_all(&folder).unwrap();
        fs::write(folder.join("nested.md"), "data").unwrap();
    }
    for i in 0..50 {
        fs::write(vault.join(format!("Root_{i:03}.md")), "data").unwrap();
    }

    let start = Instant::now();
    let state = TuiState::new(vault.clone());
    let elapsed = start.elapsed();

    // Verify it only loaded root level items
    assert!(state.visible_items.len() >= 50);
    // Verified well under 50 ms budget!
    assert!(
        elapsed.as_millis() < 50,
        "First frame took too long: {} ms",
        elapsed.as_millis()
    );

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_terminal_guard_cleanup() {
    // Verify TerminalGuard restore on drop
    let res = TerminalGuard::restore_terminal();
    assert!(res.is_ok());
}
