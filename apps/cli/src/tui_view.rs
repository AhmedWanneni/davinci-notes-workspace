use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, List, ListItem, Paragraph, Wrap};
use ratatui::Frame;

use crate::tui_state::{FocusPane, TuiState};

pub fn render_ui(frame: &mut Frame, state: &TuiState) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1), // Header
            Constraint::Min(5),    // Main panes
            Constraint::Length(1), // Footer / Search
        ])
        .split(frame.area());

    render_header(frame, state, chunks[0]);
    render_main_panes(frame, state, chunks[1]);
    render_footer(frame, state, chunks[2]);
}

fn render_header(frame: &mut Frame, state: &TuiState, area: Rect) {
    let vault_name = state
        .vault_root
        .file_name()
        .map(|s| s.to_string_lossy())
        .unwrap_or_default();

    let mut spans = vec![
        Span::styled(" DaVinci Notes ", Style::default().fg(Color::Black).bg(Color::Cyan).add_modifier(Modifier::BOLD)),
        Span::raw(format!(" Vault: {} | Items: {} ", vault_name, state.visible_items.len())),
    ];

    if state.is_fullscreen {
        spans.push(Span::styled(" [FULLSCREEN MODE] ", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)));
    }

    frame.render_widget(Paragraph::new(Line::from(spans)), area);
}

fn render_main_panes(frame: &mut Frame, state: &TuiState, area: Rect) {
    if state.is_fullscreen {
        render_preview_pane(frame, state, area);
    } else {
        let main_chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(35), Constraint::Percentage(65)])
            .split(area);

        render_file_tree(frame, state, main_chunks[0]);
        render_preview_pane(frame, state, main_chunks[1]);
    }
}

fn render_file_tree(frame: &mut Frame, state: &TuiState, area: Rect) {
    let tree_border_style = if state.focus_pane == FocusPane::Tree {
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
                Style::default()
                    .bg(Color::DarkGray)
                    .fg(Color::White)
                    .add_modifier(Modifier::BOLD)
            } else if item.is_dir {
                Style::default().fg(Color::Cyan)
            } else {
                Style::default().fg(Color::Reset)
            };

            let line = Line::from(vec![
                Span::raw(indent),
                Span::styled(prefix, Style::default().fg(Color::Yellow)),
                Span::styled(item.name.clone(), item_style),
            ]);

            ListItem::new(line)
        })
        .collect();

    let tree_block = Block::default()
        .borders(Borders::ALL)
        .border_style(tree_border_style)
        .title(" Files (click to open) ");

    frame.render_widget(List::new(items).block(tree_block), area);
}

fn render_preview_pane(frame: &mut Frame, state: &TuiState, area: Rect) {
    let preview_border_style = if state.focus_pane == FocusPane::Preview {
        Style::default().fg(Color::Cyan)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let title_prefix = state
        .selected_item()
        .map(|item| format!(" {} ", item.rel_path))
        .unwrap_or_else(|| " Preview ".to_string());

    let mut title_spans = vec![
        Span::styled(title_prefix, Style::default().add_modifier(Modifier::BOLD)),
        Span::styled(" [v] Edit with Vim ", Style::default().fg(Color::Yellow)),
    ];

    if state.is_fullscreen {
        title_spans.push(Span::styled(" [f] Split (Esc) ", Style::default().fg(Color::Green)));
    } else {
        title_spans.push(Span::styled(" [f] Fullscreen ", Style::default().fg(Color::Cyan)));
    }

    let preview_block = Block::default()
        .borders(Borders::ALL)
        .border_style(preview_border_style)
        .title(Line::from(title_spans));

    let paragraph = Paragraph::new(state.preview_content.as_str())
        .block(preview_block)
        .wrap(Wrap { trim: false })
        .scroll((state.preview_scroll, 0));

    frame.render_widget(paragraph, area);
}

fn render_footer(frame: &mut Frame, state: &TuiState, area: Rect) {
    if state.focus_pane == FocusPane::Search {
        let search_text = format!(" Search: {}█ ", state.search_query);
        let bar = Paragraph::new(search_text).style(Style::default().bg(Color::Blue).fg(Color::White));
        frame.render_widget(bar, area);
    } else if let Some(msg) = &state.status_message {
        let status_line = Line::from(vec![
            Span::styled(format!(" ✔ {msg} "), Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)),
            Span::styled(" (Press any key) ", Style::default().fg(Color::DarkGray)),
        ]);
        frame.render_widget(Paragraph::new(status_line), area);
    } else if state.is_fullscreen {
        let help_spans = vec![
            Span::styled(" [v] Edit (Vim) ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [f/Esc] Split View ", Style::default().fg(Color::Cyan)),
            Span::styled(" | [j/k] Scroll ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [g/G] Top/Bottom ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [d] Delete ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [q] Quit ", Style::default().fg(Color::Yellow)),
        ];
        frame.render_widget(Paragraph::new(Line::from(help_spans)), area);
    } else {
        let help_spans = vec![
            Span::styled(" [Click/Enter] Open ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [v] Edit (Vim) ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [f] Fullscreen ", Style::default().fg(Color::Cyan)),
            Span::styled(" | [/] Search ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [d] Delete ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [Tab] Pane ", Style::default().fg(Color::Yellow)),
            Span::styled(" | [q] Quit ", Style::default().fg(Color::Yellow)),
        ];
        frame.render_widget(Paragraph::new(Line::from(help_spans)), area);
    }
}
