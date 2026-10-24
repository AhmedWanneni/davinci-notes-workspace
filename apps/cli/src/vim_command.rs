use crate::tui_state::{FocusPane, TuiState, VimMode};

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum VimCommandAction {
    Stay,
    ReturnToTree,
    QuitApp,
}

pub fn execute_vim_command(state: &mut TuiState, raw_cmd: &str) -> VimCommandAction {
    let cmd = raw_cmd.trim().trim_start_matches(':');
    match cmd {
        "w" | "write" => {
            if let Err(e) = state.save_current_file() {
                state.status_message = Some(format!("E212: Can't open file for writing: {e}"));
            }
            state.vim_mode = VimMode::Normal;
            VimCommandAction::Stay
        }
        "q" | "quit" => {
            if state.is_dirty {
                state.status_message = Some("E37: No write since last change (add ! to override)".into());
                state.vim_mode = VimMode::Normal;
                VimCommandAction::Stay
            } else {
                state.focus_pane = FocusPane::Tree;
                state.vim_mode = VimMode::Normal;
                state.status_message = Some("Closed note".into());
                VimCommandAction::ReturnToTree
            }
        }
        "q!" | "quit!" => {
            state.is_dirty = false;
            state.load_selected_file();
            state.focus_pane = FocusPane::Tree;
            state.vim_mode = VimMode::Normal;
            state.status_message = Some("Closed note (discarded changes)".into());
            VimCommandAction::ReturnToTree
        }
        "wq" | "qw" | "x" | "xit" => {
            if let Err(e) = state.save_current_file() {
                state.status_message = Some(format!("E212: Can't open file for writing: {e}"));
                state.vim_mode = VimMode::Normal;
                VimCommandAction::Stay
            } else {
                state.focus_pane = FocusPane::Tree;
                state.vim_mode = VimMode::Normal;
                VimCommandAction::ReturnToTree
            }
        }
        "qa" | "qall" | "quitall" => {
            state.should_quit = true;
            VimCommandAction::QuitApp
        }
        "wqa" | "xa" => {
            let _ = state.save_current_file();
            state.should_quit = true;
            VimCommandAction::QuitApp
        }
        "" => {
            state.vim_mode = VimMode::Normal;
            VimCommandAction::Stay
        }
        unknown => {
            state.status_message = Some(format!("E492: Not an editor command: {unknown}"));
            state.vim_mode = VimMode::Normal;
            VimCommandAction::Stay
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::SystemTime;

    #[test]
    fn test_execute_vim_command_save_and_quit() {
        let temp_vault = std::env::temp_dir().join(format!("dn_cmd_test_{}", SystemTime::now().elapsed().unwrap().as_nanos()));
        fs::create_dir_all(&temp_vault).unwrap();
        let note = temp_vault.join("cmd.md");
        fs::write(&note, "Initial").unwrap();

        let mut state = TuiState::new(temp_vault.clone());
        state.focus_pane = FocusPane::Editor;

        // :w saves
        state.editor_buffer.insert_str(" edited");
        state.is_dirty = true;
        let action = execute_vim_command(&mut state, ":w");
        assert_eq!(action, VimCommandAction::Stay);
        assert!(!state.is_dirty);

        // :q returns to tree
        let action = execute_vim_command(&mut state, ":q");
        assert_eq!(action, VimCommandAction::ReturnToTree);
        assert_eq!(state.focus_pane, FocusPane::Tree);

        let _ = fs::remove_dir_all(temp_vault);
    }
}
