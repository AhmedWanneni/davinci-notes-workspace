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

    let header_line = Line::from(vec![
        Span::styled(" DaVinci Notes ", Style::default().fg(Color::Black).bg(Color::Cyan).add_modifier(Modifier::BOLD)),
        Span::raw(format!(" Vault: {} | Items: {} ", vault_name, state.visible_items.len())),
    ]);

    frame.render_widget(Paragraph::new(header_line), area);
}

fn render_main_panes(frame: &mut Frame, state: &TuiState, area: Rect) {
    let main_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(35), Constraint::Percentage(65)])
        .split(area);

    render_file_tree(frame, state, main_chunks[0]);
    render_preview_pane(frame, state, main_chunks[1]);
}

fn render_file_tree(frame: &mut Frame, state: &TuiState, area: Rect) {
    let tree_border_style = if state.focus_pane == FocusPane::Tree {
        Style::default().fg(Color::Cyan)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let items: Vec<ListItem> = state
        .visible_items
        .iter()
        .enumerate()
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
        .title(" Files ");

    frame.render_widget(List::new(items).block(tree_block), area);
}

fn render_preview_pane(frame: &mut Frame, state: &TuiState, area: Rect) {
    let preview_border_style = if state.focus_pane == FocusPane::Preview {
        Style::default().fg(Color::Cyan)
    } else {
        Style::default().fg(Color::DarkGray)
    };

    let title = state
        .selected_item()
        .map(|item| format!(" Preview: {} ", item.rel_path))
        .unwrap_or_else(|| " Preview ".to_string());

    let preview_block = Block::default()
        .borders(Borders::ALL)
        .border_style(preview_border_style)
        .title(title);

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
    } else {
        let help_spans = vec![
            Span::styled(" q:Quit ", Style::default().fg(Color::Yellow)),
            Span::styled(" | /:Search ", Style::default().fg(Color::Yellow)),
            Span::styled(" | Enter/e:Edit ", Style::default().fg(Color::Yellow)),
            Span::styled(" | d:Delete ", Style::default().fg(Color::Yellow)),
            Span::styled(" | Tab:Pane ", Style::default().fg(Color::Yellow)),
        ];
        frame.render_widget(Paragraph::new(Line::from(help_spans)), area);
    }
}
