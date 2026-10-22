use ratatui::layout::{Constraint, Direction, Layout, Position, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, List, ListItem, Paragraph};
use ratatui::Frame;

use crate::tui_state::{FocusPane, TuiState, VimMode};

pub fn render_ui(frame: &mut Frame, state: &TuiState) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1), // Top Header
            Constraint::Min(5),    // Main Content
            Constraint::Length(1), // Bottom Bar
        ])
        .split(frame.area());

    render_header(frame, state, chunks[0]);
    render_main_panes(frame, state, chunks[1]);
    render_footer(frame, state, chunks[2]);
}

fn render_header(frame: &mut Frame, state: &TuiState, area: Rect) {
    let vault_name = state.vault_root.file_name().map(|s| s.to_string_lossy()).unwrap_or_default();
    let mut spans = vec![
        Span::styled(" DaVinci Notes ", Style::default().fg(Color::Black).bg(Color::Cyan).add_modifier(Modifier::BOLD)),
        Span::raw(format!(" Vault: {} | Items: {} ", vault_name, state.visible_items.len())),
    ];
    if state.is_fullscreen {
        spans.push(Span::styled(" [FULLSCREEN EDITOR] ", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)));
    }
    frame.render_widget(Paragraph::new(Line::from(spans)), area);
}

fn render_main_panes(frame: &mut Frame, state: &TuiState, area: Rect) {
    if state.is_fullscreen {
        render_editor_pane(frame, state, area);
    } else {
        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(35), Constraint::Percentage(65)])
            .split(area);
        render_file_tree(frame, state, chunks[0]);
        render_editor_pane(frame, state, chunks[1]);
    }
}

fn render_file_tree(frame: &mut Frame, state: &TuiState, area: Rect) {
    let border_style = if state.focus_pane == FocusPane::Tree {
        Style::default().fg(Color::Cyan)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let visible_height = area.height.saturating_sub(2) as usize;
    let items: Vec<ListItem> = state
        .visible_items
        .iter()
        .enumerate()
        .skip(state.tree_scroll)
        .take(visible_height)
        .map(|(i, item)| {
            let is_selected = i == state.selected_index;
            let indent = "  ".repeat(item.depth);
            let prefix = if item.is_dir {
                if item.is_expanded { "▼ " } else { "▶ " }
            } else {
                "  "
            };

            let item_style = if is_selected {
                Style::default().bg(Color::DarkGray).fg(Color::White).add_modifier(Modifier::BOLD)
            } else if item.is_dir {
                Style::default().fg(Color::Cyan)
            } else {
                Style::default().fg(Color::Reset)
            };

            ListItem::new(Line::from(vec![
                Span::raw(indent),
                Span::styled(prefix, Style::default().fg(Color::Yellow)),
                Span::styled(item.name.clone(), item_style),
            ]))
        })
        .collect();

    let title = if state.focus_pane == FocusPane::Tree { " Files [Active] " } else { " Files (Tab to switch) " };
    let tree_block = Block::default().borders(Borders::ALL).border_style(border_style).title(title);
    frame.render_widget(List::new(items).block(tree_block), area);
}

fn render_editor_pane(frame: &mut Frame, state: &TuiState, area: Rect) {
    let border_style = if state.focus_pane == FocusPane::Editor {
        Style::default().fg(Color::Cyan)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let file_label = state.current_file.as_ref()
        .map(|p| p.file_name().unwrap_or_default().to_string_lossy())
        .unwrap_or_else(|| "No file selected".into());

    let (cur_line, cur_col) = state.editor_buffer.cursor_line_col();
    let mod_span = if state.is_dirty {
        Span::styled(" [Modified] ", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD))
    } else {
        Span::styled(" [Saved] ", Style::default().fg(Color::Green))
    };

    let fs_span = if state.is_fullscreen {
        Span::styled(" [f] Split (Esc) ", Style::default().fg(Color::Green))
    } else {
        Span::styled(" [f] Fullscreen ", Style::default().fg(Color::Cyan))
    };

    let title_line = Line::from(vec![
        Span::styled(format!(" {file_label} "), Style::default().add_modifier(Modifier::BOLD)),
        mod_span,
        Span::raw(format!(" Ln {}, Col {} ", cur_line + 1, cur_col + 1)),
        fs_span,
    ]);

    let editor_block = Block::default().borders(Borders::ALL).border_style(border_style).title(title_line);
    let inner_area = editor_block.inner(area);
    frame.render_widget(editor_block, area);

    if inner_area.height <= 1 { return; }

    let pane_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(1), Constraint::Length(1)])
        .split(inner_area);

    let body_area = pane_chunks[0];
    let mode_area = pane_chunks[1];

    let body_height = body_area.height as usize;
    let text = &state.editor_buffer.text;
    let mut rendered_lines = Vec::new();

    for i in 0..body_height {
        let line_idx = state.editor_scroll + i;
        if line_idx < text.len_lines() {
            let line_num = format!("{:>3} ", line_idx + 1);
            let line_str = text.line(line_idx).to_string();
            let clean_line = line_str.trim_end_matches('\n');
            rendered_lines.push(Line::from(vec![
                Span::styled(line_num, Style::default().fg(Color::DarkGray)),
                Span::raw(clean_line.to_string()),
            ]));
        } else {
            rendered_lines.push(Line::from(vec![
                Span::styled("  ~ ", Style::default().fg(Color::DarkGray)),
            ]));
        }
    }

    frame.render_widget(Paragraph::new(rendered_lines), body_area);

    if state.focus_pane == FocusPane::Editor && cur_line >= state.editor_scroll && cur_line < state.editor_scroll + body_height {
        let screen_y = body_area.y + (cur_line - state.editor_scroll) as u16;
        let screen_x = body_area.x + 4 + (cur_col as u16).min(body_area.width.saturating_sub(5));
        frame.set_cursor_position(Position::new(screen_x, screen_y));
    }

    let mode_line = match state.vim_mode {
        VimMode::Insert => Line::from(vec![
            Span::styled(" -- INSERT -- ", Style::default().fg(Color::Black).bg(Color::Green).add_modifier(Modifier::BOLD)),
            Span::raw(" (Esc: normal mode | Ctrl+S: save)"),
        ]),
        VimMode::Normal => Line::from(vec![
            Span::styled(" -- NORMAL -- ", Style::default().fg(Color::Black).bg(Color::Yellow).add_modifier(Modifier::BOLD)),
            Span::raw(" (i: edit | h/j/k/l: move | u: undo | Ctrl+S: save | f: fullscreen)"),
        ]),
    };
    frame.render_widget(Paragraph::new(mode_line), mode_area);
}

