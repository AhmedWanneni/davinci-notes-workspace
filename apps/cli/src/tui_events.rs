use crossterm::event::{KeyCode, KeyEvent, KeyModifiers, MouseButton, MouseEvent, MouseEventKind};
use ratatui::backend::CrosstermBackend;
use ratatui::Terminal;
use std::io::Stdout;
use std::time::{Duration, Instant};

use crate::terminal_guard::TerminalGuard;
use crate::tui_state::{FocusPane, TuiState};

pub fn open_in_vim(state: &mut TuiState, terminal: &mut Terminal<CrosstermBackend<Stdout>>) -> std::io::Result<()> {
    if let Some(item) = state.selected_item().cloned() {
        if !item.is_dir {
            let status = crate::external_editor::launch_vim_editor(&item.path)?;
            let _ = TerminalGuard::new();
            terminal.clear()?;
            state.update_preview();
            if status.was_modified {
                state.status_message = Some(format!("Saved changes to {}", item.name));
            }
        }
    }
    Ok(())
}

pub fn handle_key(
    state: &mut TuiState,
    terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    key: KeyEvent,
) -> std::io::Result<()> {
    state.status_message = None;

    if state.focus_pane == FocusPane::Search {
        match key.code {
            KeyCode::Esc | KeyCode::Enter => state.focus_pane = FocusPane::Tree,
            KeyCode::Backspace => {
                state.search_query.pop();
                state.refresh_visible();
                state.update_preview();
            }
            KeyCode::Char(c) => {
                state.search_query.push(c);
                state.refresh_visible();
                state.update_preview();
            }
            _ => {}
        }
        return Ok(());
    }

    match key.code {
        KeyCode::Char('q') => state.should_quit = true,
        KeyCode::Esc => {
            if state.is_fullscreen {
                state.toggle_fullscreen();
            } else {
                state.should_quit = true;
            }
        }
        KeyCode::Char('f') | KeyCode::Char('F') => state.toggle_fullscreen(),
        KeyCode::Char('v') | KeyCode::Char('e') => open_in_vim(state, terminal)?,
        KeyCode::Enter => {
            if let Some(item) = state.selected_item().cloned() {
                if item.is_dir {
                    state.toggle_current();
                } else {
                    open_in_vim(state, terminal)?;
                }
            }
        }
        KeyCode::Char('/') => {
            state.focus_pane = FocusPane::Search;
            state.search_query.clear();
        }
        KeyCode::Tab => {
            state.focus_pane = match state.focus_pane {
                FocusPane::Tree => FocusPane::Preview,
                _ => FocusPane::Tree,
            };
        }
        KeyCode::Up | KeyCode::Char('k') => {
            if state.focus_pane == FocusPane::Preview {
                state.scroll_preview(-2);
            } else {
                state.move_up();
            }
        }
        KeyCode::Down | KeyCode::Char('j') => {
            if state.focus_pane == FocusPane::Preview {
                state.scroll_preview(2);
            } else {
                state.move_down();
            }
        }
        KeyCode::Char('g') => {
            if state.focus_pane == FocusPane::Preview {
                state.scroll_preview_to_top();
            }
        }
        KeyCode::Char('G') => {
            if state.focus_pane == FocusPane::Preview {
                state.scroll_preview_to_bottom();
            }
        }
        KeyCode::Char('d') if key.modifiers.contains(KeyModifiers::CONTROL) => {
            state.scroll_preview(8);
        }
        KeyCode::Char('u') if key.modifiers.contains(KeyModifiers::CONTROL) => {
            state.scroll_preview(-8);
        }
        KeyCode::Left | KeyCode::Char('h') => {
            if let Some(item) = state.selected_item().cloned() {
                if item.is_dir && item.is_expanded {
                    state.toggle_current();
                }
            }
        }
        KeyCode::Right | KeyCode::Char('l') => {
            if let Some(item) = state.selected_item().cloned() {
                if item.is_dir && !item.is_expanded {
                    state.toggle_current();
                }
            }
        }
        KeyCode::Char('d') => {
            if let Some(item) = state.selected_item().cloned() {
                if !item.is_dir {
                    let _ = crate::note_ops::delete_note(&state.vault_root, &item.path);
                    state.root_node = crate::tui_tree::TreeNode::new_root(&state.vault_root);
                    state.refresh_visible();
                    state.update_preview();
                }
            }
        }
        _ => {}
    }
    Ok(())
}

pub fn handle_mouse(
    state: &mut TuiState,
    terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    mouse: MouseEvent,
    term_width: u16,
    term_height: u16,
) -> std::io::Result<()> {
    let tree_width = if state.is_fullscreen { 0 } else { ((term_width as u32 * 35) / 100) as u16 };

    match mouse.kind {
        MouseEventKind::Down(MouseButton::Left) => {
            let (row, col) = (mouse.row, mouse.column);
            if row == 1 && col >= tree_width {
                if col + 22 >= term_width {
                    state.toggle_fullscreen();
                } else if col + 40 >= term_width {
                    open_in_vim(state, terminal)?;
                }
                return Ok(());
            }

            if !state.is_fullscreen && col < tree_width && row >= 2 && row < term_height.saturating_sub(1) {
                let target_index = state.tree_scroll + (row - 2) as usize;
                if target_index < state.visible_items.len() {
                    let now = Instant::now();
                    let is_double_click = matches!(state.last_click, Some((idx, t)) if idx == target_index && t.elapsed() < Duration::from_millis(450));
                    state.last_click = Some((target_index, now));

                    state.select_index(target_index);
                    if let Some(item) = state.selected_item().cloned() {
                        if item.is_dir {
                            state.toggle_current();
                        } else if is_double_click {
                            open_in_vim(state, terminal)?;
                        } else {
                            state.focus_pane = FocusPane::Preview;
                        }
                    }
                }
            } else if col >= tree_width {
                state.focus_pane = FocusPane::Preview;
            }
        }
        MouseEventKind::ScrollDown => {
            if state.is_fullscreen || mouse.column >= tree_width {
                state.scroll_preview(3);
            } else {
                state.move_down();
            }
        }
        MouseEventKind::ScrollUp => {
            if state.is_fullscreen || mouse.column >= tree_width {
                state.scroll_preview(-3);
            } else {
                state.move_up();
            }
        }
        _ => {}
    }
    Ok(())
}
