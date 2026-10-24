//! The one route the clipper listener serves, and every check in front of it.
//!
//! Order matters: refuse a bad request shape, then a bad host, then a bad
//! origin, then a bad token — and only then parse the payload at all. Nothing
//! from the payload is read before the token has been checked, so a
//! `Content-Length` claim is never trusted as a reason to buffer.

use std::net::TcpStream;
use std::sync::Mutex;

use crate::clipper_auth::tokens_match;
use crate::clipper_dispatch::ClipDispatcher;
use crate::clipper_http::{read_request, write_response, HttpReadError, HttpRequest};
use crate::clipper_payload::{ClipAck, ClipAckStatus, ClipError, ClipPayload};
use crate::clipper_validate::validate_clip;

/// The only route served.
pub const CLIP_ROUTE: &str = "/clipper/clip";

fn is_extension_origin(origin: &str) -> bool {
  origin.starts_with("chrome-extension://") || origin.starts_with("moz-extension://")
}

fn authorized(request: &HttpRequest, active_token: &Mutex<Option<String>>) -> bool {
  let Some(provided) = request
    .header("authorization")
    .and_then(|value| value.strip_prefix("Bearer "))
  else {
    return false;
  };
  let expected = active_token.lock().ok().and_then(|guard| guard.clone());
  match expected {
    Some(expected) if !expected.is_empty() => tokens_match(provided, &expected),
    _ => false,
  }
}

fn status_for_ack(ack: &ClipAck) -> u16 {
  match ack.status {
    ClipAckStatus::Written | ClipAckStatus::Queued => 200,
    ClipAckStatus::Rejected => match ack.error {
      Some(ClipError::VaultNotOpen) => 409,
      Some(ClipError::AppBusy) | None => 503,
      Some(_) => 422,
    },
  }
}

fn respond_rejection(stream: &mut TcpStream, status: u16, clip_id: &str, error: ClipError) {
  let body = serde_json::to_string(&ClipAck::rejected(clip_id, error)).unwrap_or_default();
  let _ = write_response(stream, status, &body);
}

/// Serve exactly one request on `stream`. Reached from `clipper_server::serve`
/// and, in tests, directly — which is what makes the attack matrix cheap.
pub(crate) fn handle_connection(
  stream: &mut TcpStream,
  port: u16,
  active_token: &Mutex<Option<String>>,
  dispatcher: &dyn ClipDispatcher,
) {
  let request = match read_request(stream) {
    Ok(request) => request,
    Err(HttpReadError::TooLarge) => return respond_rejection(stream, 413, "", ClipError::TooLarge),
    Err(HttpReadError::Io(_) | HttpReadError::Malformed) => {
      return respond_rejection(stream, 400, "", ClipError::InvalidPayload)
    }
  };

  if request.method != "POST" {
    return respond_rejection(stream, 405, "", ClipError::InvalidPayload);
  }
  if request.target != CLIP_ROUTE {
    return respond_rejection(stream, 404, "", ClipError::InvalidPayload);
  }

  // An exact host match defends against DNS rebinding: `localhost`,
  // `127.0.0.1.evil` and any other spelling is refused.
  let expected_host = format!("127.0.0.1:{port}");
  if request.header("host") != Some(expected_host.as_str()) {
    return respond_rejection(stream, 403, "", ClipError::Unauthorized);
  }

  // Defence in depth only: the token is the boundary, the origin is browser
  // hardening. A non-browser client can forge an origin but not the token.
  if let Some(origin) = request.header("origin") {
    if !is_extension_origin(origin) {
      return respond_rejection(stream, 403, "", ClipError::Unauthorized);
    }
  }

  if !authorized(&request, active_token) {
    return respond_rejection(stream, 401, "", ClipError::Unauthorized);
  }

  let payload = match serde_json::from_slice::<ClipPayload>(&request.body) {
    Ok(payload) => payload,
    Err(_) => return respond_rejection(stream, 400, "", ClipError::InvalidPayload),
  };

  let clip = match validate_clip(&payload) {
    Ok(clip) => clip,
    Err(rejection) => {
      return respond_rejection(stream, rejection.http_status(), &payload.clip_id, rejection.error())
    }
  };

  let ack = dispatcher.dispatch(&clip);
  let status = status_for_ack(&ack);
  let body = serde_json::to_string(&ack).unwrap_or_default();
  let _ = write_response(stream, status, &body);
}
