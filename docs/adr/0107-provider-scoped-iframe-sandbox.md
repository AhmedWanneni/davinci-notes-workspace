# ADR-0107: Provider-scoped iframe sandbox for YouTube playback

## Status

Accepted; refines ADR-0098 for the native WebView runtime

The invalid `allow-presentation` token is removed from every app-created
iframe. The default sandbox is now `allow-scripts` for arbitrary validated
hosts. YouTube's exact validated embed host (`www.youtube.com`) uses the
explicit provider policy `allow-scripts allow-same-origin`, because the player
requires an origin for Cache Storage and related initialization APIs.

This is a narrow host mapping, not a general relaxation. The URL validator
still runs first, source attributes cannot select policy tokens, and arbitrary
hosts do not receive `allow-same-origin`. The known `allow-scripts` plus
`allow-same-origin` sandbox risk is accepted only for this explicitly trusted,
host-validated provider and remains excluded from generic embeds. Camera,
microphone, and all other unrequested sandbox capabilities remain denied.

The policy-token unit test maintains a recognized-token list so unsupported or
misspelled sandbox flags cannot silently return to the fixed policy.
