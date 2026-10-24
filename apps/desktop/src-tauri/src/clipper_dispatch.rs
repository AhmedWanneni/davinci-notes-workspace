//! Handing a validated clip to the main webview and waiting for its verdict.
//!
//! Rust does not write note content (ADR-0177). It asks the webview to write
//! through the canonical path and blocks until the webview reports back, so the
//! HTTP response to the extension can carry the *real* outcome rather than an
//! optimistic one.

use std::collections::HashMap;
use std::sync::mpsc::{sync_channel, SyncSender};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tauri::{AppHandle, Emitter};

use crate::clipper_payload::{ClipAck, ClipError, ClipReceivedEvent};
use crate::clipper_validate::ValidatedClip;

/// Event the main webview listens for; it performs the write (ADR-0177).
pub const CLIPPER_EVENT: &str = "clipper:clip-received";
/// How long a dispatched clip may wait for the webview to report back.
pub const DISPATCH_TIMEOUT: Duration = Duration::from_secs(20);

/// The webview is the only writer, so the listener asks it what happened.
pub trait ClipDispatcher: Send + Sync + 'static {
  fn dispatch(&self, clip: &ValidatedClip) -> ClipAck;
}

/// Clips waiting for a verdict, keyed by `clipId` (ADR-0178 correlates on it).
pub type PendingClips = Arc<Mutex<HashMap<String, SyncSender<ClipAck>>>>;

/// Default dispatcher: emit to the main window, then wait for `clipper_submit_result`.
pub struct WebviewClipDispatcher {
  app: AppHandle,
  pending: PendingClips,
}

impl WebviewClipDispatcher {
  pub fn new(app: AppHandle, pending: PendingClips) -> Self {
    Self { app, pending }
  }

  fn forget(pending: &Mutex<HashMap<String, SyncSender<ClipAck>>>, clip_id: &str) {
    if let Ok(mut pending) = pending.lock() {
      pending.remove(clip_id);
    }
  }
}

impl ClipDispatcher for WebviewClipDispatcher {
  fn dispatch(&self, clip: &ValidatedClip) -> ClipAck {
    let clip_id = clip.payload.clip_id.clone();
    let event = ClipReceivedEvent {
      clip_id: clip_id.clone(),
      payload: clip.payload.clone(),
      relative_path: clip.relative_path.clone(),
    };

    let (sender, receiver) = sync_channel(1);
    match self.pending.lock() {
      Ok(mut pending) => {
        pending.insert(clip_id.clone(), sender);
      }
      Err(_) => return ClipAck::rejected(clip_id, ClipError::AppBusy),
    }

    if let Err(error) = self.app.emit_to(crate::tray::MAIN_WINDOW, CLIPPER_EVENT, event) {
      log::warn!("clipper: could not deliver a clip to the main window: {error}");
      Self::forget(&self.pending, &clip_id);
      return ClipAck::rejected(clip_id, ClipError::AppBusy);
    }

    match receiver.recv_timeout(DISPATCH_TIMEOUT) {
      Ok(ack) => ack,
      Err(_) => {
        // The clip stays in the extension queue (ADR-0178), so a timeout is
        // never data loss — the extension simply retries on its next event.
        Self::forget(&self.pending, &clip_id);
        ClipAck::rejected(clip_id, ClipError::AppBusy)
      }
    }
  }
}
