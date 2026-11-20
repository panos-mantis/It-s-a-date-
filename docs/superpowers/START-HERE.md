# START HERE — resuming the It's a Date modernization

Last updated: 2026-11-20. Read this first in a new session, then the files it points to.

## How to resume

1. Open the folder `C:\Users\manti\Desktop\New folder\its-a-date` in VS Code and start a **new** Claude Code conversation. Restart Claude Code first if you haven't since 2026-11-20, so the project agents in `.claude/agents/` and the Open Design plugin tools load.
2. Say: **"Read docs/superpowers/START-HERE.md, then execute Phase 0 using subagent-driven development."**

**Execution method (owner's choice): agent per task.** Use superpowers:subagent-driven-development: a fresh implementer agent per task, using the project agent named for that phase, and a fresh `itsadate-reviewer` check after each task before the next starts.

## Read in this order

1. Spec (approved): `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md`
2. Roadmap (phases, agents, order): `docs/superpowers/plans/2026-11-20-00-roadmap.md`
3. Next plan to execute: `docs/superpowers/plans/2026-11-20-phase-0-security.md`
4. Style guide for any UI work: `DESIGN.md` (Coral Friendly)

## Where things stand

**Done:**
- Repo cloned to `C:\Users\manti\Desktop\New folder\its-a-date` (branch `main`, nothing committed yet). Dependencies installed for the backend and frontend; backend runs locally on port 4000; frontend production build compiles.
- Owner rotated the Atlas DB password (user `pngmantis`) and the JWT secret.
  - The local `Its a date BACKEND/.env` holds the **new** values. **It is still tracked by git**, so never commit it; Phase 0 Task 1 untracks it.
  - Render service **"its a date backend pm"** now has env vars `MONGODB_URI` (DB `ItsADate`) and `JWT_SECRET`. Live API verified serving 19 approved ideas on 2026-11-20.
- Design direction chosen. Three style tiles were explored with the Open Design kit; the owner picked **Coral Friendly**. It's saved as the project's active design system (`DESIGN.md` at the root, plus `.open-design/design-systems/style-tiles-for-it-s-a-date-a-web-app-where-peop/`). The tiles and comparison page are in `.open-design/style-tiles-for-it-s-a-date-a-web-app-where-peop/`.
- Open Design Agent Kit installed as a Claude Code plugin (user scope, v0.4.0).
- Spec approved; roadmap and the Phase 0 and Phase 1 plans written; six project agents written in `.claude/agents/`.

**Uncommitted local changes (all intended):**
- `Its a date BACKEND/connection.js`: optional `DNS_SERVERS` override. Node can't resolve `mongodb+srv` on this PC; the `.env` sets `DNS_SERVERS = 1.1.1.1,8.8.8.8`.
- `Its a date BACKEND/.env`: rotated secrets plus `DNS_SERVERS`. **Must not be committed.**
- `Its a date BACKEND/node_modules/.package-lock.json`: an npm artefact; Phase 0 untracks `node_modules`.
- New, untracked: `DESIGN.md`, `docs/`, `.open-design/`, `.claude/agents/`. Phase 0 Task 1 commits them.

## Facts a new session needs (found during setup)

- **All 20 existing idea images are broken** (Firebase Storage returns HTTP 402). The spec replaces them with Cloudinary and free-licence photos in Phase 7.
- **12 accounts have `isAdmin: true`**, mostly junk. Phase 0 Task 2's `reset-admins` script leaves exactly one admin. The owner chose to **create a fresh admin account**: ask them for the email and name to use.
- **Emails aren't unique** in `users` (some appear 2–6 times). The Phase 2 migration merges duplicates.
- Render has two similar services: **"its a date backend pm"** is live; **"it's a date backend"** is unused and broken (owner may delete it). The live frontend is the Render static site **"it's a date"**.
- The same Atlas cluster also hosts `petAdoption`, `mvpUsers` and `shatask`. If the owner's other apps use the `pngmantis` user, they need the new password too. Owner's call; not part of this project.

## Owner to-dos (not blocking Phase 0 or 1)

- Create a free Cloudinary account before Phase 7.
- Decide the admin email and name for `reset-admins` (Phase 0 Task 2 and Task 5).
- Optional: delete the unused Render service "it's a date backend".
