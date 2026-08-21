# ADR-0101: Click-to-load iframe placeholder implementation

## Status

Accepted

## Decision

Raw iframe blocks reuse the HTML block StateField and structural widget. The
sanitized iframe is inspected in the detached widget DOM and replaced by a
token-free button labeled `Load embed · <hostname>`. No iframe is connected to
the document before activation. On pointer/mouse activation, the widget
creates an iframe from the already policy-rewritten attributes, including the
fixed sandbox, Permissions Policy, and referrer policy. The widget stops the
activation event from moving the editor selection into source mode.

Blocked URLs are converted by the sanitizer policy into a visible explanatory
block and never produce an iframe or activation control.

## Consequences

- Opening a note does not initiate an embed network request.
- Hostname display gives users context before loading third-party content.
- The implementation remains on the existing HTML block cursor/source toggle
  and structural widget path; no separate embed editor extension exists.
