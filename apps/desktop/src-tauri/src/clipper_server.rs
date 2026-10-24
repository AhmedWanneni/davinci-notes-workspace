//! The loopback clipper receiver: bind, authenticate, validate, hand off.
//!
//! Lifecycle is lazy (ADR-0173): nothing binds until the user enables the Web
//! Clipper, so the disabled cost is exactly zero — no socket, no thread
//! (PERFORMANCE.md rule 9). Stopping is event-driven, not a poll loop: the
//! accept thread is woken by a single throwaway connection.

use std::collections::HashMap;
use std::net::{Ipv4Addr, TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};

use serde::Serialize;
use tauri::AppHandle;

use crate::clipper_auth::{ensure_token, rotate_token, ClipTokenStore, KeychainClipTokenStore};
use crate::clipper_dispatch::{ClipDispatcher, PendingClips, WebviewClipDispatcher};
use crate::clipper_payload::ClipAck;
use crate::clipper_routes::handle_connection;

/// Preferred per-install port. Below the ephemeral range so it is not recycled
/// out from under us, and reported to the user for manual pairing (decision O5).
pub const CLIPPER_DEFAULT_PORT: u16 = 47912;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipperStatus {
  pub enabled: bool,
  pub port: Option<u16>,
  pub paired: bool,
  pub default_port: u16,
}

struct ClipperListener {
  port: u16,
  stop: Arc<AtomicBool>,
  handle: JoinHandle<()>,
}

pub struct ClipperState {
  enabled: AtomicBool,
  active_token: Arc<Mutex<Option<String>>>,
  listener: Mutex<Option<ClipperListener>>,
  tokens: Arc<dyn ClipTokenStore>,
  pending: PendingClips,
}

impl ClipperState {
  pub fn new() -> Self {
    Self::with_token_store(Arc::new(KeychainClipTokenStore))
  }

  pub fn with_token_store(tokens: Arc<dyn ClipTokenStore>) -> Self {
    Self {
      enabled: AtomicBool::new(false),
      active_token: Arc::new(Mutex::new(None)),
      listener: Mutex::new(None),
      tokens,
      pending: Arc::new(Mutex::new(HashMap::new())),
    }
  }

  /// Load or create the token and make it the one the listener accepts.
  pub fn arm_token(&self) -> Result<String, String> {
    let token = ensure_token(&*self.tokens)?;
    self.cache_token(Some(token.clone()))?;
    Ok(token)
  }

  /// Replace the token; the previous value stops authenticating immediately.
  pub fn rotate_token(&self) -> Result<String, String> {
    let token = rotate_token(&*self.tokens)?;
    self.cache_token(Some(token.clone()))?;
    Ok(token)
  }

  /// Forget the token entirely (disables pairing).
  pub fn revoke_token(&self) -> Result<(), String> {
    self.cache_token(None)?;
    self.tokens.clear()
  }

  /// The webview reporting the outcome of a dispatched clip (ADR-0177/0178).
  pub fn submit_result(&self, ack: &ClipAck) -> Result<(), String> {
    let waiting = self
      .pending
      .lock()
      .map_err(|_| "clipper pending lock poisoned".to_string())?
      .remove(&ack.clip_id);
    match waiting {
      Some(sender) => {
        let _ = sender.send(ack.clone());
        Ok(())
      }
      None => Err("no clip is waiting for that result".to_string()),
    }
  }

  pub fn status(&self) -> Result<ClipperStatus, String> {
    let port = self
      .listener
      .lock()
      .map_err(|_| "clipper listener lock poisoned".to_string())?
      .as_ref()
      .map(|listener| listener.port);
    let paired = self
      .tokens
      .load()?
      .map(|token| !token.is_empty())
      .unwrap_or(false);
    Ok(ClipperStatus {
      enabled: self.enabled.load(Ordering::SeqCst),
      port,
      paired,
      default_port: CLIPPER_DEFAULT_PORT,
    })
  }

  fn cache_token(&self, token: Option<String>) -> Result<(), String> {
    *self
      .active_token
      .lock()
      .map_err(|_| "clipper token lock poisoned".to_string())? = token;
    Ok(())
  }
}

impl Default for ClipperState {
  fn default() -> Self {
    Self::new()
  }
}

/// Bind loopback only. Falls back to an ephemeral port if the preferred one is
/// taken; the actual port is always reported back for pairing.
pub fn bind_loopback(preferred: u16) -> std::io::Result<TcpListener> {
  match TcpListener::bind((Ipv4Addr::LOCALHOST, preferred)) {
    Ok(listener) => Ok(listener),
    Err(_) => TcpListener::bind((Ipv4Addr::LOCALHOST, 0)),
  }
}

/// Start (or restart) the listener. Returns the bound port.
pub fn start_listener(app: AppHandle, state: &ClipperState) -> Result<u16, String> {
  stop_listener(state);
  let listener = bind_loopback(CLIPPER_DEFAULT_PORT)
    .map_err(|error| format!("could not bind the clipper listener: {error}"))?;
  let port = listener
    .local_addr()
    .map_err(|error| error.to_string())?
    .port();

  let stop = Arc::new(AtomicBool::new(false));
  let dispatcher: Arc<dyn ClipDispatcher> =
    Arc::new(WebviewClipDispatcher::new(app, state.pending.clone()));
  let active_token = state.active_token.clone();
  let server_stop = stop.clone();
  let handle = thread::spawn(move || serve(listener, port, server_stop, active_token, dispatcher));

  *state
    .listener
    .lock()
    .map_err(|_| "clipper listener lock poisoned".to_string())? = Some(ClipperListener {
    port,
    stop,
    handle,
  });
  state.enabled.store(true, Ordering::SeqCst);
  Ok(port)
}

/// Stop the listener and wait for its thread to finish. Safe to call when idle.
pub fn stop_listener(state: &ClipperState) {
  let taken = state.listener.lock().ok().and_then(|mut guard| guard.take());
  if let Some(listener) = taken {
    listener.stop.store(true, Ordering::SeqCst);
    // Wake the blocked `accept()` with one throwaway connection instead of
    // polling a timeout flag.
    let _ = TcpStream::connect((Ipv4Addr::LOCALHOST, listener.port));
    let _ = listener.handle.join();
  }
  state.enabled.store(false, Ordering::SeqCst);
}

fn serve(
  listener: TcpListener,
  port: u16,
  stop: Arc<AtomicBool>,
  active_token: Arc<Mutex<Option<String>>>,
  dispatcher: Arc<dyn ClipDispatcher>,
) {
  for incoming in listener.incoming() {
    if stop.load(Ordering::SeqCst) {
      break;
    }
    let Ok(mut stream) = incoming else {
      continue;
    };
    handle_connection(&mut stream, port, &active_token, &*dispatcher);
  }
}
