use crossterm::event::{KeyCode, KeyEvent, KeyModifiers, MouseButton, MouseEvent, MouseEventKind};
use ratatui::backend::CrosstermBackend;
use ratatui::Terminal;
use std::io::Stdout;

use crate::tui_state::{FocusPane, TuiState, VimMode};

pub fn handle_key(
    state: &mut TuiState,
    _terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    key: KeyEvent,
) -> std::io::Result<()> {
    state.status_message = None;

    if state.focus_pane == FocusPane::Search {
        handle_search_key(state, key);
        return Ok(());
    }

    if state.focus_pane == FocusPane::Editor {
        handle_editor_key(state, key);
        return Ok(());
    }

    handle_tree_key(state, key);
    Ok(())
}

fn handle_search_key(state: &mut TuiState, key: KeyEvent) {
    match key.code {
        KeyCode::Esc | KeyCode::Enter => state.focus_pane = FocusPane::Tree,
        KeyCode::Backspace => { state.search_query.pop(); state.refresh_visible(); state.load_selected_file(); }
        KeyCode::Char(c) => { state.search_query.push(c); state.refresh_visible(); state.load_selected_file(); }
        _ => {}
    }
}

fn handle_tree_key(state: &mut TuiState, key: KeyEvent) {
    match key.code {
        KeyCode::Char('q') => state.should_quit = true,
        KeyCode::Esc => { if state.is_fullscreen { state.toggle_fullscreen(); } else { state.should_quit = true; } }
        KeyCode::Char('f') | KeyCode::Char('F') => state.toggle_fullscreen(),
        KeyCode::Tab => state.focus_pane = FocusPane::Editor,
        KeyCode::Char('/') => { state.focus_pane = FocusPane::Search; state.search_query.clear(); }
        KeyCode::Up | KeyCode::Char('k') => state.move_up(),
        KeyCode::Down | KeyCode::Char('j') => state.move_down(),
        KeyCode::Char(' ') => state.toggle_current(),
        KeyCode::Enter | KeyCode::Right | KeyCode::Char('l') => {
            if let Some(item) = state.selected_item().cloned() {
                if item.is_dir { state.toggle_current(); } else { state.focus_pane = FocusPane::Editor; }
            }
        }
        KeyCode::Left | KeyCode::Char('h') => {
            if let Some(item) = state.selected_item().cloned() {
                if item.is_dir && item.is_expanded { state.toggle_current(); }
            }
        }
        KeyCode::Char('d') => {
            if let Some(item) = state.selected_item().cloned() {
                if !item.is_dir {
                    let _ = crate::note_ops::delete_note(&state.vault_root, &item.path);
                    state.root_node = crate::tui_tree::TreeNode::new_root(&state.vault_root);
                    state.refresh_visible();
                    state.load_selected_file();
                }
            }
        }
        _ => {}
    }
}

fn handle_editor_key(state: &mut TuiState, key: KeyEvent) {
    if key.modifiers.contains(KeyModifiers::CONTROL) && key.code == KeyCode::Char('s') {
        let _ = state.save_current_file();
        return;
    }

    match state.vim_mode {
        VimMode::Command => handle_editor_command(state, key),
        VimMode::Insert => handle_editor_insert(state, key),
        VimMode::Normal => handle_editor_normal(state, key),
    }
}

fn handle_editor_command(state: &mut TuiState, key: KeyEvent) {
    match key.code {
        KeyCode::Esc => state.vim_mode = VimMode::Normal,
        KeyCode::Enter => {
            let cmd = std::mem::take(&mut state.command_input);
            let _ = crate::vim_command::execute_vim_command(state, &cmd);
        }
        KeyCode::Backspace => {
            if state.command_input.is_empty() { state.vim_mode = VimMode::Normal; } else { state.command_input.pop(); }
        }
        KeyCode::Char(c) => state.command_input.push(c),
        _ => {}
    }
}

fn handle_editor_insert(state: &mut TuiState, key: KeyEvent) {
    match key.code {
        KeyCode::Esc => state.vim_mode = VimMode::Normal,
        KeyCode::Char(c) => { state.editor_buffer.insert_char(c); state.is_dirty = true; }
        KeyCode::Backspace => { if state.editor_buffer.delete_backwards() { state.is_dirty = true; } }
        KeyCode::Delete => { if state.editor_buffer.delete_forwards() { state.is_dirty = true; } }
        KeyCode::Enter => { state.editor_buffer.insert_char('\n'); state.is_dirty = true; }
        KeyCode::Tab => { state.editor_buffer.insert_str("  "); state.is_dirty = true; }
        KeyCode::Left => state.editor_buffer.move_left(),
        KeyCode::Right => state.editor_buffer.move_right(),
        KeyCode::Up => state.editor_buffer.move_up(),
        KeyCode::Down => state.editor_buffer.move_down(),
        KeyCode::Home => state.editor_buffer.move_to_line_start(),
        KeyCode::End => state.editor_buffer.move_to_line_end(),
        _ => {}
    }
}

