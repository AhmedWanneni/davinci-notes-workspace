use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use std::fs;
use std::path::PathBuf;

use crate::tui_tree::{TreeNode, VisibleItem};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FocusPane {
    Tree,
    Preview,
    Search,
}

pub struct TuiState {
    pub vault_root: PathBuf,
    pub root_node: TreeNode,
    pub visible_items: Vec<VisibleItem>,
    pub selected_index: usize,
    pub preview_content: String,
    pub preview_scroll: u16,
    pub search_query: String,
    pub focus_pane: FocusPane,
    pub should_quit: bool,
}

impl TuiState {
    pub fn new(vault_root: PathBuf) -> Self {
        let root_node = TreeNode::new_root(&vault_root);
        let mut state = Self {
            vault_root,
            root_node,
            visible_items: Vec::new(),
            selected_index: 0,
            preview_content: String::new(),
            preview_scroll: 0,
            search_query: String::new(),
            focus_pane: FocusPane::Tree,
            should_quit: false,
        };
        state.refresh_visible();
        state.update_preview();
        state
    }

    pub fn refresh_visible(&mut self) {
        let mut all_visible = Vec::new();
        self.root_node.flatten_visible(0, &mut all_visible);

        if self.search_query.trim().is_empty() {
            self.visible_items = all_visible;
        } else {
            let matcher = SkimMatcherV2::default();
            let query = self.search_query.trim();
            self.visible_items = all_visible
                .into_iter()
                .filter(|item| {
                    matcher
                        .fuzzy_match(&item.rel_path, query)
                        .is_some()
                        || matcher.fuzzy_match(&item.name, query).is_some()
                })
                .collect();
        }

        if self.visible_items.is_empty() {
            self.selected_index = 0;
        } else if self.selected_index >= self.visible_items.len() {
            self.selected_index = self.visible_items.len() - 1;
        }
    }

    pub fn selected_item(&self) -> Option<&VisibleItem> {
        self.visible_items.get(self.selected_index)
    }

    pub fn move_up(&mut self) {
        if self.selected_index > 0 {
            self.selected_index -= 1;
            self.update_preview();
        }
    }

    pub fn move_down(&mut self) {
        if !self.visible_items.is_empty() && self.selected_index + 1 < self.visible_items.len() {
            self.selected_index += 1;
            self.update_preview();
        }
    }

    pub fn select_index(&mut self, idx: usize) {
        if idx < self.visible_items.len() {
            self.selected_index = idx;
            self.update_preview();
        }
    }

    pub fn toggle_current(&mut self) {
        let Some(item) = self.selected_item().cloned() else {
            return;
        };

        if item.is_dir {
            self.root_node
                .toggle_path(&item.path, &self.vault_root);
            self.refresh_visible();
        }
        self.update_preview();
    }

    pub fn update_preview(&mut self) {
        self.preview_scroll = 0;
        let Some(item) = self.selected_item() else {
            self.preview_content = "No items in vault".to_string();
            return;
        };

        if item.is_dir {
            let count = fs::read_dir(&item.path)
                .map(|entries| entries.count())
                .unwrap_or(0);
            self.preview_content = format!(
                "📁 Folder: {}\n\nItems in folder: {}\n\nPress Enter or click to expand/collapse.",
                item.name, count
            );
        } else {
            match fs::read_to_string(&item.path) {
                Ok(content) => {
                    self.preview_content = content;
                }
                Err(e) => {
                    self.preview_content = format!("Unable to preview file: {e}");
                }
            }
        }
    }

    pub fn scroll_preview(&mut self, delta: i32) {
        if delta < 0 {
            self.preview_scroll = self.preview_scroll.saturating_sub((-delta) as u16);
        } else {
            self.preview_scroll = self.preview_scroll.saturating_add(delta as u16);
        }
    }
}
