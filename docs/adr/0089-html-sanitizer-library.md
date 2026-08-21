# ADR-0089: DOMPurify for HTML sanitization

## Status
Accepted

## Decision

Use DOMPurify 3.4.14 in a new standalone `@app/sanitize` package. DOMPurify
was chosen over hand-rolled parsing and alternatives such as sanitize-html
because this security boundary should rely on a maintained XSS sanitizer with
browser DOM parsing rather than application-owned parser logic. DOMPurify's
bundle cost is small enough for this boundary and can remain out of the
initial editor path until Phase 2 lazy-loads HTML rendering. No editor or
rendering integration is included in Phase 1.

## Consequences

- Security fixes and parser behavior come from an established sanitizer.
- The package requires a DOM window at call time, making accidental server-side
  use explicit rather than silently producing unsafe output.
- DOMPurify's default broad HTML policy is replaced by the app's exact policy
  in ADR-0090.
- `sanitize-html` and custom parser implementations were rejected to avoid a
  larger policy surface or security-sensitive parser maintenance.