fn render_footer(frame: &mut Frame, state: &TuiState, area: Rect) {
    if state.focus_pane == FocusPane::Search {
        let bar = Paragraph::new(format!(" Search: {}█ ", state.search_query)).style(Style::default().bg(Color::Blue).fg(Color::White));
        frame.render_widget(bar, area);
    } else if let Some(msg) = &state.status_message {
        let line = Line::from(vec![Span::styled(format!(" ✔ {msg} "), Style::default().fg(Color::Green).add_modifier(Modifier::BOLD))]);
        frame.render_widget(Paragraph::new(line), area);
    } else if state.is_fullscreen {
        let help = [(" [Esc/f] Split ", Color::Cyan), (" | [i] Insert ", Color::Yellow), (" | [Ctrl+S] Save ", Color::Yellow), (" | [q] Quit ", Color::Yellow)];
        frame.render_widget(Paragraph::new(Line::from(help.into_iter().map(|(t, c)| Span::styled(t, Style::default().fg(c))).collect::<Vec<_>>())), area);
    } else if state.focus_pane == FocusPane::Editor {
        let help = [(" [i] Insert ", Color::Yellow), (" | [Esc] Normal ", Color::Yellow), (" | [Ctrl+S] Save ", Color::Yellow), (" | [f] Fullscreen ", Color::Cyan), (" | [Tab] Sidebar ", Color::Yellow)];
        frame.render_widget(Paragraph::new(Line::from(help.into_iter().map(|(t, c)| Span::styled(t, Style::default().fg(c))).collect::<Vec<_>>())), area);
    } else {
        let help = [(" [Click/Enter] Edit Note ", Color::Yellow), (" | [f] Fullscreen ", Color::Cyan), (" | [/] Search ", Color::Yellow), (" | [d] Delete ", Color::Yellow), (" | [Tab] Switch ", Color::Yellow), (" | [q] Quit ", Color::Yellow)];
        frame.render_widget(Paragraph::new(Line::from(help.into_iter().map(|(t, c)| Span::styled(t, Style::default().fg(c))).collect::<Vec<_>>())), area);
    }
}
