# Git Workflow, CI/CD & Release Engineering

Professional-grade process for the monorepo: branching, commit hygiene, local hooks, CI pipeline, environments, and release flow. Scales from "you + AI sessions" today to an actual team later without restructuring.

---

## 1. Branching Strategy

**Trunk-based, with short-lived feature branches** — not long-lived GitFlow-style branches. Simpler to reason about, and AI-generated work tends to be small/scoped already (per `AGENTS.md`), which fits trunk-based well.

```
main                    ← always deployable, protected
  ├─ feat/wikilink-parser
  ├─ feat/button-component
  ├─ fix/sync-conflict-race
  └─ chore/eslint-boundaries
```

- Branch naming: **ALL branches created by AI agents MUST start with `feat/`, `fix/`, or `chore/`** (e.g. `feat/wikilink-parser`, `fix/sync-conflict-race`, `chore/bump-deps`).
- One branch per concern, matching the "one AI change = one commit" rule — branches should rarely outlive a single PR.
- `main` is protected: no direct pushes, PR + passing CI + review required.
- **Push & PR requirement**: On pushing a branch, the agent must open a Pull Request with an informative title (conventional commit style), a comprehensive description of changes and commits, direct markdown links to relevant ADRs in `docs/adr/`, and a completed checklist.

## 2. Commit Convention

**Conventional Commits**, enforced by commitlint:

```
feat(design-system): add Button loading state
fix(sync-client): resolve manifest hash race condition
chore(deps): bump turborepo to 2.x
```

This isn't just style — it drives automated changelog generation and semantic version bumps later (Section 6).

## 3. Local Hooks (Husky + lint-staged)

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
pnpm exec husky init
```

**`.husky/pre-commit`**

```bash
pnpm exec lint-staged
```

**`lint-staged` config** (root `package.json` or `.lintstagedrc`):

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.scss": ["stylelint --fix", "prettier --write"]
}
```

**`.husky/commit-msg`**

```bash
pnpm exec commitlint --edit "$1"
```

**`.husky/pre-push`** (optional, keep fast — heavier checks belong in CI, not blocking every push):

```bash
pnpm turbo run typecheck --filter=...[origin/main]
```

Keep pre-commit fast (lint-staged only touches changed files). Anything slow (full test suite, build) belongs in CI, not local hooks — slow hooks get bypassed or hated, which defeats the purpose.

## 4. CI Pipeline (GitHub Actions, matched to Turborepo)

Use Turborepo's affected-package detection so CI only runs what changed:

**`.github/workflows/ci.yml`** — runs on every PR:

```yaml
name: CI
on: pull_request

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint typecheck test build --filter=...[origin/main]
```

