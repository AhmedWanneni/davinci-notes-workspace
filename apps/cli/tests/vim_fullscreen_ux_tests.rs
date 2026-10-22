use davinci_cli::{resolve_vim, TuiState};
use std::fs;
use std::time::SystemTime;

#[test]
fn test_fullscreen_toggle_and_focus() {
    let temp_vault = std::env::temp_dir().join(format!("dn_fs_test_{}", SystemTime::now().elapsed().unwrap().as_nanos()));
    fs::create_dir_all(&temp_vault).unwrap();
    let note = temp_vault.join("welcome.md");
    fs::write(&note, "# Hello Fullscreen\nContent line 1").unwrap();

    let mut state = TuiState::new(temp_vault.clone());
    assert!(!state.is_fullscreen);

    state.toggle_fullscreen();
    assert!(state.is_fullscreen);
    assert_eq!(state.focus_pane, davinci_cli::tui_state::FocusPane::Editor);

    state.toggle_fullscreen();
    assert!(!state.is_fullscreen);

    let _ = fs::remove_dir_all(temp_vault);
}

#[test]
fn test_click_opens_file_in_right_pane() {
    let temp_vault = std::env::temp_dir().join(format!("dn_click_test_{}", SystemTime::now().elapsed().unwrap().as_nanos()));
    fs::create_dir_all(&temp_vault).unwrap();
    let note1 = temp_vault.join("file1.md");
    let note2 = temp_vault.join("file2.md");
    fs::write(&note1, "Content of Note 1").unwrap();
    fs::write(&note2, "Content of Note 2").unwrap();

    let mut state = TuiState::new(temp_vault.clone());
    assert_eq!(state.visible_items.len(), 2);

    state.select_index(1);
    assert_eq!(state.selected_index, 1);
    assert!(state.preview_content.contains("Content of Note 2"));

    state.select_index(0);
    assert_eq!(state.selected_index, 0);
    assert!(state.preview_content.contains("Content of Note 1"));

    let _ = fs::remove_dir_all(temp_vault);
}

#[test]
fn test_tree_scroll_adjust() {
    let temp_vault = std::env::temp_dir().join(format!("dn_scroll_test_{}", SystemTime::now().elapsed().unwrap().as_nanos()));
    fs::create_dir_all(&temp_vault).unwrap();
    for i in 0..15 {
        fs::write(temp_vault.join(format!("note_{i:02}.md")), format!("line {i}")).unwrap();
    }

    let mut state = TuiState::new(temp_vault.clone());
    assert_eq!(state.visible_items.len(), 15);

    // Visible height of 5
    state.selected_index = 8;
    state.adjust_tree_scroll(5);
    assert!(state.selected_index >= state.tree_scroll);
    assert!(state.selected_index < state.tree_scroll + 5);

    state.selected_index = 2;
    state.adjust_tree_scroll(5);
    assert!(state.tree_scroll <= 2);

    let _ = fs::remove_dir_all(temp_vault);
}

#[test]
fn test_resolve_vim_precedence() {
    let vim_binary = resolve_vim();
    assert!(vim_binary == "vim" || vim_binary == "nvim" || vim_binary == "vi" || vim_binary == "nano");
}

#[test]
fn test_in_app_vim_editing_and_save() {
    let temp_vault = std::env::temp_dir().join(format!("dn_edit_test_{}", SystemTime::now().elapsed().unwrap().as_nanos()));
    fs::create_dir_all(&temp_vault).unwrap();
    let note = temp_vault.join("todo.md");
    fs::write(&note, "Initial Todo").unwrap();

    let mut state = TuiState::new(temp_vault.clone());
    assert_eq!(state.focus_pane, davinci_cli::tui_state::FocusPane::Tree);
    assert!(!state.is_fullscreen);

    // Enter focuses editor in right pane without toggling fullscreen
    state.focus_pane = davinci_cli::tui_state::FocusPane::Editor;
    assert!(!state.is_fullscreen);
    assert_eq!(state.visible_items.len(), 1);

    // In insert mode, typing edits the in-place buffer
    state.vim_mode = davinci_cli::tui_state::VimMode::Insert;
    state.editor_buffer.move_to_line_end();
    state.editor_buffer.insert_str(" Added item");
    state.is_dirty = true;
    assert_eq!(state.editor_buffer.to_string(), "Initial Todo Added item");

    // Save writes to disk
    state.save_current_file().unwrap();
    assert!(!state.is_dirty);
    let disk_content = fs::read_to_string(&note).unwrap();
    assert_eq!(disk_content, "Initial Todo Added item");

    let _ = fs::remove_dir_all(temp_vault);
}

#[test]
fn test_vim_commands_change_focus_not_app_quit() {
    let temp_vault = std::env::temp_dir().join(format!("dn_q_test_{}", SystemTime::now().elapsed().unwrap().as_nanos()));
    fs::create_dir_all(&temp_vault).unwrap();
    let note = temp_vault.join("sample.md");
    fs::write(&note, "Sample Content").unwrap();

    let mut state = TuiState::new(temp_vault.clone());
    state.focus_pane = davinci_cli::tui_state::FocusPane::Editor;

    // 1. :q on clean buffer returns focus to tree, does NOT quit app
    davinci_cli::execute_vim_command(&mut state, ":q");
    assert_eq!(state.focus_pane, davinci_cli::tui_state::FocusPane::Tree);
    assert!(!state.should_quit);

    // Re-focus editor and make dirty
    state.focus_pane = davinci_cli::tui_state::FocusPane::Editor;
    state.editor_buffer.insert_str(" change");
    state.is_dirty = true;

    // 2. :q on dirty buffer warns E37 and STAYS in editor
    davinci_cli::execute_vim_command(&mut state, ":q");
    assert_eq!(state.focus_pane, davinci_cli::tui_state::FocusPane::Editor);
    assert!(state.status_message.as_ref().unwrap().contains("E37"));
    assert!(!state.should_quit);

    // 3. :q! discards changes and returns focus to tree
    davinci_cli::execute_vim_command(&mut state, ":q!");
    assert_eq!(state.focus_pane, davinci_cli::tui_state::FocusPane::Tree);
    assert_eq!(state.editor_buffer.to_string(), "Sample Content");
    assert!(!state.should_quit);

    // 4. :wq saves changes and returns focus to tree
    state.focus_pane = davinci_cli::tui_state::FocusPane::Editor;
    state.editor_buffer.insert_str(" saved change");
    state.is_dirty = true;
    davinci_cli::execute_vim_command(&mut state, ":wq");
    assert_eq!(state.focus_pane, davinci_cli::tui_state::FocusPane::Tree);
    assert_eq!(fs::read_to_string(&note).unwrap(), " saved changeSample Content");
    assert!(!state.should_quit);

    let _ = fs::remove_dir_all(temp_vault);
}