fn handle_editor_normal(state: &mut TuiState, key: KeyEvent) {
    match key.code {
        KeyCode::Char('i') => state.vim_mode = VimMode::Insert,
        KeyCode::Char('a') => { state.editor_buffer.move_right(); state.vim_mode = VimMode::Insert; }
        KeyCode::Char('A') => { state.editor_buffer.move_to_line_end(); state.vim_mode = VimMode::Insert; }
        KeyCode::Char('I') => { state.editor_buffer.move_to_line_start(); state.vim_mode = VimMode::Insert; }
        KeyCode::Char('o') => { state.editor_buffer.move_to_line_end(); state.editor_buffer.insert_char('\n'); state.is_dirty = true; state.vim_mode = VimMode::Insert; }
        KeyCode::Char('O') => { state.editor_buffer.move_to_line_start(); state.editor_buffer.insert_char('\n'); state.editor_buffer.move_up(); state.is_dirty = true; state.vim_mode = VimMode::Insert; }
        KeyCode::Char('x') => { if state.editor_buffer.delete_forwards() { state.is_dirty = true; } }
        KeyCode::Char('u') => { if state.editor_buffer.undo() { state.is_dirty = true; } }
        KeyCode::Char('h') | KeyCode::Left => state.editor_buffer.move_left(),
        KeyCode::Char('l') | KeyCode::Right => state.editor_buffer.move_right(),
        KeyCode::Char('j') | KeyCode::Down => state.editor_buffer.move_down(),
        KeyCode::Char('k') | KeyCode::Up => state.editor_buffer.move_up(),
        KeyCode::Char('0') => state.editor_buffer.move_to_line_start(),
        KeyCode::Char('$') => state.editor_buffer.move_to_line_end(),
        KeyCode::Char('g') => state.editor_buffer.cursor_idx = 0,
        KeyCode::Char('G') => state.editor_buffer.cursor_idx = state.editor_buffer.len_chars(),
        KeyCode::Char('f') | KeyCode::Char('F') => state.toggle_fullscreen(),
        KeyCode::Tab => state.focus_pane = FocusPane::Tree,
        KeyCode::Esc => { if state.is_fullscreen { state.toggle_fullscreen(); } else { state.focus_pane = FocusPane::Tree; } }
        KeyCode::Char(':') => { state.vim_mode = VimMode::Command; state.command_input.clear(); }
        KeyCode::Char('q') => { let _ = crate::vim_command::execute_vim_command(state, "q"); }
        _ => {}
    }
}

pub fn handle_mouse(
    state: &mut TuiState,
    _terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    mouse: MouseEvent,
    term_width: u16,
    term_height: u16,
) -> std::io::Result<()> {
    let tree_width = if state.is_fullscreen { 0 } else { ((term_width as u32 * 35) / 100) as u16 };

    match mouse.kind {
        MouseEventKind::Down(MouseButton::Left) => {
            let (row, col) = (mouse.row, mouse.column);
            if row == 1 && col >= tree_width && col + 22 >= term_width {
                state.toggle_fullscreen();
                return Ok(());
            }

            if !state.is_fullscreen && col < tree_width && row >= 2 && row < term_height.saturating_sub(1) {
                let target_index = state.tree_scroll + (row - 2) as usize;
                if target_index < state.visible_items.len() {
                    state.select_index(target_index);
                    if let Some(item) = state.selected_item().cloned() {
                        if item.is_dir {
                            state.toggle_current();
                        } else {
                            state.focus_pane = FocusPane::Editor;
                        }
                    }
                }
            } else if col >= tree_width && row >= 2 && row < term_height.saturating_sub(2) {
                state.focus_pane = FocusPane::Editor;
                let clicked_line = state.editor_scroll + (row - 2) as usize;
                let text = &state.editor_buffer.text;
                if clicked_line < text.len_lines() {
                    let clicked_col = col.saturating_sub(tree_width + 5) as usize;
                    let line_len = text.line(clicked_line).len_chars().saturating_sub(1);
                    let target_col = clicked_col.min(line_len);
                    state.editor_buffer.cursor_idx = text.line_to_char(clicked_line) + target_col;
                }
            }
        }
        MouseEventKind::ScrollDown => {
            if state.is_fullscreen || mouse.column >= tree_width { state.editor_scroll = state.editor_scroll.saturating_add(3); } else { state.move_down(); }
        }
        MouseEventKind::ScrollUp => {
            if state.is_fullscreen || mouse.column >= tree_width { state.editor_scroll = state.editor_scroll.saturating_sub(3); } else { state.move_up(); }
        }
        _ => {}
    }
    Ok(())
}
