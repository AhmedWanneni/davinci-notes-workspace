use crossterm::event::{Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers, MouseButton, MouseEvent, MouseEventKind};
use ratatui::backend::CrosstermBackend;
use ratatui::layout::{Constraint, Direction, Layout};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::{Frame, Terminal};
use std::fs;
use std::io::stdout;
use std::path::Path;
use std::time::{Duration, SystemTime};

use crate::builtin_editor_buffer::EditorBuffer;
use crate::fs_atomic::atomic_write_new;
use crate::terminal_guard::TerminalGuard;

pub struct BuiltinEditorState {
    pub buffer: EditorBuffer,
    pub is_dirty: bool,
    pub initial_mtime: Option<SystemTime>,
    pub scroll_offset: usize,
    pub status_msg: Option<String>,
    pub should_exit: bool,
}

pub fn run_builtin_editor(file_path: &Path) -> Result<bool, std::io::Error> {
    let _guard = TerminalGuard::new()?;
    let mut terminal = Terminal::new(CrosstermBackend::new(stdout()))?;

    let initial_content = fs::read_to_string(file_path).unwrap_or_default();
    let initial_mtime = fs::metadata(file_path).ok().and_then(|m| m.modified().ok());

    let mut state = BuiltinEditorState {
        buffer: EditorBuffer::new(&initial_content),
        is_dirty: false,
        initial_mtime,
        scroll_offset: 0,
        status_msg: None,
        should_exit: false,
    };

    while !state.should_exit {
        terminal.draw(|f| render_editor_ui(f, &state, file_path))?;

        if crossterm::event::poll(Duration::from_millis(50))? {
            match crossterm::event::read()? {
                Event::Key(key) if key.kind == KeyEventKind::Press => {
                    handle_editor_key(&mut state, key, file_path);
                }
                Event::Mouse(mouse) => {
                    handle_editor_mouse(&mut state, mouse);
                }
                _ => {}
            }
        }
    }

    Ok(state.is_dirty)
}

fn handle_editor_key(state: &mut BuiltinEditorState, key: KeyEvent, file_path: &Path) {
    if key.modifiers.contains(KeyModifiers::CONTROL) {
        match key.code {
            KeyCode::Char('s') => {
                save_editor_file(state, file_path);
                return;
            }
            KeyCode::Char('q') => {
                state.should_exit = true;
                return;
            }
            KeyCode::Char('z') => {
                if state.buffer.undo() {
                    state.is_dirty = true;
                }
                return;
            }
            _ => {}
        }
    }

    match key.code {
        KeyCode::Left => state.buffer.move_left(),
        KeyCode::Right => state.buffer.move_right(),
        KeyCode::Up => state.buffer.move_up(),
        KeyCode::Down => state.buffer.move_down(),
        KeyCode::Home => state.buffer.move_to_line_start(),
        KeyCode::End => state.buffer.move_to_line_end(),
        KeyCode::Backspace => {
            if state.buffer.delete_backwards() {
                state.is_dirty = true;
            }
        }
        KeyCode::Delete => {
            if state.buffer.delete_forwards() {
                state.is_dirty = true;
            }
        }
        KeyCode::Enter => {
            state.buffer.insert_char('\n');
            state.is_dirty = true;
        }
        KeyCode::Tab => {
            state.buffer.insert_str("  ");
            state.is_dirty = true;
        }
        KeyCode::Char(c) => {
            state.buffer.insert_char(c);
            state.is_dirty = true;
        }
        _ => {}
    }
}

fn save_editor_file(state: &mut BuiltinEditorState, file_path: &Path) {
    let current_mtime = fs::metadata(file_path).ok().and_then(|m| m.modified().ok());
    if let (Some(t_init), Some(t_curr)) = (state.initial_mtime, current_mtime) {
        if t_init != t_curr {
            state.status_msg = Some("WARNING: External change detected! Saving will overwrite.".to_string());
        }
    }

    let content = state.buffer.to_string();
    match atomic_write_new(file_path, &content) {
        Ok(()) => {
            state.is_dirty = false;
            state.initial_mtime = fs::metadata(file_path).ok().and_then(|m| m.modified().ok());
            state.status_msg = Some("Saved successfully".to_string());
        }
        Err(e) => {
            state.status_msg = Some(format!("Error saving: {e}"));
        }
    }
}

fn handle_editor_mouse(state: &mut BuiltinEditorState, mouse: MouseEvent) {
    match mouse.kind {
        MouseEventKind::ScrollDown => state.scroll_offset = state.scroll_offset.saturating_add(3),
        MouseEventKind::ScrollUp => state.scroll_offset = state.scroll_offset.saturating_sub(3),
        MouseEventKind::Down(MouseButton::Left) => {
            let row = mouse.row.saturating_sub(1) as usize + state.scroll_offset;
            let col = mouse.column.saturating_sub(5) as usize;
            if row < state.buffer.text.len_lines() {
                let line_len = state.buffer.text.line(row).len_chars().saturating_sub(1);
                let target_col = col.min(line_len);
                state.buffer.cursor_idx = state.buffer.text.line_to_char(row) + target_col;
            }
        }
        _ => {}
    }
}

fn render_editor_ui(frame: &mut Frame, state: &BuiltinEditorState, file_path: &Path) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(1), Constraint::Min(5), Constraint::Length(1)])
        .split(frame.area());

    let name = file_path.file_name().map(|s| s.to_string_lossy()).unwrap_or_default();
    let mod_indicator = if state.is_dirty { " [Modified]" } else { " [Saved]" };
    let (line, col) = state.buffer.cursor_line_col();

    let header = Line::from(vec![
        Span::styled(" DaVinci Editor ", Style::default().bg(Color::Blue).fg(Color::White).add_modifier(Modifier::BOLD)),
        Span::raw(format!(" {name}{mod_indicator} | Ln {}, Col {} ", line + 1, col + 1)),
    ]);
    frame.render_widget(Paragraph::new(header), chunks[0]);

    let body_lines: Vec<Line> = state.buffer.text.lines().skip(state.scroll_offset)
        .enumerate()
        .take(chunks[1].height as usize)
        .map(|(i, l)| {
            let line_num = format!("{:>3} ", i + 1 + state.scroll_offset);
            Line::from(vec![
                Span::styled(line_num, Style::default().fg(Color::DarkGray)),
                Span::raw(l.to_string().trim_end_matches('\n').to_string()),
            ])
        }).collect();

    frame.render_widget(Paragraph::new(body_lines).block(Block::default().borders(Borders::NONE)), chunks[1]);

    let footer_text = state.status_msg.clone().unwrap_or_else(|| {
        "Ctrl+S: Save | Ctrl+Q: Exit | Ctrl+Z: Undo | Mouse: click/scroll".to_string()
    });
    frame.render_widget(Paragraph::new(footer_text).style(Style::default().bg(Color::DarkGray).fg(Color::White)), chunks[2]);
}
