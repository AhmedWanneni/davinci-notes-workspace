# ADR-0118: Drive `drive.file` OAuth verification and rollout

Status: Accepted

## Context

Drive mode needs access to files it creates or that the user explicitly
opens/shares with the app. The planned scope is
`https://www.googleapis.com/auth/drive.file`, rather than full Drive access.
Google's current Drive scope documentation classifies `drive.file` as
non-sensitive and recommends it as a narrow, per-file scope.

## Decision

Use `drive.file` only. It does not, by itself, require Google's
sensitive/restricted-scope review. Development/testing can proceed with a
Testing publishing status and explicitly listed test users, but that mode is
limited to 100 test users and each test-user authorization expires seven days
after consent. A public production release must use a correctly configured
production consent screen and satisfy Google's API policy and applicable
brand/privacy requirements.

The implementation must not request `drive`, `drive.readonly`,
metadata-wide, or other broader scopes. A future broader scope requires a new
decision and may trigger sensitive/restricted verification, including scope
justification, policy evidence, and a product demonstration. Google's current
published estimate for sensitive-scope verification is typically 3–5 business
days, with schedule margin for rework. `drive.file` itself has no separate
verification lead time under its current classification.

## Consequences

OAuth and Drive integration can be validated with test users without waiting
for sensitive-scope approval. The 100-user testing cap and seven-day test
authorization expiry belong in development documentation. The production
checklist must still cover consent-screen configuration, branding,
privacy-policy links, and policy compliance. Recheck classification before
release because Google may change scope policy.

## Sources

- [Drive API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [When verification is not needed](https://support.google.com/cloud/answer/13464323)
- [Manage app audience](https://support.google.com/cloud/answer/15549945)
- [Sensitive-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)
