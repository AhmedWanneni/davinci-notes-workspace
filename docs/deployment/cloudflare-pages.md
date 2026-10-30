# Cloudflare Pages Deployment Guide

Sophia Notes website (`apps/website`) can be deployed to Cloudflare Pages either via the interactive Bash TUI / CLI (`wrangler`) or directly via GitHub connection.

---

## 1. Quick Terminal Deployment (Interactive TUI)

Run the deployment TUI:

```bash
pnpm deploy:cloudflare
# or
bash scripts/deploy-cloudflare.sh
# or through the master dashboard:
pnpm manage # Select option [ 8 ]
```

### Features:
- **Zero API Tokens Needed**: Uses native Cloudflare Browser OAuth (`wrangler login`).
- **Authentication Check**: Automatically detects whether `wrangler` is logged in.
- **1-Click OAuth Browser Login**: If not authenticated, the script automatically pops open the Cloudflare OAuth login in your default browser. Once you click "Allow", your CLI session is immediately authenticated and ready to deploy.
- **1-Click GitHub Connect**: Select `[ 3 ]` (or `[ 4 ]`) to open the Cloudflare Pages GitHub connection page in your default browser.
- **Build & Deploy**: Automatically runs `pnpm --filter @app/website build` and uploads `apps/website/dist` to Cloudflare Pages (`sophia-notes.pages.dev`).
- **Live URL Launch**: Automatically surfaces the live deployment URL and offers to open it in your browser.

---

## 2. GitHub Connection (Continuous Deployment)

To connect the GitHub repository directly to Cloudflare Pages for automatic builds on push:

1. Open [Cloudflare Pages Dashboard](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github).
2. Connect your GitHub account and select repository: `AhmedWanneni/davinci-notes-workspace`.
3. Configure build settings:
   - **Framework preset**: `Astro`
   - **Root directory**: `apps/website`
   - **Build command**: `pnpm build` (or `pnpm --filter @app/website build`)
   - **Build output directory**: `dist`
   - **Environment variables**:
     - `NODE_VERSION` = `20`
4. Click **Save and Deploy**.

---

## 3. GitHub Actions Automated Deployment

A GitHub Actions workflow is also configured at [`.github/workflows/deploy-cloudflare.yml`](file:///.github/workflows/deploy-cloudflare.yml).

To enable it, add the following secrets in GitHub Repository Settings → Secrets and variables → Actions:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Cloudflare Pages: Edit` permissions.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID (found in the Cloudflare dashboard URL or sidebar).

---

## 4. Configuration File (`apps/website/wrangler.toml`)

```toml
name = "sophia-notes"
compatibility_date = "2024-11-01"
pages_build_output_dir = "dist"
```