- [ ] **Lint** — ESLint + Stylelint, including the boundaries rule from the monorepo scaffold.
- [ ] **Typecheck** — `tsc --noEmit` per package.
- [ ] **Unit tests** — Vitest, per package.
- [ ] **Build** — every affected package/app must build clean.
- [ ] **Storybook build** — must succeed on any PR touching `design-system`.
- [ ] **Visual regression** — Chromatic (or Playwright screenshots) gated on `design-system`/`tokens` changes, per the design system plan.
- [ ] **Boundary check** — fail if any package imports across the forbidden edges (indexer → design-system, anything → apps/*).

Use Turborepo remote caching (Vercel's free tier, or self-hosted) so CI reuses build/test results across branches — this is where Turborepo actually pays off in CI time, not just locally.

## 5. Environments

```
Local dev → Staging → Pre-release (RC) → Production
```

| Environment | Purpose | Trigger | Audience |
| --- | --- | --- | --- |
| **Local** | Dev machine, hot reload | — | You |
| **Staging** | Integration testing, latest `main` | Auto-deploy on merge to `main` | Internal only |
| **Pre-release (RC)** | Release candidate, feature-frozen | Manual promotion from staging, tagged `vX.Y.Z-rc.N` | Internal + trusted testers (TestFlight/Play Internal Testing for mobile) |
| **Production** | Public release | Manual promotion from a passed RC | Everyone |

**Desktop**: staging/RC/prod map to build channels — e.g. auto-updater feed URLs per channel (`staging.updates.yourapp.com`, `stable.updates.yourapp.com`), so you can ship a build to a channel without touching the public release.

**Mobile**: staging = internal dev builds (TestFlight internal / Play internal track), RC = TestFlight external / Play closed testing, prod = App Store / Play production track. This maps directly onto what Apple/Google already provide — don't invent a parallel system.

**Sync**: Drive credentials and any folder-tool configuration are client/user scoped; there is no project-operated sync deployment or server database to separate by environment.

## 6. Versioning & Release

**Changesets** (works cleanly with pnpm + Turborepo monorepos, better fit here than plain semantic-release since you have multiple independently-versioned packages):

```bash
pnpm add -D @changesets/cli
pnpm changeset init
```

- Every PR that changes a published/shipped package includes a changeset (`pnpm changeset` prompts for bump type + summary).
- A "Version Packages" bot PR accumulates changesets, bumps versions, generates changelogs — merge that PR to cut a release.
- Ties directly into Conventional Commits for changelog quality.

**Release flow:**

1. Merge PRs to `main` → auto-deploy to staging.
2. When ready to cut a release: merge the Changesets version-bump PR → tag created → RC build produced → pushed to TestFlight/Play internal + desktop staging channel.
3. RC gets tested. If good, promote the *same build* (don't rebuild) to production channels — rebuilding at this stage risks a build that wasn't actually the one tested.
4. Tag `vX.Y.Z` marks the shipped production release.

## 7. Branch Protection Rules (GitHub)

On `main`:

- [ ] Require PR before merge, no direct pushes.
- [ ] Require status checks to pass (lint, typecheck, test, build, boundaries).
- [ ] Require up-to-date branch before merge.
- [ ] Require at least 1 review (even solo — review your own AI-generated PRs deliberately, don't just merge).
- [ ] Require conversation resolution before merge.
- [ ] No force-push, no branch deletion protection off.

## 8. PR Template

**`.github/PULL_REQUEST_TEMPLATE.md`**

```md
## What
(Detailed description of what this PR introduces and why — matches the branch's single concern)

## Architecture Decision Records (ADRs)
(Clickable links to relevant ADRs under docs/adr/XXXX-...md, e.g. [ADR-0116](docs/adr/0116-sync-via-drive-syncthing-no-owned-backend.md))

## Commits & Changes Breakdown
- `type(scope)`: Description of commit

## Checklist
- [ ] Branch starts with `feat/`, `fix/`, or `chore/`
- [ ] PR title is descriptive and follows conventional commits
- [ ] File size soft cap (150-200) / hard cap (250 lines) followed (`AGENTS.md`)
- [ ] Story + test added for new components
- [ ] `PROGRESS.md` & `docs/HISTORY.md` updated
- [ ] Changeset added (if this ships a package change)
```

## 9. CODEOWNERS (once it's an actual team)

```
/packages/design-system/  @design-lead
/packages/sync-client/     @backend-lead
/apps/desktop/                @desktop-lead
/apps/mobile/                   @mobile-lead
```

Not needed solo, but set it up early — retrofitting ownership onto a codebase after a team joins is more painful than starting with it, even if every rule currently points to one person.

---

## Suggested Build Order

1. Husky + lint-staged + commitlint — cheapest to add, immediate value, do this first alongside the monorepo scaffold.
2. Branch protection + PR template — free, do this before the first real PR.
3. CI pipeline (lint/typecheck/test/build) — before any real feature work lands, not after.
4. Changesets — once you have your first package worth versioning (the design system).
5. Staging environment — once desktop/mobile apps have something deployable.
6. RC/prod promotion flow — once staging is stable and you're approaching a first real release.
