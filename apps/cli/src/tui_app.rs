use crossterm::event::{Event, KeyCode, KeyEvent, KeyEventKind, MouseButton, MouseEvent, MouseEventKind};
use ratatui::backend::CrosstermBackend;
use ratatui::Terminal;
use std::io::stdout;
use std::path::PathBuf;
use std::time::Duration;

use crate::terminal_guard::TerminalGuard;
use crate::tui_state::{FocusPane, TuiState};
use crate::tui_view::render_ui;

pub fn run_tui(vault_root: PathBuf) -> Result<Option<PathBuf>, std::io::Error> {
    let _guard = TerminalGuard::new()?;
    let backend = CrosstermBackend::new(stdout());
    let mut terminal = Terminal::new(backend)?;

    let mut state = TuiState::new(vault_root);
    let mut chosen_file = None;

    while !state.should_quit {
        terminal.draw(|f| render_ui(f, &state))?;

        if crossterm::event::poll(Duration::from_millis(50))? {
            match crossterm::event::read()? {
                Event::Key(key) if key.kind == KeyEventKind::Press => {
                    if let Some(path) = handle_key(&mut state, key) {
                        chosen_file = Some(path);
                        break;
                    }
                }
                Event::Mouse(mouse) => {
                    handle_mouse(&mut state, mouse);
                }
                _ => {}
            }
        }
    }

    Ok(chosen_file)
}

fn handle_key(state: &mut TuiState, key: KeyEvent) -> Option<PathBuf> {
    if state.focus_pane == FocusPane::Search {
        match key.code {
            KeyCode::Esc => {
                state.focus_pane = FocusPane::Tree;
                state.search_query.clear();
                state.refresh_visible();
                state.update_preview();
            }
            KeyCode::Enter => {
                state.focus_pane = FocusPane::Tree;
            }
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
        return None;
    }

    match key.code {
        KeyCode::Char('q') | KeyCode::Esc => {
            state.should_quit = true;
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
        KeyCode::Enter | KeyCode::Char('e') => {
            if let Some(item) = state.selected_item().cloned() {
                if item.is_dir {
                    state.toggle_current();
                } else {
                    let _ = TerminalGuard::restore_terminal();
                    let _ = crate::external_editor::launch_external_editor(&item.path);
                    let _ = TerminalGuard::new();
                    state.update_preview();
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

    None
}

fn handle_mouse(state: &mut TuiState, mouse: MouseEvent) {
    match mouse.kind {
        MouseEventKind::Down(MouseButton::Left) => {
            let row = mouse.row;
            // Rows 1.. are file list items (header is row 0)
            if row >= 2 && mouse.column < 40 {
                let target_index = (row - 2) as usize;
                if target_index < state.visible_items.len() {
                    if state.selected_index == target_index {
                        state.toggle_current();
                    } else {
                        state.select_index(target_index);
                    }
                }
            }
        }
        MouseEventKind::ScrollDown => {
            if mouse.column >= 40 {
                state.scroll_preview(3);
            } else {
                state.move_down();
            }
        }
        MouseEventKind::ScrollUp => {
            if mouse.column >= 40 {
                state.scroll_preview(-3);
            } else {
                state.move_up();
            }
        }
        _ => {}
    }
}
