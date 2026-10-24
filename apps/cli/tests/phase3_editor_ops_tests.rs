use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use davinci_cli::note_ops::{
    create_new_note, delete_note, find_best_match, list_notes, rename_note,
};

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
fn test_create_and_rename_lifecycle() {
    let vault = create_temp_vault("ops_crud");

    // 1. Create note
    let created = create_new_note(&vault, "Architecture Plan").unwrap();
    assert!(created.exists());
    assert_eq!(created, vault.join("Architecture Plan.md"));
    let content = fs::read_to_string(&created).unwrap();
    assert_eq!(content, "# Architecture Plan\n\n");

    // Duplicate creation rejected
    let dup = create_new_note(&vault, "Architecture Plan");
    assert!(dup.is_err());
    assert!(dup.unwrap_err().contains("already exists"));

    // 2. Rename note
    let renamed = rename_note(&vault, &created, "Architecture V2").unwrap();
    assert!(!created.exists());
    assert!(renamed.exists());
    assert_eq!(renamed, vault.join("Architecture V2.md"));

    // 3. Move to subfolder via rename
    let moved = rename_note(&vault, &renamed, "Docs/Architecture V2").unwrap();
    assert!(!renamed.exists());
    assert!(moved.exists());
    assert_eq!(moved, vault.join("Docs").join("Architecture V2.md"));

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_delete_note_moves_to_trash() {
    let vault = create_temp_vault("ops_trash");
    let note = create_new_note(&vault, "Disposable").unwrap();
    assert!(note.exists());

    delete_note(&vault, &note).unwrap();
    assert!(!note.exists());

    // Verified moved to .trash/
    let trash_path = vault.join(".trash").join("Disposable.md");
    assert!(trash_path.exists());

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_fuzzy_find_best_match() {
    let vault = create_temp_vault("ops_fuzzy");
    fs::create_dir_all(vault.join("Work")).unwrap();
    fs::write(vault.join("Work").join("Project Roadmap.md"), "roadmap").unwrap();
    fs::write(vault.join("Grocery List.md"), "milk").unwrap();

    let matched = find_best_match(&vault, "roadmap").unwrap();
    assert!(matched.ends_with("Project Roadmap.md"));

    let matched2 = find_best_match(&vault, "grocery").unwrap();
    assert!(matched2.ends_with("Grocery List.md"));

    let matched3 = find_best_match(&vault, "nonexistentxyz123");
    assert!(matched3.is_none());

    let _ = fs::remove_dir_all(&vault);
}

#[test]
fn test_list_notes() {
    let vault = create_temp_vault("ops_list");
    fs::create_dir_all(vault.join("Notes")).unwrap();
    fs::write(vault.join("ReadMe.md"), "hello").unwrap();

    let items = list_notes(&vault, None);
    assert_eq!(items.len(), 2);
    let names: Vec<String> = items.into_iter().map(|(n, _)| n).collect();
    assert!(names.contains(&"Notes/".to_string()));
    assert!(names.contains(&"ReadMe.md".to_string()));

    let _ = fs::remove_dir_all(&vault);
}
