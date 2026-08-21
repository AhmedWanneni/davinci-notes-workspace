# ADR-0105: YouTube thumbnail facade and click-to-play

## Status

Accepted

## Decision

YouTube embeds use a thumbnail facade by default. The editor requests the
stable `https://i.ytimg.com/vi/<id>/hqdefault.jpg` image, displays a flat play
control, and mounts the existing policy-sanitized iframe only after activation.
The thumbnail is deliberately `hqdefault` rather than `maxresdefault`: it is
reliably available and avoids a second fallback request. An image failure
leaves a readable local fallback while retaining the play control.

The mounted iframe keeps the validated `https://www.youtube.com/embed/<id>` URL,
with `autoplay=1` added only during the direct facade click. The fixed sandbox
is unchanged; the Permissions Policy permits autoplay only for this explicit
activation path. See corrective ADR-0106.

This supersedes the prior eager-load behavior for YouTube embeds specifically.
Raw generic iframes retain the hostname click-to-load placeholder, and tweet
embeds retain their click-to-load static card; neither has a universal,
provider-independent thumbnail source.

## Rationale and rejected alternatives

The facade avoids loading an executable remote document when a note opens while
giving users an identifiable preview. `maxresdefault` was rejected because it
is not guaranteed for every video. Eager iframe loading was rejected for
YouTube because it spends network and WebView resources before play intent.
Granting autoplay to generic embeds was rejected because it would weaken the
established explicit-load boundary unnecessarily.
