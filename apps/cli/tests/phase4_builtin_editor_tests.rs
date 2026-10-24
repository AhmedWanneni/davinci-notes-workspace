use std::fs;
use std::path::PathBuf;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use davinci_cli::builtin_editor_buffer::EditorBuffer;
use davinci_cli::fs_atomic::atomic_write_new;

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
fn test_builtin_buffer_large_note_performance() {
    // 10,000-line note
    let mut large_text = String::with_capacity(500_000);
    for i in 0..10_000 {
        large_text.push_str(&format!("Line {i:05}: Standard markdown text entry\n"));
    }

    let start_load = Instant::now();
    let mut buf = EditorBuffer::new(&large_text);
    let load_time = start_load.elapsed();
    assert!(load_time.as_millis() < 50);

    // Edit at line 5000
    let start_edit = Instant::now();
    buf.cursor_idx = 250_000;
    buf.insert_str("INSERTED_WORD ");
    let edit_time = start_edit.elapsed();

    // Verify keystroke latency is well under 2 ms budget!
    assert!(
        edit_time.as_micros() < 2000,
        "Edit took too long: {} µs",
        edit_time.as_micros()
    );

    // Verify undo on large file
    let start_undo = Instant::now();
    assert!(buf.undo());
    let undo_time = start_undo.elapsed();
    assert!(undo_time.as_micros() < 2000);
}

#[test]
fn test_builtin_buffer_cursor_line_col() {
    let mut buf = EditorBuffer::new("Line 1\nLine 2\nLine 3\n");
    assert_eq!(buf.cursor_line_col(), (0, 0));

    buf.move_down();
    assert_eq!(buf.cursor_line_col(), (1, 0));

    buf.move_to_line_end();
    assert_eq!(buf.cursor_line_col(), (1, 6));

    buf.move_to_line_start();
    assert_eq!(buf.cursor_line_col(), (1, 0));
}

#[test]
fn test_conflict_detection_simulation() {
    let vault = create_temp_vault("conflict_sim");
    let note_path = vault.join("SharedNote.md");
    atomic_write_new(&note_path, "Version 1\n").unwrap();

    let initial_mtime = fs::metadata(&note_path).unwrap().modified().unwrap();

    // External process writes to the note
    std::thread::sleep(std::time::Duration::from_millis(20));
    fs::write(&note_path, "Version 2 from Desktop\n").unwrap();
    let current_mtime = fs::metadata(&note_path).unwrap().modified().unwrap();

    // Detection
    assert_ne!(initial_mtime, current_mtime);

    let _ = fs::remove_dir_all(&vault);
}
