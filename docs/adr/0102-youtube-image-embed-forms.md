# ADR-0102: YouTube external-image embed forms

## Status

Accepted

## Decision

The external-image syntax is converted to an iframe only for these exact URL
forms:

- `https://youtube.com/watch?v=<11-character-id>` and its `www`/`m` host
  variants;
- `https://youtu.be/<11-character-id>` with optional query parameters such as
  `t`.

The video ID is restricted to YouTube's URL-safe 11-character alphabet. The
application constructs `https://www.youtube.com/embed/<id>` and passes it to
the existing HTML iframe policy and click-to-load block widget. Shorts,
channels, playlists, arbitrary YouTube paths, non-YouTube hosts, and URLs that
merely contain the word `youtube` remain ordinary image URLs.

## Consequences

- YouTube syntax has no separate iframe renderer or security policy.
- Ordinary external images retain the existing image decoration path.
- Shorts support can be added later as an explicit syntax decision without
  broadening the current matcher.
