use ropey::Rope;

#[derive(Clone, Debug)]
pub struct UndoAction {
    pub char_idx: usize,
    pub deleted: String,
    pub inserted: String,
}

pub struct EditorBuffer {
    pub text: Rope,
    pub cursor_idx: usize,
    pub undo_stack: Vec<UndoAction>,
}

impl EditorBuffer {
    pub fn new(initial: &str) -> Self {
        Self {
            text: Rope::from_str(initial),
            cursor_idx: 0,
            undo_stack: Vec::new(),
        }
    }

    pub fn len_chars(&self) -> usize {
        self.text.len_chars()
    }

    pub fn cursor_line_col(&self) -> (usize, usize) {
        let line_idx = self.text.char_to_line(self.cursor_idx);
        let line_start_char = self.text.line_to_char(line_idx);
        let col_idx = self.cursor_idx - line_start_char;
        (line_idx, col_idx)
    }

    pub fn insert_char(&mut self, c: char) {
        self.text.insert_char(self.cursor_idx, c);
        self.undo_stack.push(UndoAction {
            char_idx: self.cursor_idx,
            deleted: String::new(),
            inserted: c.to_string(),
        });
        self.cursor_idx += 1;
    }

    pub fn insert_str(&mut self, s: &str) {
        self.text.insert(self.cursor_idx, s);
        self.undo_stack.push(UndoAction {
            char_idx: self.cursor_idx,
            deleted: String::new(),
            inserted: s.to_string(),
        });
        self.cursor_idx += s.chars().count();
    }

    pub fn delete_backwards(&mut self) -> bool {
        if self.cursor_idx > 0 {
            let removed = self.text.char(self.cursor_idx - 1);
            self.cursor_idx -= 1;
            self.text.remove(self.cursor_idx..self.cursor_idx + 1);
            self.undo_stack.push(UndoAction {
                char_idx: self.cursor_idx,
                deleted: removed.to_string(),
                inserted: String::new(),
            });
            true
        } else {
            false
        }
    }

    pub fn delete_forwards(&mut self) -> bool {
        if self.cursor_idx < self.len_chars() {
            let removed = self.text.char(self.cursor_idx);
            self.text.remove(self.cursor_idx..self.cursor_idx + 1);
            self.undo_stack.push(UndoAction {
                char_idx: self.cursor_idx,
                deleted: removed.to_string(),
                inserted: String::new(),
            });
            true
        } else {
            false
        }
    }

    pub fn move_left(&mut self) {
        if self.cursor_idx > 0 {
            self.cursor_idx -= 1;
        }
    }

    pub fn move_right(&mut self) {
        if self.cursor_idx < self.len_chars() {
            self.cursor_idx += 1;
        }
    }

    pub fn move_up(&mut self) {
        let (line, col) = self.cursor_line_col();
        if line > 0 {
            let target_line = line - 1;
            let target_line_len = self.text.line(target_line).len_chars().saturating_sub(1);
            let target_col = col.min(target_line_len);
            self.cursor_idx = self.text.line_to_char(target_line) + target_col;
        }
    }

    pub fn move_down(&mut self) {
        let (line, col) = self.cursor_line_col();
        if line + 1 < self.text.len_lines() {
            let target_line = line + 1;
            let target_line_len = self.text.line(target_line).len_chars().saturating_sub(1);
            let target_col = col.min(target_line_len);
            self.cursor_idx = self.text.line_to_char(target_line) + target_col;
        }
    }

    pub fn move_to_line_start(&mut self) {
        let (line, _) = self.cursor_line_col();
        self.cursor_idx = self.text.line_to_char(line);
    }

    pub fn move_to_line_end(&mut self) {
        let (line, _) = self.cursor_line_col();
        let line_slice = self.text.line(line);
        let len = line_slice.len_chars();
        let trim = if len > 0 && line_slice.char(len - 1) == '\n' { 1 } else { 0 };
        self.cursor_idx = self.text.line_to_char(line) + (len - trim);
    }

    pub fn undo(&mut self) -> bool {
        if let Some(action) = self.undo_stack.pop() {
            if !action.inserted.is_empty() {
                let count = action.inserted.chars().count();
                self.text.remove(action.char_idx..action.char_idx + count);
            }
            if !action.deleted.is_empty() {
                self.text.insert(action.char_idx, &action.deleted);
            }
            self.cursor_idx = action.char_idx;
            true
        } else {
            false
        }
    }
}

impl std::fmt::Display for EditorBuffer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.text)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_buffer_typing_and_backspace() {
        let mut buf = EditorBuffer::new("");
        buf.insert_str("Hello");
        assert_eq!(buf.to_string(), "Hello");
        assert_eq!(buf.cursor_idx, 5);

        buf.delete_backwards();
        assert_eq!(buf.to_string(), "Hell");

        buf.insert_char('o');
        buf.insert_char('!');
        assert_eq!(buf.to_string(), "Hello!");
    }

    #[test]
    fn test_buffer_undo() {
        let mut buf = EditorBuffer::new("Initial");
        buf.move_to_line_end();
        buf.insert_str(" Text");
        assert_eq!(buf.to_string(), "Initial Text");

        buf.undo();
        assert_eq!(buf.to_string(), "Initial");
    }
}
