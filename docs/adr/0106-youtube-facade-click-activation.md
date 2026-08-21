# ADR-0106: YouTube facade click activation and autoplay

## Status

Accepted; corrective note to ADR-0105

The YouTube facade suppresses `mousedown` only to prevent CodeMirror from
moving the selection and rebuilding the structural widget. The direct `click`
handler performs the facade-to-iframe replacement synchronously, preserving the
user gesture. It appends `autoplay=1` to the already validated YouTube embed
URL and the fixed iframe Permissions Policy now includes `autoplay 'src'`.

This is limited to explicit YouTube facade activation; generic iframe and tweet
placeholder behavior is unchanged. The prior no-autoplay wording in ADR-0105
is superseded because it made the requested click-to-play behavior impossible.
The sandbox remains unchanged and `allow-same-origin`, camera, and microphone
remain denied.
