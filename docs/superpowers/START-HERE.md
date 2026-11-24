# START HERE — resuming the It's a Date modernization

Last updated: 2026-11-25 (Phase 2 built, PR pending). Read this first in a new session, then the files it points to.

## How to resume

1. Open the folder `C:\Users\manti\Desktop\its-a-date` in VS Code and start a **new** Claude Code conversation.
2. Phase 2 is built (PR pending). Next up are Phases 3 and 4. They can run in parallel, one Claude Code conversation each. Their plans aren't written yet. Each conversation writes its own plan first, with superpowers:writing-plans, from the spec, the roadmap and the hand-off notes below. Then it executes the plan.
   - **Phase 2 (API) is built** on branch `phase-2-api`; merge its PR into `modernize` first.
   - **Phase 3 (web foundation)** can optionally run in parallel. Use the same prompt with "Phase 3", and add "Work in a git worktree, not the main folder."
   - **Phase 4 (designs)** can optionally run in parallel. It needs the owner present to sign off the Home and Idea detail screens. Use the same prompt with "Phase 4", plus the worktree line.
3. Each phase ends with its own PR into `modernize`. Phase 5 starts after 2, 3 and 4 have merged.

**Execution method (owner's choice): agent per task.** Use superpowers:subagent-driven-development.
- Each task gets a fresh implementer agent, using the project agent named for that phase in the roadmap: Phase 2 `itsadate-api`, Phase 3 `itsadate-web`, Phase 4 `itsadate-designer`.
- Each task then gets a fresh `itsadate-reviewer` check before the next one starts.
- The phase ends with a whole-branch review on the most capable model.
- Keep the ledger in `.superpowers/sdd/<date>-phase-N-<name>/progress.md`.
- Plan files go in `docs/superpowers/plans/` as `<date>-phase-N-<name>.md`. Use the Phase 1 plan as the format model.

## Read in this order

1. Spec (approved): `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md`
2. Roadmap (phases, agents, order, branch rules): `docs/superpowers/plans/2026-11-20-00-roadmap.md`
3. Phase 1 plan (done; the format model for new plans): `docs/superpowers/plans/2026-11-20-phase-1-foundation.md`. The Phase 1 code to build on is `packages/shared/src/` (contract names are binding), `apps/api/src/app.ts` and `apps/web/`.
4. Style guide for any UI work: `DESIGN.md` (Coral Friendly)
5. For history only: the Phase 0 plan and its ledger, `.superpowers/sdd/2026-11-20-phase-0-security/progress.md`

## Where things stand

**Phase 2 is built on branch `phase-2-api`; the PR into `modernize` is pending review.**
- The API is rebuilt (`/api/v1`, cookie auth, roles, tags, ideas, admin) with `migrate`, `create-admin` and `seed` scripts. The legacy API (`apps/api/legacy/`) is deleted from git, so `reset-admins` and `copy-to-dev` are gone. Setup and script commands are in `README.md`.
- Dev DB `itsadate_dev` is migrated and seeded (53 ideas). The owner's dev admin `png.mantis@gmail.com` exists.
- The local env now lives at **`apps/api/.env`** (untracked, ignored). `apps/api/legacy/.env` is kept on disk as a backup (untracked); the owner deletes it after Phase 7.

**Hand-off notes**
- Phases 3 and 5 (web):
  - Shared names added to `packages/shared`: `idParamsSchema`, `adminIdeaQuerySchema`, `adminUserQuerySchema`, `roleUpdateSchema`, `ValidationIssue` and `ValidationErrorDetails`.
  - The session cookie is `itsadate_session`.
  - A validation error (422) carries `details: { issues: [{ location, path, message }] }`.
  - `GET /admin/users` was added (not in the spec's route list).
  - The pending-ideas queue is oldest first.
  - Search uses a regex, not the spec's text index.
- Phase 6a (ratings and saves):
  - The rating and save routes are not built yet. They must recompute with `ratingsRepository.statsForIdea` and `savesRepository.countForIdea`, then store with `ideasRepository.setRatingStats` and `ideasRepository.setSaveCount`.
  - Unique indexes on (idea, user) for ratings and (user, idea) for saves already exist.
- Phase 7 cutover runbook:
  - Order: back up, deploy, and let the API take no writes. Then run `migrate --dry-run --db ItsADate`, `migrate --db ItsADate`, `create-admin --db ItsADate` and `seed --mode prod --db ItsADate`.
  - `migrate` must run before `create-admin`; otherwise an admin role on a duplicate account can be lost.
  - `syncIndexes` drops hand-made Atlas indexes.
  - After any schema index change, re-run `migrate`. The server warns about missing indexes at startup.
  - Migrated and seeded ideas have `image: null` and keep their legacy `_id`s, which the photo list needs. Images stay null until Cloudinary exists.
  - New ideas can't be created until uploads exist: `isOwnImage` needs `CLOUDINARY_CLOUD_NAME`.
  - The prod to dev refresh for the rehearsal uses `mongodump` and `mongorestore` (`copy-to-dev` is gone).
- Phase 0 findings now resolved: unapproved ideas readable by id now return 404; `register` returns a `UserDTO` only, never the hash; tokens now expire after 7 days.

**Phase 1 is done: merged into `modernize` on 2026-11-23 (PR #3), CI green.**
- `modernize` now has: npm workspaces `packages/shared` (Zod contracts, DTOs), `apps/api` (Express 5 skeleton, `/healthz`, port 4000), `apps/web` (Vite + React 19 skeleton, port 5173, proxies `/api` to 4000). The old web app lives in `apps/web/legacy/` (the old API folder was removed in Phase 2). Root `npm run ci` passes, and so does a fresh clone. GitHub Actions runs `prettier --check` and `npm run ci`. Husky + lint-staged pre-commit.
- The local `.env` moved to `apps/api/legacy/.env` in Phase 1, and to `apps/api/.env` in Phase 2 (see above).
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
- **This `.env` is irreplaceable without the owner**: only the owner has the DB password. Never delete, print or stage it. The live copy is `apps/api/.env`; `apps/api/legacy/.env` is a backup.
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
- Deferred minor findings from Phase 0 reviews (for example, unapproved ideas readable via `/date/:id`, and `/user/register` returning the password hash) are listed in the Phase 0 ledger; the main ones are resolved by Phase 2 (see the hand-off notes).
- The auto-mode permission classifier blocks reading secret stores (VS Code history, Render env) and forging production admin tokens. Ask the owner instead.

## Owner to-dos (not blocking Phase 1)

- Create a free Cloudinary account before Phase 7.
- Recommended before cutover: in Atlas, create a second DB user with access only to `itsadate_dev` and use it in the local `.env`, so the dev machine can't touch prod data.
- Optional: fix the admin's name (see above).
- Optional: Phase 0 Task 6, purge old secrets from git history (they're rotated already).
- Optional: delete the unused Render service "it's a date backend".
