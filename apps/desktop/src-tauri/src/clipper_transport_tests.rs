//! Transport tests: request shape, host, origin and size limits (plan §5, Phase 3).
//!
//! Each drives a **real loopback socket** through `handle_connection` with a
//! recording dispatcher in place of the webview, so every assertion is against
//! the actual bytes the extension would receive.
//!
//! Not covered here, and deliberately so: "reachable from another interface"
//! needs a second host on the network, the idle RSS/CPU delta is owner-local,
//! and the emit-and-await handshake's happy path needs a live webview.

use std::net::{Ipv4Addr, TcpListener};
use std::sync::Arc;

use crate::clipper_routes::CLIP_ROUTE;
use crate::clipper_server::bind_loopback;
use crate::clipper_test_harness::{body_json, clip_json, exchange, ClipRequest, RecordingDispatcher, TOKEN};
use crate::clipper_validate::MAX_HEADER_BYTES;

#[test]
fn accepts_a_well_formed_clip() {
  let dispatcher = RecordingDispatcher::writing();
  let payload = clip_json("My Note.md", "Clippings");
  let (status, body) = exchange(
    |port| ClipRequest::post(&payload).render(port),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 200);
  assert_eq!(body_json(&body)["status"], "written");
  assert_eq!(body_json(&body)["path"], "Clippings/My Note.md");
  assert_eq!(dispatcher.dispatched(), vec!["Clippings/My Note.md"]);
}

#[test]
fn refuses_everything_when_no_token_is_paired() {
  let dispatcher = RecordingDispatcher::writing();
  let payload = clip_json("Note.md", "");
  let (status, _) = exchange(
    |port| ClipRequest::post(&payload).render(port),
    None,
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 401);
  assert!(dispatcher.dispatched().is_empty());
}

#[test]
fn refuses_a_wrong_token() {
  let dispatcher = RecordingDispatcher::writing();
  let payload = clip_json("Note.md", "");
  let (status, body) = exchange(
    |port| {
      ClipRequest::post(&payload)
        .with_authorization("Bearer 0000000000000000000000000000000000000000000000000000000000000000")
        .render(port)
    },
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 401);
  assert_eq!(body_json(&body)["error"], "unauthorized");
  assert!(dispatcher.dispatched().is_empty());
}

#[test]
fn refuses_a_foreign_origin() {
  let dispatcher = RecordingDispatcher::writing();
  let payload = clip_json("Note.md", "");
  let (status, _) = exchange(
    |port| {
      ClipRequest::post(&payload)
        .with_origin("https://evil.example")
        .render(port)
    },
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 403);
  assert!(dispatcher.dispatched().is_empty());
}

#[test]
fn allows_an_extension_origin_and_no_origin() {
  for origin in [
    Some("chrome-extension://abcdefghijklmnop"),
    Some("moz-extension://x"),
    None,
  ] {
    let dispatcher = RecordingDispatcher::writing();
    let payload = clip_json("Note.md", "");
    let (status, _) = exchange(
      |port| match origin {
        Some(origin) => ClipRequest::post(&payload).with_origin(origin).render(port),
        None => ClipRequest::post(&payload).render(port),
      },
      Some(TOKEN),
      Arc::clone(&dispatcher),
    );
    assert_eq!(status, 200, "origin {origin:?}");
  }
}

#[test]
fn refuses_a_rebound_host_header() {
  for host in ["localhost", "127.0.0.1.evil", "evil.example"] {
    let dispatcher = RecordingDispatcher::writing();
    let payload = clip_json("Note.md", "");
    let (status, _) = exchange(
      |port| {
        ClipRequest::post(&payload)
          .with_host(&format!("{host}:{port}"))
          .render(port)
      },
      Some(TOKEN),
      Arc::clone(&dispatcher),
    );
    assert_eq!(status, 403, "host {host}");
    assert!(dispatcher.dispatched().is_empty());
  }
}

#[test]
fn refuses_an_oversized_body_before_buffering_it() {
  let dispatcher = RecordingDispatcher::writing();
  // Declare 5 MiB but send none of it: the cap is checked against the header,
  // so the body is never buffered and no partial write can happen.
  let oversized = format!(
    "POST {CLIP_ROUTE} HTTP/1.1\r\nHost: 127.0.0.1:0\r\nContent-Length: {}\r\n\r\n",
    5 * 1024 * 1024
  );
  let (status, body) = exchange(
    |port| oversized.replace("127.0.0.1:0", &format!("127.0.0.1:{port}")),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 413);
  assert_eq!(body_json(&body)["error"], "too-large");
  assert!(dispatcher.dispatched().is_empty());
}

#[test]
fn refuses_a_header_flood() {
  let dispatcher = RecordingDispatcher::writing();
  // Exactly the cap with no header terminator: the server consumes all of it,
  // then refuses on size. A larger flood is refused too, but the server may
  // reset the connection rather than answer, because it refuses to drain
  // hostile input.
  let (status, body) = exchange(
    |port| {
      let prefix = format!("POST {CLIP_ROUTE} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nX-Filler: ");
      let mut flood = prefix.clone();
      flood.push_str(&"a".repeat(MAX_HEADER_BYTES - prefix.len()));
      flood
    },
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 413);
  assert_eq!(body_json(&body)["error"], "too-large");
  assert!(dispatcher.dispatched().is_empty());
}

#[test]
fn refuses_a_wrong_method_route_or_json() {
  let dispatcher = RecordingDispatcher::writing();
  let payload = clip_json("Note.md", "");

  let (method_status, _) = exchange(
    |port| ClipRequest::post(&payload).with_method("GET").render(port),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );
  assert_eq!(method_status, 405);

  let (route_status, _) = exchange(
    |port| ClipRequest::post(&payload).with_route("/clipper/other").render(port),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );
  assert_eq!(route_status, 404);

  let (json_status, _) = exchange(
    |port| ClipRequest::post("{ not json").render(port),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );
  assert_eq!(json_status, 400);

  // `deny_unknown_fields`: an extra key is a rejection, not a free ride.
  let extra = clip_json("Note.md", "").replace("\"version\":1", "\"version\":1,\"smuggled\":true");
  let (unknown_status, _) = exchange(
    |port| ClipRequest::post(&extra).render(port),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );
  assert_eq!(unknown_status, 400);

  assert!(dispatcher.dispatched().is_empty());
}

#[test]
fn refuses_a_truncated_body() {
  let dispatcher = RecordingDispatcher::writing();
  // Claim 500 bytes, send 5, then close: never a silently short read.
  let truncated =
    format!("POST {CLIP_ROUTE} HTTP/1.1\r\nHost: 127.0.0.1:0\r\nContent-Length: 500\r\n\r\nhello");
  let (status, _) = exchange(
    |port| truncated.replace("127.0.0.1:0", &format!("127.0.0.1:{port}")),
    Some(TOKEN),
    Arc::clone(&dispatcher),
  );

  assert_eq!(status, 400);
  assert!(dispatcher.dispatched().is_empty());
}

#[test]
fn binding_is_loopback_only_and_falls_back_off_a_taken_port() {
  let fresh = bind_loopback(0).expect("bind ephemeral");
  assert_eq!(fresh.local_addr().expect("addr").ip(), Ipv4Addr::LOCALHOST);
  drop(fresh);

  let held = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).expect("hold a port");
  let held_port = held.local_addr().expect("addr").port();
  let fallback = bind_loopback(held_port).expect("fall back");
  assert_eq!(fallback.local_addr().expect("addr").ip(), Ipv4Addr::LOCALHOST);
  assert_ne!(fallback.local_addr().expect("addr").port(), held_port);
}
