use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::{channel, Receiver};

pub struct VaultWatcher {
    _watcher: RecommendedWatcher,
    rx: Receiver<notify::Result<Event>>,
}

impl VaultWatcher {
    pub fn new(vault_root: &Path) -> Result<Self, notify::Error> {
        let (tx, rx) = channel();
        let mut watcher = notify::recommended_watcher(move |res| {
            let _ = tx.send(res);
        })?;

        watcher.watch(vault_root, RecursiveMode::Recursive)?;

        Ok(Self {
            _watcher: watcher,
            rx,
        })
    }

    pub fn has_external_changes(&self) -> bool {
        let mut changed = false;
        while let Ok(event_res) = self.rx.try_recv() {
            if let Ok(event) = event_res {
                for path in event.paths {
                    let file_name = path
                        .file_name()
                        .map(|n| n.to_string_lossy())
                        .unwrap_or_default();

                    // Ignore temp files and hidden dotfiles
                    if !file_name.starts_with(".dn-tmp")
                        && !file_name.starts_with('.')
                        && path.extension().and_then(|s| s.to_str()) == Some("md")
                    {
                        changed = true;
                    }
                }
            }
        }
        changed
    }
}
