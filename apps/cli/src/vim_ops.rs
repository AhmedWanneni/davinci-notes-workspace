use crossterm::event::{KeyCode, KeyEvent};
use crate::tui_state::{FocusPane, TuiState, VimMode};
use crate::vim_motions::{
    delete_line, delete_to_line_end, delete_word, join_lines, move_word_backward,
    move_word_end, move_word_forward, paste_from_register, replace_char, toggle_case,
    yank_line, yank_word, YankRegister,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum PendingOp {
    #[default]
    None,
    Delete,
    Yank,
    Change,
    Go,
    Replace,
}

pub fn handle_vim_normal_key(state: &mut TuiState, key: KeyEvent) {
    match state.pending_op {
        PendingOp::None => handle_initial_normal_key(state, key),
        PendingOp::Delete => handle_pending_delete(state, key),
        PendingOp::Yank => handle_pending_yank(state, key),
        PendingOp::Change => handle_pending_change(state, key),
        PendingOp::Go => {
            state.pending_op = PendingOp::None;
            if key.code == KeyCode::Char('g') { state.editor_buffer.cursor_idx = 0; }
        }
        PendingOp::Replace => {
            state.pending_op = PendingOp::None;
            if let KeyCode::Char(c) = key.code {
                replace_char(&mut state.editor_buffer, c);
                state.is_dirty = true;
            }
        }
    }
}

fn handle_initial_normal_key(state: &mut TuiState, key: KeyEvent) {
    match key.code {
        KeyCode::Char('d') => state.pending_op = PendingOp::Delete,
        KeyCode::Char('y') => state.pending_op = PendingOp::Yank,
        KeyCode::Char('c') => state.pending_op = PendingOp::Change,
        KeyCode::Char('g') => state.pending_op = PendingOp::Go,
        KeyCode::Char('r') => state.pending_op = PendingOp::Replace,
        KeyCode::Char('p') => paste_from_register(&mut state.editor_buffer, &state.yank_register, true, &mut state.is_dirty),
        KeyCode::Char('P') => paste_from_register(&mut state.editor_buffer, &state.yank_register, false, &mut state.is_dirty),
        KeyCode::Char('D') => {
            let yanked = delete_to_line_end(&mut state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: false });
            state.is_dirty = true;
        }
        KeyCode::Char('C') => {
            let yanked = delete_to_line_end(&mut state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: false });
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        KeyCode::Char('Y') => {
            let yanked = yank_line(&state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: true });
        }
        KeyCode::Char('J') => { join_lines(&mut state.editor_buffer); state.is_dirty = true; }
        KeyCode::Char('~') => { toggle_case(&mut state.editor_buffer); state.is_dirty = true; }
        KeyCode::Char('x') => { if state.editor_buffer.delete_forwards() { state.is_dirty = true; } }
        KeyCode::Char('s') => {
            if state.editor_buffer.delete_forwards() { state.is_dirty = true; }
            state.vim_mode = VimMode::Insert;
        }
        KeyCode::Char('u') => { if state.editor_buffer.undo() { state.is_dirty = true; } }
        KeyCode::Char('w') => move_word_forward(&mut state.editor_buffer),
        KeyCode::Char('b') => move_word_backward(&mut state.editor_buffer),
        KeyCode::Char('e') => move_word_end(&mut state.editor_buffer),
        KeyCode::Char('i') => state.vim_mode = VimMode::Insert,
        KeyCode::Char('a') => { state.editor_buffer.move_right(); state.vim_mode = VimMode::Insert; }
        KeyCode::Char('A') => { state.editor_buffer.move_to_line_end(); state.vim_mode = VimMode::Insert; }
        KeyCode::Char('I') => { state.editor_buffer.move_to_line_start(); state.vim_mode = VimMode::Insert; }
        KeyCode::Char('o') => {
            state.editor_buffer.move_to_line_end();
            state.editor_buffer.insert_char('\n');
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        KeyCode::Char('O') => {
            state.editor_buffer.move_to_line_start();
            state.editor_buffer.insert_char('\n');
            state.editor_buffer.move_up();
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        KeyCode::Char('h') | KeyCode::Left => state.editor_buffer.move_left(),
        KeyCode::Char('l') | KeyCode::Right => state.editor_buffer.move_right(),
        KeyCode::Char('j') | KeyCode::Down => state.editor_buffer.move_down(),
        KeyCode::Char('k') | KeyCode::Up => state.editor_buffer.move_up(),
        KeyCode::Char('0') => state.editor_buffer.move_to_line_start(),
        KeyCode::Char('$') => state.editor_buffer.move_to_line_end(),
        KeyCode::Char('G') => state.editor_buffer.cursor_idx = state.editor_buffer.len_chars(),
        KeyCode::Char('f') | KeyCode::Char('F') => state.toggle_fullscreen(),
        KeyCode::Tab => state.focus_pane = FocusPane::Tree,
        KeyCode::Esc => { if state.is_fullscreen { state.toggle_fullscreen(); } else { state.focus_pane = FocusPane::Tree; } }
        KeyCode::Char(':') => { state.vim_mode = VimMode::Command; state.command_input.clear(); }
        KeyCode::Char('q') => { let _ = crate::vim_command::execute_vim_command(state, "q"); }
        _ => {}
    }
}

fn handle_pending_delete(state: &mut TuiState, key: KeyEvent) {
    state.pending_op = PendingOp::None;
    match key.code {
        KeyCode::Char('d') => {
            let yanked = delete_line(&mut state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: true });
            state.is_dirty = true;
        }
        KeyCode::Char('w') => {
            let yanked = delete_word(&mut state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: false });
            state.is_dirty = true;
        }
        KeyCode::Char('$') => {
            let yanked = delete_to_line_end(&mut state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: false });
            state.is_dirty = true;
        }
        _ => {}
    }
}

fn handle_pending_yank(state: &mut TuiState, key: KeyEvent) {
    state.pending_op = PendingOp::None;
    match key.code {
        KeyCode::Char('y') => {
            let yanked = yank_line(&state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: true });
        }
        KeyCode::Char('w') => {
            let yanked = yank_word(&state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: false });
        }
        _ => {}
    }
}

fn handle_pending_change(state: &mut TuiState, key: KeyEvent) {
    state.pending_op = PendingOp::None;
    match key.code {
        KeyCode::Char('c') => {
            let yanked = delete_line(&mut state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: true });
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        KeyCode::Char('w') => {
            let yanked = delete_word(&mut state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: false });
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        _ => {}
    }
}
