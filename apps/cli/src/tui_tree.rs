use std::cmp::Ordering;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug)]
pub struct TreeNode {
    pub path: PathBuf,
    pub rel_path: String,
    pub name: String,
    pub is_dir: bool,
    pub is_expanded: bool,
    pub children: Option<Vec<TreeNode>>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VisibleItem {
    pub path: PathBuf,
    pub rel_path: String,
    pub name: String,
    pub is_dir: bool,
    pub is_expanded: bool,
    pub depth: usize,
}

fn should_ignore_name(name: &str) -> bool {
    name.starts_with('.') || name == "target" || name == "node_modules"
}

impl TreeNode {
    pub fn new_root(vault_root: &Path) -> Self {
        let mut root = Self {
            path: vault_root.to_path_buf(),
            rel_path: String::new(),
            name: vault_root
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "Vault".to_string()),
            is_dir: true,
            is_expanded: true,
            children: None,
        };
        root.load_children(vault_root);
        root
    }

    pub fn load_children(&mut self, vault_root: &Path) {
        if !self.is_dir {
            return;
        }

        let Ok(entries) = fs::read_dir(&self.path) else {
            self.children = Some(Vec::new());
            return;
        };

        let mut child_nodes = Vec::new();
        for entry_res in entries.flatten() {
            let file_name = entry_res.file_name().to_string_lossy().to_string();
            if should_ignore_name(&file_name) {
                continue;
            }

            let path = entry_res.path();
            let is_dir = path.is_dir();
            let rel_path = path
                .strip_prefix(vault_root)
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|_| file_name.clone());

            child_nodes.push(TreeNode {
                path,
                rel_path,
                name: file_name,
                is_dir,
                is_expanded: false,
                children: None,
            });
        }

        child_nodes.sort_by(|a, b| match (a.is_dir, b.is_dir) {
            (true, false) => Ordering::Less,
            (false, true) => Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        });

        self.children = Some(child_nodes);
    }

    pub fn flatten_visible(&self, depth: usize, out: &mut Vec<VisibleItem>) {
        let Some(children) = &self.children else {
            return;
        };

        for child in children {
            out.push(VisibleItem {
                path: child.path.clone(),
                rel_path: child.rel_path.clone(),
                name: child.name.clone(),
                is_dir: child.is_dir,
                is_expanded: child.is_expanded,
                depth,
            });

            if child.is_dir && child.is_expanded {
                child.flatten_visible(depth + 1, out);
            }
        }
    }

    pub fn toggle_path(&mut self, target_path: &Path, vault_root: &Path) -> bool {
        if self.path == target_path && self.is_dir {
            self.is_expanded = !self.is_expanded;
            if self.is_expanded && self.children.is_none() {
                self.load_children(vault_root);
            }
            return true;
        }

        if let Some(children) = &mut self.children {
            for child in children {
                if target_path.starts_with(&child.path)
                    && child.toggle_path(target_path, vault_root)
                {
                    return true;
                }
            }
        }

        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tree_lazy_loading() {
        let vault = std::env::temp_dir().join(format!("dn_tree_test_{}", std::process::id()));
        let sub = vault.join("Subfolder");
        let _ = fs::create_dir_all(&sub);
        let _ = fs::write(vault.join("RootNote.md"), "hello");
        let _ = fs::write(sub.join("NestedNote.md"), "world");

        let mut root = TreeNode::new_root(&vault);
        let mut visible = Vec::new();
        root.flatten_visible(0, &mut visible);

        // Subfolder is initially collapsed
        assert_eq!(visible.len(), 2);
        assert_eq!(visible[0].name, "Subfolder");
        assert!(!visible[0].is_expanded);
        assert_eq!(visible[1].name, "RootNote.md");

        // Toggle Subfolder
        root.toggle_path(&sub, &vault);
        visible.clear();
        root.flatten_visible(0, &mut visible);

        assert_eq!(visible.len(), 3);
        assert_eq!(visible[0].name, "Subfolder");
        assert!(visible[0].is_expanded);
        assert_eq!(visible[1].name, "NestedNote.md");
        assert_eq!(visible[1].depth, 1);

        let _ = fs::remove_dir_all(&vault);
    }
}
