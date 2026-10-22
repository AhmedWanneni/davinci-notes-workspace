use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use crate::tui_state::{FocusPane, TuiState, VimMode};
use crate::vim_motions::{
    delete_line, delete_to_line_end, delete_word, join_n_lines, move_first_non_whitespace,
    move_word_backward, move_word_end, move_word_forward, paste_from_register, replace_char,
    toggle_case, yank_line, yank_word, YankRegister,
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
    if key.code == KeyCode::Esc {
        state.pending_op = PendingOp::None;
        state.count_prefix = None;
        return;
    }

    match state.pending_op {
        PendingOp::None => handle_initial_normal_key(state, key),
        PendingOp::Delete => handle_pending_delete(state, key),
        PendingOp::Yank => handle_pending_yank(state, key),
        PendingOp::Change => handle_pending_change(state, key),
        PendingOp::Go => {
            state.pending_op = PendingOp::None;
            let count = state.count_prefix.take().unwrap_or(1);
            if key.code == KeyCode::Char('g') {
                if count > 1 {
                    let line = count.saturating_sub(1).min(state.editor_buffer.text.len_lines().saturating_sub(1));
                    state.editor_buffer.cursor_idx = state.editor_buffer.text.line_to_char(line);
                } else {
                    state.editor_buffer.cursor_idx = 0;
                }
            }
        }
        PendingOp::Replace => {
            state.pending_op = PendingOp::None;
            let count = state.count_prefix.take().unwrap_or(1);
            if let KeyCode::Char(c) = key.code {
                for _ in 0..count {
                    replace_char(&mut state.editor_buffer, c);
                    state.editor_buffer.move_right();
                }
                state.is_dirty = true;
            }
        }
    }
}

