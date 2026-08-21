# ADR-0098: Embed iframe sandbox and permissions policy

## Status

Accepted

## Context

An embedded page executes remote code inside the Tauri WebView. HTML
sanitization cannot make that document safe because the iframe loads a separate
document after sanitization. Browser guidance specifically warns that
`allow-scripts` combined with `allow-same-origin` is dangerous for same-origin
content: the document can remove its sandbox. Tauri has also published an
advisory about remote-origin iframes reaching application IPC endpoints, so the
embed policy must not assume browser-tab isolation.

## Decision

Every app-created embed uses the fixed sandbox token set:

```text
allow-scripts
allow-presentation
```

`allow-same-origin`, `allow-forms`, `allow-modals`, `allow-popups`,
`allow-popups-to-escape-sandbox`, `allow-top-navigation`,
`allow-top-navigation-to-custom-protocols`, downloads, storage access, and
pointer lock are not granted. The source document can never supply or extend
this value. `allow-scripts` is required for YouTube and tweet widget code;
presentation is the minimum allowance for legitimate presentation/fullscreen
flows. Omitting `allow-same-origin` preserves an opaque origin and prevents the
dangerous escape combination.

The fixed `allow` Permissions Policy is:

```text
fullscreen 'src'; encrypted-media 'src'; picture-in-picture 'src'
```

Accelerometer, autoplay, clipboard-write, gyroscope, and web-share from the
source example are not delegated. Camera and microphone are explicitly denied,
regardless of source markup or future site requests. The source `allow`
attribute is never copied. Fullscreen is granted only to the loaded source
origin, not `*`; playback starts only after user interaction.

The fixed `referrerpolicy` is `no-referrer`. This prevents note paths, vault
context, and local app URLs from being disclosed to third parties. Site
compatibility concerns are accepted; an embed that requires a referrer is
blocked or fails visibly rather than weakening the default globally.

## Rejected alternatives

- `allow-scripts allow-same-origin`: rejected because the combination can
  permit sandbox escape for same-origin content.
- Broad sandbox tokens or copying user attributes: rejected because note
  content must not choose its own privilege boundary.
- `allow="*"`, camera/microphone, or autoplay: rejected for privacy and
  least-privilege reasons.
- `strict-origin-when-cross-origin`: rejected in favor of the stricter
  no-referrer policy for a local-first application.

## References

MDN documents the `allow-scripts`/`allow-same-origin` warning and Permissions
Policy behavior. Tauri's security advisory GHSA-57fm-592m-34r7 documents the
remote-iframe/IPC risk.
