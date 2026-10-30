# Documentation Hub

Welcome to the DaVinci Notes (Sophia) engineering documentation.

---

## Documentation Directory Structure

```
docs/
├── README.md                  # This documentation directory index
├── releasing.md               # Release management runbook & hotfix protocol
├── HISTORY.md                 # Archived session history and trajectories
├── web-clipper.md             # Web clipper browser extension design
├── theme-css-safety.md        # CSS isolation & theme security specification
├── plugin-ecosystem.md        # Plugin runtime, sandbox & lifecycle
├── plugin-package-spec.md     # Plugin package manifests and distribution
├── plugin-permissions.md      # Plugin capability permission matrix
├── editor-style-audit.md      # CodeMirror styling audit & token alignment
│
├── architecture/              # Core System Specifications
│   ├── README.md              # Architecture overview & diagrams
│   ├── stack-architecture.md  # Desktop stack & monorepo architecture
│   ├── mobile-architecture.md # Mobile Expo stack architecture
│   ├── design-system.md       # Design system & token contract
│   ├── conventions.md         # Coding conventions & file size rules
│   ├── git-workflow.md        # Branching, commits, and PR standards
│   └── wireframe.md           # Visual layout specifications
│
└── adr/                       # Architecture Decision Records (0001–0248)
```

---

## Key Guides & Operational Documents

| Document | Purpose |
|---|---|
| **[Architecture Specifications](architecture/README.md)** | Comprehensive technical breakdown of desktop, mobile, editor, and native Rust subsystems. |
| **[Architecture Decision Records (ADRs)](../DECISIONS.md)** | Immutable, numbered records of all 248 key technical decisions with status and rationale. |
| **[Release Runbook](releasing.md)** | Step-by-step maintainer guide for cutting releases, hotfixes, signing, and rollback. |
| **[Feature Implementation Plans](../plans/README.md)** | Phased specifications and verification matrices for all active and planned capabilities. |
| **[Plugin Runtime & Security](plugin-ecosystem.md)** | Capability-gated plugin execution environment, sandboxing, and distribution. |
| **[Theme Security Specification](theme-css-safety.md)** | CSS injection guards, token containment, and dark/light dynamic switches. |
| **[Session History](HISTORY.md)** | Detailed chronological record of all engineering sessions and closed tasks. |
