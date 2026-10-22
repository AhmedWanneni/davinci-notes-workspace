use crate::builtin_editor_buffer::{EditorBuffer, UndoAction};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct YankRegister {
    pub text: String,
    pub is_linewise: bool,
}

pub fn delete_line(buf: &mut EditorBuffer) -> String {
    let (cur_line, _) = buf.cursor_line_col();
    let line_start = buf.text.line_to_char(cur_line);
    let line_len = buf.text.line(cur_line).len_chars();
    let text = buf.text.line(cur_line).to_string();
    buf.text.remove(line_start..line_start + line_len);
    buf.undo_stack.push(UndoAction { char_idx: line_start, deleted: text.clone(), inserted: String::new() });
    buf.cursor_idx = line_start.min(buf.len_chars());
    text
}

pub fn yank_line(buf: &EditorBuffer) -> String {
    let (cur_line, _) = buf.cursor_line_col();
    buf.text.line(cur_line).to_string()
}

pub fn delete_to_line_end(buf: &mut EditorBuffer) -> String {
    let (cur_line, _) = buf.cursor_line_col();
    let line_start = buf.text.line_to_char(cur_line);
    let line_len = buf.text.line(cur_line).len_chars();
    let line_end = (line_start + line_len).saturating_sub(if line_len > 0 && buf.text.line(cur_line).char(line_len - 1) == '\n' { 1 } else { 0 });
    if buf.cursor_idx < line_end {
        let text = buf.text.slice(buf.cursor_idx..line_end).to_string();
        buf.text.remove(buf.cursor_idx..line_end);
        buf.undo_stack.push(UndoAction { char_idx: buf.cursor_idx, deleted: text.clone(), inserted: String::new() });
        text
    } else {
        String::new()
    }
}

pub fn delete_word(buf: &mut EditorBuffer) -> String {
    let start = buf.cursor_idx;
    move_word_forward(buf);
    let end = buf.cursor_idx;
    buf.cursor_idx = start;
    if end > start {
        let text = buf.text.slice(start..end).to_string();
        buf.text.remove(start..end);
        buf.undo_stack.push(UndoAction { char_idx: start, deleted: text.clone(), inserted: String::new() });
        text
    } else {
        String::new()
    }
}

pub fn yank_word(buf: &EditorBuffer) -> String {
    let mut temp = EditorBuffer::new(&buf.text.to_string());
    temp.cursor_idx = buf.cursor_idx;
    let start = temp.cursor_idx;
    move_word_forward(&mut temp);
    let end = temp.cursor_idx;
    if end > start { buf.text.slice(start..end).to_string() } else { String::new() }
}

pub fn paste_from_register(buf: &mut EditorBuffer, reg: &Option<YankRegister>, after: bool, is_dirty: &mut bool) {
    let Some(r) = reg else { return; };
    *is_dirty = true;
    if r.is_linewise {
        let (cur_line, _) = buf.cursor_line_col();
        let target_line = if after { cur_line + 1 } else { cur_line };
        let insert_idx = if target_line < buf.text.len_lines() {
            buf.text.line_to_char(target_line)
        } else {
            buf.len_chars()
        };
        let mut text = r.text.clone();
        if !text.ends_with('\n') { text.push('\n'); }
        buf.text.insert(insert_idx, &text);
        buf.undo_stack.push(UndoAction { char_idx: insert_idx, deleted: String::new(), inserted: text });
        buf.cursor_idx = insert_idx;
    } else {
        let insert_idx = if after { (buf.cursor_idx + 1).min(buf.len_chars()) } else { buf.cursor_idx };
        buf.text.insert(insert_idx, &r.text);
        buf.undo_stack.push(UndoAction { char_idx: insert_idx, deleted: String::new(), inserted: r.text.clone() });
        buf.cursor_idx = insert_idx + r.text.chars().count();
    }
}

pub fn move_word_forward(buf: &mut EditorBuffer) {
    let len = buf.len_chars();
    if buf.cursor_idx >= len { return; }
    let mut idx = buf.cursor_idx;
    let is_ws = buf.text.char(idx).is_whitespace();
    while idx < len && buf.text.char(idx).is_whitespace() == is_ws { idx += 1; }
    while idx < len && buf.text.char(idx).is_whitespace() { idx += 1; }
    buf.cursor_idx = idx.min(len);
}

pub fn move_word_backward(buf: &mut EditorBuffer) {
    if buf.cursor_idx == 0 { return; }
    let mut idx = buf.cursor_idx.saturating_sub(1);
    while idx > 0 && buf.text.char(idx).is_whitespace() { idx -= 1; }
    let is_ws = buf.text.char(idx).is_whitespace();
    while idx > 0 && buf.text.char(idx - 1).is_whitespace() == is_ws { idx -= 1; }
    buf.cursor_idx = idx;
}

pub fn move_word_end(buf: &mut EditorBuffer) {
    let len = buf.len_chars();
    if buf.cursor_idx + 1 >= len { return; }
    let mut idx = buf.cursor_idx + 1;
    while idx < len && buf.text.char(idx).is_whitespace() { idx += 1; }
    let is_ws = buf.text.char(idx).is_whitespace();
    while idx + 1 < len && buf.text.char(idx + 1).is_whitespace() == is_ws { idx += 1; }
    buf.cursor_idx = idx.min(len);
}

pub fn join_lines(buf: &mut EditorBuffer) {
    let (cur_line, _) = buf.cursor_line_col();
    if cur_line + 1 < buf.text.len_lines() {
        let line_end = buf.text.line_to_char(cur_line) + buf.text.line(cur_line).len_chars().saturating_sub(1);
        if line_end < buf.len_chars() && buf.text.char(line_end) == '\n' {
            buf.text.remove(line_end..line_end + 1);
            buf.text.insert_char(line_end, ' ');
            buf.undo_stack.push(UndoAction { char_idx: line_end, deleted: "\n".into(), inserted: " ".into() });
            buf.cursor_idx = line_end;
        }
    }
}

pub fn join_n_lines(buf: &mut EditorBuffer, count: usize) {
    let joins = if count <= 1 { 1 } else { count.saturating_sub(1) };
    for _ in 0..joins {
        join_lines(buf);
    }
}

pub fn replace_char(buf: &mut EditorBuffer, c: char) {
    if buf.cursor_idx < buf.len_chars() {
        let old = buf.text.char(buf.cursor_idx).to_string();
        buf.text.remove(buf.cursor_idx..buf.cursor_idx + 1);
        buf.text.insert_char(buf.cursor_idx, c);
        buf.undo_stack.push(UndoAction { char_idx: buf.cursor_idx, deleted: old, inserted: c.to_string() });
    }
}

pub fn toggle_case(buf: &mut EditorBuffer) {
    if buf.cursor_idx < buf.len_chars() {
        let ch = buf.text.char(buf.cursor_idx);
        let toggled = if ch.is_uppercase() { ch.to_lowercase().next().unwrap_or(ch) } else { ch.to_uppercase().next().unwrap_or(ch) };
        replace_char(buf, toggled);
        buf.move_right();
    }
}

pub fn move_first_non_whitespace(buf: &mut EditorBuffer) {
    let (line, _) = buf.cursor_line_col();
    let line_start = buf.text.line_to_char(line);
    let line_slice = buf.text.line(line);
    let mut offset = 0;
    while offset < line_slice.len_chars() && line_slice.char(offset).is_whitespace() && line_slice.char(offset) != '\n' {
        offset += 1;
    }
    buf.cursor_idx = line_start + offset;
}
