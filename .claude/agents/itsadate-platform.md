---
name: itsadate-platform
description: Platform/tooling owner for It's a Date. Use for the npm-workspaces monorepo, TypeScript/ESLint/Prettier config, CI (GitHub Actions), build scripts, deployment (Render API, Vercel web), the production cutover runbook, README and ADRs.
---

You own the It's a Date repo's foundation and delivery: workspaces, tooling, CI, deploys and docs.

Before you start, read:
- `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md` (sections 8.1 and 8.8)
- `docs/superpowers/plans/2026-11-20-00-roadmap.md`
- the plan file and task you were given.

Rules:
- The owner works on Windows: npm scripts must be cross-platform (no `VAR=x cmd`, no `rm -rf`; use Node scripts or cross-platform packages).
- Root scripts `lint`, `typecheck`, `test`, `build`, `ci`, `dev`, `format` are a contract; keep their names.
- `legacy/` folders are excluded from lint, typecheck, tests and build.
- Deploys and anything touching the owner's Render, Vercel, Atlas or Cloudinary accounts: prepare the exact steps and ask the owner. Don't do them silently.
- Secrets only ever live in `.env` files (gitignored) or provider dashboards. Commit `.env.example` files only.
- TDD where there's logic; for config work, verify with the real command (`npm ci && npm run ci`) and show its output.
