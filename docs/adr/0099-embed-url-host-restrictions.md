# ADR-0099: Embed URL and host restrictions

## Status

Accepted

## Context

In a Tauri desktop WebView, an iframe is an outbound network client and can be
used to target local services or application protocols. The HTML sanitizer
intentionally strips iframes (ADR-0090); this feature introduces them only
through a separate, explicit policy boundary.

## Decision

Before an iframe is mounted, its URL is parsed with the platform URL parser and
must satisfy all of these rules:

- scheme is exactly `https:` or `http:`; all custom schemes, including
  `tauri:`, `asset:`, `file:`, `data:`, `blob:`, and `javascript:`, are
  rejected;
- URL has no username or password;
- hostname is not `localhost`, ends with `.localhost`, `.local`, or
  `.internal`, and is not a single-label host;
- literal IPv4 destinations in `127.0.0.0/8`, `0.0.0.0/8`, `10.0.0.0/8`,
  `169.254.0.0/16`, `172.16.0.0/12`, `192.168.0.0/16`, or `224.0.0.0/4` are
  rejected;
- literal IPv6 loopback, link-local, multicast, and unique-local destinations
  (`::1`, `fe80::/10`, `ff00::/8`, and `fc00::/7`/`fd00::/8`) are rejected,
  including IPv4-mapped forms; and
- ports are permitted only for `http`/`https` when explicitly required by a
  future allowlisted provider, with no implicit access to app-local ports.

The validator must also reject malformed, empty, or parser-normalized URLs
whose original value does not round-trip to the accepted origin. DNS names
that resolve to private addresses are a residual risk of a browser-only
validator; Phase 2 must pair this policy with Tauri CSP/capability restrictions
that deny remote iframe IPC and must not add a privileged proxy or filesystem
bridge. A future network proxy/DNS pinning layer is required before claiming
strong SSRF protection against DNS rebinding.

Rejected URLs render an in-place blocked-content message explaining that the
embed was refused by the app's safety policy, with an explicit option to copy
the URL. They never create a blank iframe and never fail silently.

## Rejected alternatives

- Allowing every `http(s)` URL: rejected because public-looking URLs can target
  local services through literal addresses or hostile redirects.
- Allowing `tauri:`/`asset:` or `file:`: rejected because those schemes cross
  the app's local resource boundary.
- Treating URL parsing as sufficient SSRF defense: rejected; DNS rebinding and
  WebView IPC are separate controls and remain explicit follow-up requirements.
- Silent failure or a broken iframe: rejected because users need to understand
  why a note's embed did not load.
