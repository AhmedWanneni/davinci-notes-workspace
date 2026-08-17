# ADR-0004: Store notes as plain markdown files, not a database

## Status
Accepted

## Context
Local-first value proposition: portable, grep-able, no lock-in, works with any external tool.

## Decision
Notes live as plain `.md` files on disk. The app is a *view* over a folder, not the owner of the data.

## Consequences
- Data is trivially portable and interoperable.
- Indexing/search needs a separate store (see ADR-0005); the app must reconcile file changes from outside (desktop watcher, mobile sync).
