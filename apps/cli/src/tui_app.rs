use crossterm::event::{Event, KeyEventKind};
use ratatui::backend::CrosstermBackend;
use ratatui::Terminal;
use std::io::stdout;
use std::path::PathBuf;
use std::time::Duration;

use crate::terminal_guard::TerminalGuard;
use crate::tui_events::{handle_key, handle_mouse};
use crate::tui_state::TuiState;
use crate::tui_view::render_ui;
use crate::vault_watcher::VaultWatcher;

pub fn run_tui(vault_root: PathBuf) -> Result<Option<PathBuf>, std::io::Error> {
    let _guard = TerminalGuard::new()?;
    let backend = CrosstermBackend::new(stdout());
    let mut terminal = Terminal::new(backend)?;

    let watcher = VaultWatcher::new(&vault_root).ok();
    let mut state = TuiState::new(vault_root);
    let chosen_file = None;

    while !state.should_quit {
        if let Some(w) = &watcher {
            if w.has_external_changes() {
                state.root_node = crate::tui_tree::TreeNode::new_root(&state.vault_root);
                state.refresh_visible();
                state.load_selected_file();
            }
        }

        let term_size = terminal.size()?;
        let visible_height = term_size.height.saturating_sub(4) as usize;
        state.adjust_tree_scroll(visible_height);
        state.adjust_editor_scroll(visible_height);

        terminal.draw(|f| render_ui(f, &state))?;

        if crossterm::event::poll(Duration::from_millis(50))? {
            match crossterm::event::read()? {
                Event::Key(key) if key.kind == KeyEventKind::Press => {
                    handle_key(&mut state, &mut terminal, key)?;
                }
                Event::Mouse(mouse) => {
                    handle_mouse(&mut state, &mut terminal, mouse, term_size.width, term_size.height)?;
                }
                _ => {}
            }
        }
    }

    Ok(chosen_file)
}
