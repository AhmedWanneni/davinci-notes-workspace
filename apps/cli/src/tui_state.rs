use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Instant, SystemTime};

use crate::builtin_editor_buffer::EditorBuffer;
use crate::editor_config::{read_editor_settings, EditorMode};
use crate::fs_atomic::atomic_write_new;
use crate::tui_tree::{TreeNode, VisibleItem};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FocusPane {
    Tree,
    Editor,
    Preview,
    Search,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum VimMode {
    Normal,
    Insert,
    Command,
}

pub struct TuiState {
    pub vault_root: PathBuf,
    pub root_node: TreeNode,
    pub visible_items: Vec<VisibleItem>,
    pub selected_index: usize,
    pub tree_scroll: usize,
    pub current_file: Option<PathBuf>,
    pub editor_buffer: EditorBuffer,
    pub preview_content: String,
    pub is_dirty: bool,
    pub initial_mtime: Option<SystemTime>,
    pub editor_scroll: usize,
    pub vim_mode: VimMode,
    pub count_prefix: Option<usize>,
    pub pending_op: crate::vim_ops::PendingOp,
    pub yank_register: Option<crate::vim_motions::YankRegister>,
    pub command_input: String,
    pub search_query: String,
    pub focus_pane: FocusPane,
    pub is_fullscreen: bool,
    pub status_message: Option<String>,
    pub last_click: Option<(usize, Instant)>,
    pub should_quit: bool,
    pub editor_mode: EditorMode,
}

impl TuiState {
    pub fn new(vault_root: PathBuf) -> Self {
        let root_node = TreeNode::new_root(&vault_root);
        let settings = read_editor_settings();
        let editor_mode = settings.mode.unwrap_or(EditorMode::External);

        let mut state = Self {
            vault_root,
            root_node,
            visible_items: Vec::new(),
            selected_index: 0,
            tree_scroll: 0,
            current_file: None,
            editor_buffer: EditorBuffer::new(""),
            preview_content: String::new(),
            is_dirty: false,
            initial_mtime: None,
            editor_scroll: 0,
            vim_mode: VimMode::Normal,
            count_prefix: None,
            pending_op: crate::vim_ops::PendingOp::None,
            yank_register: None,
            command_input: String::new(),
            search_query: String::new(),
            focus_pane: FocusPane::Tree,
            is_fullscreen: false,
            status_message: None,
            last_click: None,
            should_quit: false,
            editor_mode,
        };
        state.refresh_visible();
        state.load_selected_file();
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
            self.visible_items = all_visible.into_iter()
                .filter(|item| matcher.fuzzy_match(&item.rel_path, query).is_some() || matcher.fuzzy_match(&item.name, query).is_some())
                .collect();
        }
        if self.visible_items.is_empty() { self.selected_index = 0; }
        else if self.selected_index >= self.visible_items.len() { self.selected_index = self.visible_items.len() - 1; }
    }

    pub fn selected_item(&self) -> Option<&VisibleItem> {
        self.visible_items.get(self.selected_index)
    }

    pub fn refresh_file(&mut self, path: &Path) {
        if let Some(current) = &self.current_file {
            if current == path {
                if let Ok(content) = fs::read_to_string(path) {
                    self.editor_buffer = EditorBuffer::new(&content);
                    self.preview_content = content;
                    self.is_dirty = false;
                    self.initial_mtime = fs::metadata(path).ok().and_then(|m| m.modified().ok());
                }
            }
        }
    }

    pub fn load_selected_file(&mut self) {
        if self.is_dirty {
            let _ = self.save_current_file();
        }
        let Some(item) = self.selected_item().cloned() else {
            self.current_file = None;
            self.editor_buffer = EditorBuffer::new("");
            self.preview_content.clear();
            return;
        };

        if item.is_dir {
            let count = fs::read_dir(&item.path).map(|e| e.count()).unwrap_or(0);
            let summary = format!("# 📁 Folder: {}\n\nItems in folder: {}\n\nPress Space to expand/collapse.", item.name, count);
            self.current_file = None; self.editor_buffer = EditorBuffer::new(&summary);
            self.preview_content = summary; self.is_dirty = false;
            self.initial_mtime = None; self.editor_scroll = 0;
        } else {
            let content = fs::read_to_string(&item.path).unwrap_or_default();
            self.initial_mtime = fs::metadata(&item.path).ok().and_then(|m| m.modified().ok());
            self.editor_buffer = EditorBuffer::new(&content);
            self.preview_content = content; self.current_file = Some(item.path);
            self.is_dirty = false; self.editor_scroll = 0; self.vim_mode = VimMode::Normal;
        }
    }

    pub fn update_preview(&mut self) {
        self.load_selected_file();
    }

    pub fn save_current_file(&mut self) -> Result<(), String> {
        let Some(path) = &self.current_file else { return Ok(()); };
        let content = self.editor_buffer.to_string();
        if let Err(e) = atomic_write_new(path, &content) {
            return Err(format!("Save failed: {e}"));
        }
        self.is_dirty = false;
        self.initial_mtime = fs::metadata(path).ok().and_then(|m| m.modified().ok());
        let name = path.file_name().unwrap_or_default().to_string_lossy();
        self.status_message = Some(format!("Saved {name}"));
        Ok(())
    }

    pub fn move_up(&mut self) {
        if self.selected_index > 0 { self.selected_index -= 1; self.load_selected_file(); }
    }

    pub fn move_down(&mut self) {
        if !self.visible_items.is_empty() && self.selected_index + 1 < self.visible_items.len() {
            self.selected_index += 1; self.load_selected_file();
        }
    }

    pub fn select_index(&mut self, idx: usize) {
        if idx < self.visible_items.len() && idx != self.selected_index {
            self.selected_index = idx; self.load_selected_file();
        }
    }

    pub fn toggle_current(&mut self) {
        let Some(item) = self.selected_item().cloned() else { return; };
        if item.is_dir {
            self.root_node.toggle_path(&item.path, &self.vault_root);
            self.refresh_visible();
        }
        self.load_selected_file();
    }

    pub fn toggle_fullscreen(&mut self) {
        self.is_fullscreen = !self.is_fullscreen;
        if self.is_fullscreen { self.focus_pane = FocusPane::Editor; }
    }

    pub fn adjust_tree_scroll(&mut self, visible_height: usize) {
        if visible_height == 0 { return; }
        if self.selected_index < self.tree_scroll {
            self.tree_scroll = self.selected_index;
        } else if self.selected_index >= self.tree_scroll + visible_height {
            self.tree_scroll = self.selected_index - visible_height + 1;
        }
    }

    pub fn adjust_editor_scroll(&mut self, visible_height: usize) {
        if visible_height == 0 { return; }
        let (cursor_line, _) = self.editor_buffer.cursor_line_col();
        if cursor_line < self.editor_scroll {
            self.editor_scroll = cursor_line;
        } else if cursor_line >= self.editor_scroll + visible_height {
            self.editor_scroll = cursor_line - visible_height + 1;
        }
    }
}
