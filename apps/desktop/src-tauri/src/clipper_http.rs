//! Just enough HTTP to serve one authenticated route on loopback (ADR-0173).
//!
//! This is deliberately hand-rolled rather than an HTTP framework: the server
//! answers exactly one route for one client (the extension) and an HTTP stack is
//! a large dependency for that (PERFORMANCE.md rule 1). It mirrors the OAuth
//! loopback reader in `oauth.rs`, with the two flaws that matter fixed:
//!
//! 1. the body is read against a hard cap and a declared `Content-Length`, so a
//!    large request is refused (413) *before* it is buffered, and
//! 2. a truncated body is an error, never a silently short read.

use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::Duration;

use crate::clipper_validate::{MAX_BODY_BYTES, MAX_HEADER_BYTES};

pub const READ_TIMEOUT: Duration = Duration::from_secs(15);
pub const WRITE_TIMEOUT: Duration = Duration::from_secs(15);

const READ_CHUNK: usize = 8192;
const HEADER_TERMINATOR: &[u8] = b"\r\n\r\n";

#[derive(Debug)]
pub struct HttpRequest {
  pub method: String,
  pub target: String,
  /// Header names are lowercased; values keep their original casing.
  pub headers: Vec<(String, String)>,
  pub body: Vec<u8>,
}

impl HttpRequest {
  pub fn header(&self, name: &str) -> Option<&str> {
    self
      .headers
      .iter()
      .find(|(key, _)| key == name)
      .map(|(_, value)| value.as_str())
  }
}

#[derive(Debug, PartialEq, Eq)]
pub enum HttpReadError {
  /// The request head or the declared body exceeds its cap.
  TooLarge,
  /// Not a complete, well-formed request.
  Malformed,
  Io(String),
}

fn find_header_end(buffer: &[u8]) -> Option<usize> {
  buffer
    .windows(HEADER_TERMINATOR.len())
    .position(|window| window == HEADER_TERMINATOR)
}

/// Read one request, refusing anything that exceeds the caps.
pub fn read_request(stream: &mut TcpStream) -> Result<HttpRequest, HttpReadError> {
  stream
    .set_read_timeout(Some(READ_TIMEOUT))
    .map_err(|error| HttpReadError::Io(error.to_string()))?;

  let mut buffer: Vec<u8> = Vec::with_capacity(READ_CHUNK);
  let mut chunk = [0_u8; READ_CHUNK];

  let header_end = loop {
    if let Some(index) = find_header_end(&buffer) {
      break index;
    }
    if buffer.len() >= MAX_HEADER_BYTES {
      return Err(HttpReadError::TooLarge);
    }
    let count = stream
      .read(&mut chunk)
      .map_err(|error| HttpReadError::Io(error.to_string()))?;
    if count == 0 {
      return Err(HttpReadError::Malformed);
    }
    buffer.extend_from_slice(&chunk[..count]);
  };

  let head = std::str::from_utf8(&buffer[..header_end]).map_err(|_| HttpReadError::Malformed)?;
  let mut lines = head.split("\r\n");
  let request_line = lines.next().ok_or(HttpReadError::Malformed)?;
  let mut parts = request_line.split(' ');
  let method = parts.next().ok_or(HttpReadError::Malformed)?.to_string();
  let target = parts.next().ok_or(HttpReadError::Malformed)?.to_string();
  let version = parts.next().ok_or(HttpReadError::Malformed)?;
  if !version.starts_with("HTTP/1.") || parts.next().is_some() {
    return Err(HttpReadError::Malformed);
  }

  let mut headers = Vec::new();
  for line in lines {
    if line.is_empty() {
      continue;
    }
    let (name, value) = line.split_once(':').ok_or(HttpReadError::Malformed)?;
    headers.push((name.trim().to_ascii_lowercase(), value.trim().to_string()));
  }

  let declared = headers
    .iter()
    .find(|(key, _)| key == "content-length")
    .map(|(_, value)| value.parse::<usize>().map_err(|_| HttpReadError::Malformed))
    .transpose()?
    .unwrap_or(0);
  // Refuse an oversized body before a single body byte is buffered.
  if declared > MAX_BODY_BYTES {
    return Err(HttpReadError::TooLarge);
  }

  let body_start = header_end + HEADER_TERMINATOR.len();
  let mut body = buffer[body_start..].to_vec();
  body.truncate(declared);
  while body.len() < declared {
    let wanted = (declared - body.len()).min(READ_CHUNK);
    let count = stream
      .read(&mut chunk[..wanted])
      .map_err(|error| HttpReadError::Io(error.to_string()))?;
    if count == 0 {
      return Err(HttpReadError::Malformed);
    }
    body.extend_from_slice(&chunk[..count]);
  }

  Ok(HttpRequest {
    method,
    target,
    headers,
    body,
  })
}

pub fn status_text(status: u16) -> &'static str {
  match status {
    200 => "OK",
    400 => "Bad Request",
    401 => "Unauthorized",
    403 => "Forbidden",
    404 => "Not Found",
    405 => "Method Not Allowed",
    413 => "Payload Too Large",
    422 => "Unprocessable Entity",
    503 => "Service Unavailable",
    _ => "Error",
  }
}

/// Write a JSON response and close the connection.
pub fn write_response(stream: &mut TcpStream, status: u16, body: &str) -> std::io::Result<()> {
  stream.set_write_timeout(Some(WRITE_TIMEOUT))?;
  let response = format!(
    "HTTP/1.1 {status} {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
    status_text(status),
    body.len()
  );
  stream.write_all(response.as_bytes())?;
  stream.flush()
}
