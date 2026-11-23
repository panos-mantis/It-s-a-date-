# Phase 0 — Security & Repo Hygiene Implementation Plan

> **Status: DONE (2026-11-22).** PR #1 (Tasks 1–4) and PR #2 (reset-admins prompt fix) are merged into `main`. The owner ran `reset-admins` on `ItsADate`: 12 admins were demoted, and the one admin is now `png.mantis@gmail.com`. The live API returns 401 on admin routes, and `/user/register/admin` is gone (404). The owner logged in at the live `/Admin`. `modernize` was created from `main` at `fbae295` and pushed. Optional Task 6 (history purge) was not run; that's the owner's call. Execution log, rulings (R1–R6) and deferred minor findings: `.superpowers/sdd/2026-11-20-phase-0-security/progress.md`. The checkboxes below were not ticked during execution; this note is the record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop leaking secrets, protect the live site from its open admin routes, and give development its own database. No new features.

**Architecture:** Small, throwaway patches to the existing CommonJS Express app and the CRA admin panel on `main` (they're replaced in later phases), plus repo hygiene that every later phase inherits.

**Tech Stack:** Node 22+, Express 4, Mongoose 7, jsonwebtoken, bcrypt (existing); git.

**Spec:** `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md` §2, §8.2, §10

## Global Constraints

- **Never `git add -A` or `git add .` while `Its a date BACKEND/.env` is still tracked.** It now holds the rotated DB password and JWT secret. Untrack it first (Task 1, Step 2).
- The live API is Render service **"its a date backend pm"** (`https://its-a-date-backend-pm.onrender.com`), deployed from `main`, root dir `Its a date BACKEND`. The live frontend is Render static site **"it's a date"**, deployed from `main`.
- Render must have env vars `MONGODB_URI` (ending in `/ItsADate?...`) and `JWT_SECRET` before Task 1 merges. Once the committed `.env` is gone, they're its only source. Done by the owner on 2026-11-20 (live API verified serving 19 ideas); Task 5 Step 1 re-checks it.
- Task 1 also commits the planning work that exists only locally: `DESIGN.md`, `docs/`, `.open-design/` (minus `.checks/` and `exports/`) and `.claude/agents/`.
- Production DB name: `ItsADate`. Dev DB name: `itsadate_dev` (same cluster).
- Old JWT payload is the bare email string (`jwt.sign(email, secret)`). The hotfix keeps that format so existing logins keep working.
- Do not change public routes or response shapes the current frontend relies on, except the ones this plan names.
- Anything that writes to the production DB is run by the owner, or with the owner's explicit go-ahead.

## Review Focus

- **A logged-in non-admin calls admin routes** with a valid token → must get 403, not 200. Pinned in Task 3's checks.
- **A token signed with the old secret `potatopotato6`** → 401 (proves rotation took effect). Pinned in Task 3's checks.
- **A malformed `Authorization` header** (`Bearer` with no token, or a garbage string) → 401, never a 500 crash. Pinned in Task 3's checks.
- **Admin panel after hotfix:** approve and reject still work for the real admin, because the frontend now sends the header. Pinned in Task 4's checks.
- **`reset-admins` run twice** → still exactly one admin, no duplicate account. Pinned in Task 2's checks.

---

### Task 1: Untrack secrets and dependencies, add env examples

**Files:**
- Create: `.gitignore` (repo root)
- Create: `Its a date BACKEND/.env.example`
- Modify: `Its a date BACKEND/connection.js` (already changed locally: optional `DNS_SERVERS`; commit it)
- Untrack: `Its a date BACKEND/.env`, `Its a date BACKEND/node_modules/**`

**Interfaces:**
- Produces: root `.gitignore` that later phases extend; `.env.example` documenting `MONGODB_URI`, `JWT_SECRET`, `PORT`, `DNS_SERVERS`.

- [ ] **Step 1: Branch from `main`**

Run: `git switch -c phase-0-security`

- [ ] **Step 2: Untrack the secret file and `node_modules` before anything is staged**

Run:
```bash
git rm --cached "Its a date BACKEND/.env"
git rm -r --cached -q "Its a date BACKEND/node_modules"
```
Expected: both now show as `D` in `git status`, and the files still exist on disk.

- [ ] **Step 3: Write root `.gitignore`**

Must ignore: `node_modules/`, `.env`, `.env.*` (with `!.env.example` re-included), `dist/`, `build/`, `coverage/`, `.DS_Store`, `npm-debug.log*`, `.open-design/.checks/`, `.open-design/**/exports/`, `*.log`.

- [ ] **Step 4: Write `Its a date BACKEND/.env.example`**

```
# MongoDB Atlas connection string. Must include the database name after the host.
# Production: /ItsADate   Local development: /itsadate_dev
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.otr3nqw.mongodb.net/itsadate_dev?retryWrites=true&w=majority
# Long random string. Generate: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET=
# Optional: only if Node can't resolve mongodb+srv on your machine (seen on some Windows setups)
DNS_SERVERS=1.1.1.1,8.8.8.8
```

- [ ] **Step 5: Verify nothing secret or vendored is staged**

Run: `git add .gitignore "Its a date BACKEND/.env.example" "Its a date BACKEND/connection.js" DESIGN.md docs .open-design .claude/agents && git status --short | grep -v "^D " ; git ls-files | grep -cE "node_modules|(^|/)\.env$"`
Expected: staged additions are only those paths (the design system, specs/plans, style tiles; `.open-design/.checks` and `exports` are ignored); the count is `0`.

- [ ] **Step 6: Verify the backend still starts from a clean install**

Run: `cd "Its a date BACKEND" && rm -rf node_modules && npm ci && node -e "require('./connection')" && cd ..`
Expected: install succeeds; no error.

- [ ] **Step 7: Commit**

```bash
git commit -m "chore: stop tracking .env and node_modules, add env example

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Dev database, admin reset script

**Files:**
- Create: `Its a date BACKEND/scripts/copy-to-dev.js`
- Create: `Its a date BACKEND/scripts/reset-admins.js`
- Modify: `Its a date BACKEND/package.json` (scripts)

**Interfaces:**
- Produces: `npm run copy-to-dev` and `npm run reset-admins -- --email <email> --name <name>`.

- [ ] **Step 1: `copy-to-dev.js`**

Uses `MONGODB_URI` from `.env`. Connects to the cluster, copies every document of `users`, `dates`, `tags` from DB `ItsADate` into `itsadate_dev`, dropping the dev collections first. Refuses to run if the target name equals the source name. Prints counts per collection.

- [ ] **Step 2: `reset-admins.js`**

Parses `--email` and `--name` (exits with usage if missing). Prompts for a password with hidden input (Node `readline`, muted output), minimum 12 characters. Then:
1. `updateMany({}, { $set: { isAdmin: false } })`.
2. Upsert the user with that email (lowercased): set `name`, `isAdmin: true`, `password: bcrypt.hash(pw, 10)`.

Prints the number of demoted accounts and the admin's email. Takes `--db <name>` (default: the DB in `MONGODB_URI`) and prints the target DB name, then asks `Type the DB name to confirm:` before writing.

- [ ] **Step 3: Verify on dev**

Run `npm run copy-to-dev`. Expected: users 35, dates 20, tags 8 (current prod counts). Change the local `.env` DB name to `itsadate_dev`. Run `npm run reset-admins -- --email you@example.com --name Owner` twice. Expected after both runs: `db.users.countDocuments({isAdmin:true}) === 1`.

- [ ] **Step 4: Commit**

```bash
git add "Its a date BACKEND/scripts" "Its a date BACKEND/package.json"
git commit -m "chore(api): dev DB copy and admin reset scripts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Lock down admin routes on the live API

**Files:**
- Create: `Its a date BACKEND/middleware/requireAdmin.js`
- Modify: `Its a date BACKEND/Routers/dateRouter.js`, `Its a date BACKEND/Routers/tagRouter.js`, `Its a date BACKEND/Routers/userRouter.js`
- Modify: `Its a date BACKEND/server.js` (port from env)

**Interfaces:**
- Produces: `module.exports = requireAdmin` — Express middleware `(req, res, next)`; on success sets `req.user` to the Mongoose user doc.

- [ ] **Step 1: Implement `requireAdmin(req, res, next)`**

Reads `Authorization: Bearer <token>`; missing, malformed or failed verification → `401 { message: "Please log in as an admin" }`. `jwt.verify(token, process.env.JWT_SECRET)` returns the email string; look up `User.findOne({ email })`; not found or `!isAdmin` → `403 { message: "Admins only" }`. Wrap everything in try/catch so a bad token can never produce a 500.

- [ ] **Step 2: Apply it and remove admin self-registration**

- `dateRouter`: add `requireAdmin` to `GET /review`, `DELETE /delete/:id`, `PUT /accept/:id`. Register `/review` before `/:id`, as it is now.
- `tagRouter`: add it to `POST /create` and `DELETE /delete/:id`.
- `userRouter`: delete the `POST /register/admin` route. Keep `/login/admin`.
- `server.js`: `app.listen(process.env.PORT || 4000, ...)`.

- [ ] **Step 3: Verify with a local server against the dev DB**

The local `.env` must point at `itsadate_dev` (Task 2). Never run these checks against `ItsADate`: one of them registers a user. Then run `npm start` in `Its a date BACKEND` and, in another shell:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE localhost:4000/date/delete/000000000000000000000000            # 401
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer" localhost:4000/date/review                     # 401
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer garbage" localhost:4000/date/review             # 401
OLD=$(node -e "console.log(require('jsonwebtoken').sign('x@y.z','potatopotato6'))")
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $OLD" localhost:4000/date/review                # 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:4000/user/register/admin -H "Content-Type: application/json" -d '{}'   # 404
```
Then register a normal user via `POST /user/register`, use its token on `GET /date/review`. Expected: `403`.
Then `GET /date/` and `GET /tag/`. Expected: `200` with data (public routes unchanged).

- [ ] **Step 4: Commit**

```bash
git add "Its a date BACKEND/middleware/requireAdmin.js" "Its a date BACKEND/Routers" "Its a date BACKEND/server.js"
git commit -m "fix(api): require admin token on admin routes, remove open admin signup

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: Send the admin token from the old admin panel

**Files:**
- Modify: `its-a-date-frontend/src/components/AdminPanel.js`

**Interfaces:**
- Consumes: Task 3's header contract `Authorization: Bearer <token>`, with the token from `localStorage.getItem("token")`.

- [ ] **Step 1: Add the header to every admin call**

Use one `const authHeaders = () => ({ headers: { Authorization: \`Bearer ${localStorage.getItem("token")}\` } })` and pass it to the review `get`, accept `put` and reject `delete` calls. Remove the "Create An admin" form and the `createAdmin` function. On a 401/403 response, clear the token, show the login form, and alert the server's `message`.

- [ ] **Step 2: Verify the build**

Run: `cd its-a-date-frontend && CI=false npx react-scripts build && rm -rf build && cd ..`
Expected: "Compiled" (warnings allowed, no errors).

- [ ] **Step 3: Verify against the local API**

Temporarily point the four admin URLs at `http://localhost:4000` (do not commit that). Log in as the admin from Task 2 at `/Admin`. Expected: the review queue loads; accept and reject work. Logged in as a normal user: the panel shows "Admins only". Revert the URL change.

- [ ] **Step 4: Commit**

```bash
git add its-a-date-frontend/src/components/AdminPanel.js
git commit -m "fix(web): send admin token, drop create-admin form

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: Ship to production (owner-gated)

- [ ] **Step 1: Pre-flight check of Render env**

Run: `curl -s https://its-a-date-backend-pm.onrender.com/date/ | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).dates.length))"`
Expected: `19` (or more). If `0`, Render's `MONGODB_URI` lacks `/ItsADate`. **Stop and ask the owner to fix it**; merging without that takes the site down.

- [ ] **Step 2: Push and open a PR into `main`**

```bash
git push -u origin phase-0-security
gh pr create --base main --title "Phase 0: security hotfix and repo hygiene" --body-file <(printf "Stops tracking .env and node_modules, locks admin routes, removes open admin signup, adds dev DB + admin reset scripts.\n\nOwner steps after merge: run reset-admins against prod.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n")
```

- [ ] **Step 3: Owner merges, then runs `reset-admins` against prod**

The owner runs `npm run reset-admins -- --email <their email> --name <name> --db ItsADate` and confirms the DB name.

- [ ] **Step 4: Verify live**

After Render redeploys both services:
- `curl -s -o /dev/null -w "%{http_code}" -X DELETE https://its-a-date-backend-pm.onrender.com/date/delete/000000000000000000000000` → `401`.
- `GET /date/` → 19 ideas.
- Owner logs in at the live `/Admin` and sees the review queue.

- [ ] **Step 5: Create the integration branch**

Run: `git switch main && git pull && git switch -c modernize && git push -u origin modernize`

### Optional Task 6: Purge old secrets from git history (owner must approve)

Only with the owner's explicit yes: it rewrites history and needs a force-push to `main`. Credentials are already rotated, so this is cleanup, not a fix. Use `git filter-repo --path "Its a date BACKEND/.env" --invert-paths` on a fresh mirror clone, then force-push and ask GitHub support to purge cached views if needed.
