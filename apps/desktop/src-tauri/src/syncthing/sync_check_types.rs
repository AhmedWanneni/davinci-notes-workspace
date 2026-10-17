use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SyncthingCheckItem {
  pub passed: bool,
  pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SyncthingRemoteConnectedItem {
  pub passed: bool,
  pub reason: String,
  pub connected_devices: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SyncthingFolderStateItem {
  pub passed: bool,
  pub reason: String,
  pub folder_id: Option<String>,
  pub state: Option<String>,
  pub out_of_sync_items: u32,
  pub remote_completions: HashMap<String, f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SyncthingFolderErrorsItem {
  pub passed: bool,
  pub reason: String,
  pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SyncthingSelfTestItem {
  pub passed: bool,
  pub reason: String,
  pub round_trip_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SyncthingCheckReport {
  pub reachability: SyncthingCheckItem,
  pub remote_connected: SyncthingRemoteConnectedItem,
  pub folder_state: SyncthingFolderStateItem,
  pub folder_errors: SyncthingFolderErrorsItem,
  pub self_test: SyncthingSelfTestItem,
}

impl SyncthingCheckReport {
  pub fn unreachable(reachability: SyncthingCheckItem) -> Self {
    Self {
      reachability,
      remote_connected: SyncthingRemoteConnectedItem {
        passed: false,
        reason: "Skipped: Syncthing unreachable".into(),
        connected_devices: Vec::new(),
      },
      folder_state: SyncthingFolderStateItem {
        passed: false,
        reason: "Skipped: Syncthing unreachable".into(),
        folder_id: None,
        state: None,
        out_of_sync_items: 0,
        remote_completions: HashMap::new(),
      },
      folder_errors: SyncthingFolderErrorsItem {
        passed: false,
        reason: "Skipped: Syncthing unreachable".into(),
        errors: Vec::new(),
      },
      self_test: SyncthingSelfTestItem {
        passed: false,
        reason: "Skipped: Syncthing unreachable".into(),
        round_trip_ms: None,
      },
    }
  }
}