fn handle_initial_normal_key(state: &mut TuiState, key: KeyEvent) {
    if key.modifiers.contains(KeyModifiers::CONTROL) {
        let count = state.count_prefix.take().unwrap_or(1);
        match key.code {
            KeyCode::Char('r') => {
                for _ in 0..count { if !state.editor_buffer.redo() { break; } }
                state.is_dirty = true;
            }
            KeyCode::Char('d') => for _ in 0..count * 15 { state.editor_buffer.move_down(); },
            KeyCode::Char('u') => for _ in 0..count * 15 { state.editor_buffer.move_up(); },
            _ => {}
        }
        return;
    }

    match key.code {
        KeyCode::Char(c @ '1'..='9') => {
            let cur = state.count_prefix.unwrap_or(0);
            state.count_prefix = Some(cur.saturating_mul(10).saturating_add((c as u8 - b'0') as usize));
            return;
        }
        KeyCode::Char('0') if state.count_prefix.is_some() => {
            let cur = state.count_prefix.unwrap();
            state.count_prefix = Some(cur.saturating_mul(10));
            return;
        }
        _ => {}
    }

    let count = state.count_prefix.take().unwrap_or(1);
    match key.code {
        KeyCode::Char('d') => state.pending_op = PendingOp::Delete,
        KeyCode::Char('y') => state.pending_op = PendingOp::Yank,
        KeyCode::Char('c') => state.pending_op = PendingOp::Change,
        KeyCode::Char('g') => state.pending_op = PendingOp::Go,
        KeyCode::Char('r') => state.pending_op = PendingOp::Replace,
        KeyCode::Char('J') => { join_n_lines(&mut state.editor_buffer, count); state.is_dirty = true; }
        KeyCode::Char('x') => {
            if state.editor_buffer.delete_forwards_n(count) { state.is_dirty = true; }
        }
        KeyCode::Char('X') => {
            if state.editor_buffer.delete_backwards_n(count) { state.is_dirty = true; }
        }
        KeyCode::Char('~') => { for _ in 0..count { toggle_case(&mut state.editor_buffer); } state.is_dirty = true; }
        KeyCode::Char('u') => { for _ in 0..count { if !state.editor_buffer.undo() { break; } } state.is_dirty = true; }
        KeyCode::Char('p') => for _ in 0..count { paste_from_register(&mut state.editor_buffer, &state.yank_register, true, &mut state.is_dirty); },
        KeyCode::Char('P') => for _ in 0..count { paste_from_register(&mut state.editor_buffer, &state.yank_register, false, &mut state.is_dirty); },
        KeyCode::Char('w') => for _ in 0..count { move_word_forward(&mut state.editor_buffer); },
        KeyCode::Char('b') => for _ in 0..count { move_word_backward(&mut state.editor_buffer); },
        KeyCode::Char('e') => for _ in 0..count { move_word_end(&mut state.editor_buffer); },
        KeyCode::Char('h') | KeyCode::Left => for _ in 0..count { state.editor_buffer.move_left(); },
        KeyCode::Char('l') | KeyCode::Right => for _ in 0..count { state.editor_buffer.move_right(); },
        KeyCode::Char('j') | KeyCode::Down => for _ in 0..count { state.editor_buffer.move_down(); },
        KeyCode::Char('k') | KeyCode::Up => for _ in 0..count { state.editor_buffer.move_up(); },
        KeyCode::Char('0') => state.editor_buffer.move_to_line_start(),
        KeyCode::Char('^') => move_first_non_whitespace(&mut state.editor_buffer),
        KeyCode::Char('$') => state.editor_buffer.move_to_line_end(),
        KeyCode::Char('G') => {
            if count > 1 {
                let line = count.saturating_sub(1).min(state.editor_buffer.text.len_lines().saturating_sub(1));
                state.editor_buffer.cursor_idx = state.editor_buffer.text.line_to_char(line);
            } else {
                state.editor_buffer.cursor_idx = state.editor_buffer.len_chars();
            }
        }
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
        KeyCode::Char('s') => {
            for _ in 0..count { if !state.editor_buffer.delete_forwards() { break; } }
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        KeyCode::Char('S') => {
            state.editor_buffer.move_to_line_start();
            let yanked = delete_to_line_end(&mut state.editor_buffer);
            state.yank_register = Some(YankRegister { text: yanked, is_linewise: true });
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        KeyCode::Char('i') => state.vim_mode = VimMode::Insert,
        KeyCode::Char('a') => { state.editor_buffer.move_right(); state.vim_mode = VimMode::Insert; }
        KeyCode::Char('A') => { state.editor_buffer.move_to_line_end(); state.vim_mode = VimMode::Insert; }
        KeyCode::Char('I') => { move_first_non_whitespace(&mut state.editor_buffer); state.vim_mode = VimMode::Insert; }
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
        KeyCode::Char(':') => {
            state.vim_mode = VimMode::Command;
            state.command_input.clear();
        }
        KeyCode::Char('f') | KeyCode::Char('F') => state.toggle_fullscreen(),
        KeyCode::Tab => state.focus_pane = FocusPane::Tree,
        _ => {}
    }
}

fn handle_pending_delete(state: &mut TuiState, key: KeyEvent) {
    state.pending_op = PendingOp::None;
    let count = state.count_prefix.take().unwrap_or(1);
    match key.code {
        KeyCode::Char('d') => {
            let mut text = String::new();
            for _ in 0..count { text.push_str(&delete_line(&mut state.editor_buffer)); }
            state.yank_register = Some(YankRegister { text, is_linewise: true });
            state.is_dirty = true;
        }
        KeyCode::Char('w') => {
            let mut text = String::new();
            for _ in 0..count { text.push_str(&delete_word(&mut state.editor_buffer)); }
            state.yank_register = Some(YankRegister { text, is_linewise: false });
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
    let count = state.count_prefix.take().unwrap_or(1);
    match key.code {
        KeyCode::Char('y') => {
            let (cur_line, _) = state.editor_buffer.cursor_line_col();
            let total_lines = state.editor_buffer.text.len_lines();
            let mut text = String::new();
            for i in 0..count {
                let line_idx = cur_line + i;
                if line_idx < total_lines { text.push_str(&state.editor_buffer.text.line(line_idx).to_string()); }
            }
            state.yank_register = Some(YankRegister { text, is_linewise: true });
        }
        KeyCode::Char('w') => {
            let mut text = String::new();
            for _ in 0..count {
                text.push_str(&yank_word(&state.editor_buffer));
                move_word_forward(&mut state.editor_buffer);
            }
            state.yank_register = Some(YankRegister { text, is_linewise: false });
        }
        _ => {}
    }
}

fn handle_pending_change(state: &mut TuiState, key: KeyEvent) {
    state.pending_op = PendingOp::None;
    let count = state.count_prefix.take().unwrap_or(1);
    match key.code {
        KeyCode::Char('c') => {
            let mut text = String::new();
            for _ in 0..count { text.push_str(&delete_line(&mut state.editor_buffer)); }
            state.yank_register = Some(YankRegister { text, is_linewise: true });
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        KeyCode::Char('w') => {
            let mut text = String::new();
            for _ in 0..count { text.push_str(&delete_word(&mut state.editor_buffer)); }
            state.yank_register = Some(YankRegister { text, is_linewise: false });
            state.is_dirty = true;
            state.vim_mode = VimMode::Insert;
        }
        _ => {}
    }
}
