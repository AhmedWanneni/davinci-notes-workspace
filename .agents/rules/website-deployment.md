---
trigger: always_on
description: Rules for website deployment and making release links public directly without GitHub Actions.
---

## Website Deployment & Public Distribution Rules (Mandatory for all AI agents)

### 1. Direct Cloudflare Deployment
When updating the website or releasing a new version:
- The agent has direct access to deploy the static website to Cloudflare Pages via `wrangler` (`wrangler pages deploy apps/website/dist --project-name=sophia-notes --branch=main` or `pnpm deploy:cloudflare -d`).
- **Do not wait for GitHub Actions or ask the user to configure GitHub secrets** for Cloudflare Pages deployment; compile with `pnpm --filter @app/website build` and deploy directly with `wrangler`.

### 2. Public Download Links
- When a release is cut or website links are updated, all download links and live website URLs must be made immediately public and explicitly provided to the user.
- Verify that GitHub release is published (`isDraft: false`) and asset URLs return HTTP 200 without authentication.
