use rusqlite::{Connection, OpenFlags};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedBrowserInfo {
  pub id: String,
  pub name: String,
  pub available: bool,
  pub profile_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawExportedLink {
  pub url: String,
  pub title: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub folder: Option<String>,
  pub added_at: i64,
}

fn home_dir() -> Option<PathBuf> {
  std::env::var_os("HOME")
    .or_else(|| std::env::var_os("USERPROFILE"))
    .map(PathBuf::from)
}

fn chromium_base_dir(browser_id: &str) -> Option<PathBuf> {
  let home = home_dir()?;
  #[cfg(target_os = "macos")]
  {
    let app_support = home.join("Library").join("Application Support");
    return match browser_id {
      "chrome" => Some(app_support.join("Google").join("Chrome")),
      "brave" => Some(app_support.join("BraveSoftware").join("Brave-Browser")),
      "edge" => Some(app_support.join("Microsoft Edge")),
      "arc" => Some(app_support.join("Arc").join("User Data")),
      "vivaldi" => Some(app_support.join("Vivaldi")),
      "chromium" => Some(app_support.join("Chromium")),
      _ => None,
    };
  }
  #[cfg(target_os = "windows")]
  {
    let local = std::env::var_os("LOCALAPPDATA")
      .map(PathBuf::from)
      .unwrap_or_else(|| home.join("AppData").join("Local"));
    return match browser_id {
      "chrome" => Some(local.join("Google").join("Chrome").join("User Data")),
      "brave" => Some(local.join("BraveSoftware").join("Brave-Browser").join("User Data")),
      "edge" => Some(local.join("Microsoft").join("Edge").join("User Data")),
      "arc" => Some(local.join("Arc").join("User Data")),
      "vivaldi" => Some(local.join("Vivaldi").join("User Data")),
      "chromium" => Some(local.join("Chromium").join("User Data")),
      _ => None,
    };
  }
  #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
  {
    let config = home.join(".config");
    return match browser_id {
      "chrome" => Some(config.join("google-chrome")),
      "brave" => Some(config.join("BraveSoftware").join("Brave-Browser")),
      "edge" => Some(config.join("microsoft-edge")),
      "vivaldi" => Some(config.join("vivaldi")),
      "chromium" => Some(config.join("chromium")),
      _ => None,
    };
  }
}

fn find_chromium_bookmark_files(base_dir: &Path) -> Vec<PathBuf> {
  let mut files = Vec::new();
  if !base_dir.is_dir() {
    return files;
  }
  let default_file = base_dir.join("Default").join("Bookmarks");
  if default_file.is_file() {
    files.push(default_file);
  }
  if let Ok(entries) = fs::read_dir(base_dir) {
    for entry in entries.flatten() {
      let path = entry.path();
      let name = entry.file_name().to_string_lossy().to_string();
      if path.is_dir() && name.starts_with("Profile ") {
        let candidate = path.join("Bookmarks");
        if candidate.is_file() {
          files.push(candidate);
        }
      }
    }
  }
  files
}

fn firefox_profiles_dir() -> Option<PathBuf> {
  let home = home_dir()?;
  #[cfg(target_os = "macos")]
  return Some(home.join("Library/Application Support/Firefox/Profiles"));
  #[cfg(target_os = "windows")]
  {
    let appdata = std::env::var_os("APPDATA")
      .map(PathBuf::from)
      .unwrap_or_else(|| home.join("AppData/Roaming"));
    return Some(appdata.join("Mozilla/Firefox/Profiles"));
  }
  #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
  return Some(home.join(".mozilla/firefox"));
}

fn find_firefox_places_files() -> Vec<PathBuf> {
  let mut files = Vec::new();
  let Some(profiles_dir) = firefox_profiles_dir() else {
    return files;
  };
  if let Ok(entries) = fs::read_dir(profiles_dir) {
    for entry in entries.flatten() {
      let candidate = entry.path().join("places.sqlite");
      if candidate.is_file() {
        files.push(candidate);
      }
    }
  }
  files
}

fn read_firefox_places(places_path: &Path) -> Result<Vec<RawExportedLink>, String> {
  let temp_path = std::env::temp_dir().join(format!(
    "davinci_ff_places_{}.sqlite",
    std::process::id()
  ));
  fs::copy(places_path, &temp_path).map_err(|e| format!("Failed to copy places.sqlite: {e}"))?;

  let mut links = Vec::new();
  if let Ok(conn) = Connection::open_with_flags(&temp_path, OpenFlags::SQLITE_OPEN_READ_ONLY) {
    let sql = "
      SELECT p.url, COALESCE(b.title, p.title, p.url), COALESCE(parent.title, ''), b.dateAdded
      FROM moz_bookmarks b
      JOIN moz_places p ON b.fk = p.id
      LEFT JOIN moz_bookmarks parent ON b.parent = parent.id
      WHERE b.type = 1 AND (p.url LIKE 'http://%' OR p.url LIKE 'https://%')
    ";
    if let Ok(mut stmt) = conn.prepare(sql) {
      if let Ok(rows) = stmt.query_map([], |row| {
        let url: String = row.get(0)?;
        let title: String = row.get(1)?;
        let folder_raw: String = row.get(2)?;
        let date_added: Option<i64> = row.get(3).ok();
        let folder = if folder_raw.trim().is_empty() { None } else { Some(folder_raw) };
        Ok(RawExportedLink {
          url,
          title,
          folder,
          added_at: date_added.map(|d| d / 1000).unwrap_or(0),
        })
      }) {
        for r in rows.flatten() {
          links.push(r);
        }
      }
    }
  }
  let _ = fs::remove_file(&temp_path);
  Ok(links)
}

#[tauri::command]
pub fn detect_browser_bookmarks() -> Vec<DetectedBrowserInfo> {
  let specs = [
    ("chrome", "Google Chrome"),
    ("brave", "Brave"),
    ("firefox", "Firefox"),
    ("arc", "Arc"),
    ("edge", "Microsoft Edge"),
    ("vivaldi", "Vivaldi"),
  ];
  specs
    .iter()
    .map(|(id, name)| {
      let count = if *id == "firefox" {
        find_firefox_places_files().len()
      } else {
        chromium_base_dir(id)
          .map(|dir| find_chromium_bookmark_files(&dir).len())
          .unwrap_or(0)
      };
      DetectedBrowserInfo {
        id: (*id).to_string(),
        name: (*name).to_string(),
        available: count > 0,
        profile_count: count,
      }
    })
    .collect()
}

#[tauri::command]
pub fn read_browser_bookmarks(browser_id: String) -> Result<String, String> {
  let clean_id = browser_id.trim().to_lowercase();
  if clean_id == "firefox" {
    let files = find_firefox_places_files();
    if files.is_empty() {
      return Err("No Firefox profile with bookmarks was found on this computer.".into());
    }
    let mut all_links = Vec::new();
    for file in files {
      if let Ok(mut links) = read_firefox_places(&file) {
        all_links.append(&mut links);
      }
    }
    return serde_json::to_string(&all_links).map_err(|e| e.to_string());
  }

  let base_dir = chromium_base_dir(&clean_id)
    .ok_or_else(|| format!("Unsupported browser: {clean_id}"))?;
  let files = find_chromium_bookmark_files(&base_dir);
  if files.is_empty() {
    return Err(format!("No bookmarks file was found for {browser_id} on this computer."));
  }
  if files.len() == 1 {
    return fs::read_to_string(&files[0]).map_err(|e| e.to_string());
  }

  let mut combined = Vec::new();
  for file in files {
    if let Ok(raw) = fs::read_to_string(&file) {
      if let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) {
        combined.push(val);
      }
    }
  }
  serde_json::to_string(&combined).map_err(|e| e.to_string())
}
