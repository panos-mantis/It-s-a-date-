# START HERE — resuming the It's a Date modernization

Last updated: 2026-11-23 (after Phase 1). Read this first in a new session, then the files it points to.

## How to resume

1. Open the folder `C:\Users\manti\Desktop\its-a-date` in VS Code and start a **new** Claude Code conversation.
2. Say: **"Read docs/superpowers/START-HERE.md, then execute Phase 1 using subagent-driven development."**

**Execution method (owner's choice): agent per task.** Use superpowers:subagent-driven-development. Each task gets a fresh implementer agent, using the project agent named for that phase in the roadmap (Phase 1: `itsadate-platform`). Each task then gets a fresh `itsadate-reviewer` check before the next one starts. Keep the ledger in `.superpowers/sdd/<date>-phase-N-<name>/progress.md`, as Phase 0 did.

## Read in this order

1. Spec (approved): `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md`
2. Roadmap (phases, agents, order, branch rules): `docs/superpowers/plans/2026-11-20-00-roadmap.md`
3. Phase 1 plan (executed): `docs/superpowers/plans/2026-11-20-phase-1-foundation.md`. **Next: once the Phase 1 PR is merged into `modernize`, write the Phase 2, 3 and 4 plans** with superpowers:writing-plans (they run in parallel, each on its own branch cut from `modernize`).
4. Style guide for any UI work: `DESIGN.md` (Coral Friendly)
5. For history only: the Phase 0 plan and its ledger, `.superpowers/sdd/2026-11-20-phase-0-security/progress.md`

## Where things stand

**Phase 1 is built and reviewed (2026-11-23); its PR into `modernize` awaits the owner's merge.**
- Branch `phase-1-foundation`: npm workspaces `packages/shared` (Zod contracts, DTOs), `apps/api` (Express 5 skeleton, `/healthz`, port 4000), `apps/web` (Vite + React 19 skeleton, port 5173, proxies `/api` to 4000). The old apps now live in `apps/api/legacy/` and `apps/web/legacy/`. Root `npm run ci` passes, and so does a fresh clone. GitHub Actions runs `prettier --check` and `npm run ci`. Husky + lint-staged pre-commit.
- The local `.env` moved to **`apps/api/legacy/.env`** (still untracked and ignored). The legacy scripts (`reset-admins`, `copy-to-dev`) run from `apps/api/legacy`.
- Node engines: `^22.22.2 || >=24.15.0` (the lockfile's real floor).

**Notes for the Phase 2–4 plans (from the Phase 1 final review):**
- Phase 2: Express 5's `req.query` is a read-only getter, so `validate()` must store parsed input elsewhere (e.g. `res.locals` or a typed `req.validated`). Check on the server that image URLs and `publicId` belong to the app's own Cloudinary folder (the shared schema only enforces https). Add error middleware (malformed JSON or an oversize body returns HTML today), env validation, SIGTERM shutdown, and `eslint .` for the api's config files. Dedupe is already enforced: `tagIds` must be unique.
- Phase 3: query fields in `ideaQuerySchema`/`placesQuerySchema` are preprocessed (an empty string means absent), so their Zod *input* type is `unknown`. Forms should type with `z.input<>`. The exported `*Input`/`IdeaQuery` names are *output* types. Split web tsconfig into app and node configs (today `src/` sees Node types). `loginSchema` is deliberately lenient (no email-format check, password up to 1024) so legacy users can still log in; `registerSchema` is strict (password ≤ 72 bytes).
- Phase 7: `"prepare": "husky"` fails on installs without dev deps (Render with `NODE_ENV=production`). Use `npm ci --include=dev` or `HUSKY=0`.

**Phase 0 is done (2026-11-22).**
- `main` has PR #1 (secrets and `node_modules` untracked, admin routes locked, open admin signup removed, dev DB and admin-reset scripts) and PR #2 (reset-admins prompt fix). Both are deployed on Render.
- The live API returns 401 on admin routes without a token, and `/user/register/admin` returns 404. It serves 19 approved ideas.
- Production (`ItsADate`) has exactly **one admin: `png.mantis@gmail.com`**. 12 old admins were demoted, not deleted. The owner logged in at the live `/Admin` and it works.
- **`modernize`** exists on GitHub, created from `main` at `fbae295`. Local checkout is on `modernize`.
- Atlas DB password and JWT secret were rotated on 2026-11-20. Render has them as env vars.

**Local setup (the owner's PC):**
- `Its a date BACKEND/.env` is untracked and git-ignored. It was recreated on 2026-11-23 and points at **`itsadate_dev`** (verified: 20 ideas, 1 admin, the dev test account "Owner"). It has `DNS_SERVERS=1.1.1.1,8.8.8.8`, because Node can't resolve `mongodb+srv` on this PC, and `PORT=4200`. Its `JWT_SECRET` is local-only and differs from production.
- **This `.env` is irreplaceable without the owner**: only the owner has the DB password. Never delete, print or stage it. Since Phase 1 it lives at `apps/api/legacy/.env`. When Phase 2's API first needs the DB, the owner copies the values into `apps/api/.env`.
- **Never check out a commit from before Phase 0** (`e1cf2fe` or older). It overwrites, then deletes, the local `.env` and `node_modules`. This happened on 2026-11-22. To update a stale branch, use `git fetch` and `git branch -f`.
- Prod and dev share one cluster and one DB user. Only the database name at the end of `MONGODB_URI` differs: `/ItsADate` exists only in Render's env vars, and `/itsadate_dev` is in the local `.env`. Scripts reach prod only with an explicit `--db ItsADate` and a typed confirmation.

## Facts a new session needs

- **Live frontend:** https://its-a-date.onrender.com (Render static site "it's a date"). **Live API:** https://its-a-date-backend-pm.onrender.com (Render service "its a date backend pm"). The admin panel is at `/Admin` and isn't linked from the menu.
- **All idea images are broken.** Firebase Storage returns HTTP 402. That also means nobody can add a new idea on the live site, because the form requires a Firebase upload. Phase 7 replaces Firebase with Cloudinary and free-licence photos. This is not a regression.
- The old navbar always shows "Log in" and "Register", even when logged in. That's expected in the legacy app.
- The prod admin account's name is literally "Your Name" (a placeholder slipped through). The owner can fix it by re-running `reset-admins` with `--name`. Harmless.
- **Emails aren't unique** in `users` (some appear 2–6 times). The Phase 2 migration merges duplicates.
- Render has two similar backend services: **"its a date backend pm"** is live; **"it's a date backend"** is unused and broken.
- The same Atlas cluster also hosts `petAdoption`, `mvpUsers` and `shatask`. Not part of this project.
- Deferred minor findings from Phase 0 reviews (for example, unapproved ideas readable via `/date/:id`, and `/user/register` returning the password hash) are listed in the Phase 0 ledger. Phase 2 replaces that code, so check them off there.
- The auto-mode permission classifier blocks reading secret stores (VS Code history, Render env) and forging production admin tokens. Ask the owner instead.

## Owner to-dos (not blocking Phase 1)

- Create a free Cloudinary account before Phase 7.
- Recommended before cutover: in Atlas, create a second DB user with access only to `itsadate_dev` and use it in the local `.env`, so the dev machine can't touch prod data.
- Optional: fix the admin's name (see above).
- Optional: Phase 0 Task 6, purge old secrets from git history (they're rotated already).
- Optional: delete the unused Render service "it's a date backend".
