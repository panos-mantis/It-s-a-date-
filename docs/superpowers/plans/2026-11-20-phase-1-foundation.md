# Phase 1 — Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the repo into one TypeScript npm-workspaces monorepo (`apps/api`, `apps/web`, `packages/shared`) with lint, typecheck, tests, build and CI all green. Phases 2, 3 and 4 then start in parallel from it.

**Architecture:** npm workspaces. `packages/shared` holds Zod schemas and DTO types, consumed as TypeScript source by both apps. `apps/api` is an Express 5 + TS skeleton (`app.ts` builds the app, `server.ts` listens). `apps/web` is a Vite + React 19 + TS skeleton. The old code moves under `legacy/` folders for reference and is deleted by Phases 2 and 5.

**Tech Stack:** Node ≥22, npm workspaces, TypeScript (strict), Zod 4, Express 5, tsx (dev), tsup (api build), Vite + React 19, Vitest, Supertest, Testing Library, ESLint 9 flat config + typescript-eslint, Prettier, GitHub Actions. Use the latest stable release of each at install time; the lockfile records them.

**Spec:** `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md` §8.1, §8.3 (contracts), §8.8

## Global Constraints

- Work on branch `phase-1-foundation`, cut from `modernize` (Phase 0 Task 5).
- Use `git mv` for moves so history follows.
- Package names: `@itsadate/shared`, `@itsadate/api`, `@itsadate/web`. Root package `its-a-date`, `"private": true`.
- `engines.node: ">=22"`; `.nvmrc` = `22`.
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`, ESM everywhere (`"type": "module"`).
- `legacy/` folders are excluded from lint, typecheck, tests and build.
- No secrets in any committed file; `.env.example` only.
- Root scripts must exist with exactly these names (CI and later phases call them): `lint`, `typecheck`, `test`, `build`, `ci` (= lint && typecheck && test && build), `dev` (api + web together), `format`.

## Review Focus

- **Fresh clone on another machine:** `npm ci && npm run ci` at the root must pass with no local state (no `.env`, no global tools). Pinned by Task 5's verification.
- **A shared schema used by both apps drifts:** the web imports the same `ideaQuerySchema` the API validates with. Pinned by Task 2's tests, which parse the exact query strings the web will send (`"?budget=2&page=3"`), so coercion is tested, not assumed.
- **Mongo ObjectId strings:** IDs from the URL are validated as 24-hex before reaching the DB. Pinned by `objectIdSchema` tests (uppercase hex accepted, 23 chars rejected).
- **Password limits:** bcrypt silently truncates past 72 bytes. `registerSchema` caps the password at 72 characters, and a test pins it.
- **Windows dev machine:** scripts must not use POSIX-only syntax (`VAR=x cmd`, `rm -rf`, single quotes in JSON scripts). Pinned by running `npm run ci` on the owner's Windows PC in Task 5.

---

### Task 1: Workspace skeleton, move old code, tooling

**Files:**
- Move: `Its a date BACKEND/` → `apps/api/legacy/` (without `node_modules`)
- Move: `its-a-date-frontend/` → `apps/web/legacy/` (without `node_modules`)
- Create: `package.json`, `.nvmrc`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`
- Modify: `.gitignore` (from Phase 0)

**Interfaces:**
- Produces: `tsconfig.base.json`, which every workspace `extends`; root scripts per Global Constraints; ESLint config with `globalIgnores(['**/legacy/**', '**/dist/**', '**/coverage/**', '.open-design/**'])`.

- [ ] **Step 1: Branch and move**

First, stop any running `node`/`npm` processes for this repo; on Windows, open handles block the folder rename. Then delete the on-disk `node_modules` in both old folders. They're untracked since Phase 0, and deleting them first keeps the move fast and avoids locked-file errors.

```bash
git switch modernize && git pull && git switch -c phase-1-foundation
mkdir -p apps/api apps/web
git mv "Its a date BACKEND" apps/api/legacy
git mv its-a-date-frontend apps/web/legacy
```

**Keep the owner's local `.env`.** `Its a date BACKEND/.env` is untracked, git-ignored and can't be recovered if lost: it holds the rotated DB password and points at `itsadate_dev`. After the move, check that it is at `apps/api/legacy/.env`. If git left it behind in the old folder, move it there by hand. Never delete it, print it or stage it. Until Phase 2 replaces them, the legacy scripts (`reset-admins`, `copy-to-dev`) run from `apps/api/legacy` and read that file. When the new API first needs the database (Phase 2), the owner copies the values into `apps/api/.env`. Expected afterwards: `Its a date BACKEND/` and `its-a-date-frontend/` no longer exist, and `git check-ignore apps/api/legacy/.env` prints the path.

- [ ] **Step 2: Root `package.json`**

`workspaces: ["packages/*", "apps/*"]`, the root scripts from Global Constraints delegating with `npm run <x> --workspaces --if-present`, and `dev` using `concurrently` to run `npm run dev -w @itsadate/api` and `npm run dev -w @itsadate/web`. Dev deps at the root: `typescript`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `globals`, `prettier`, `concurrently`.

- [ ] **Step 3: Configs**

- `tsconfig.base.json`: `target ES2022`, `module ESNext`, `moduleResolution Bundler`, plus the strict flags from Global Constraints, `skipLibCheck`, `isolatedModules`, `resolveJsonModule`.
- `eslint.config.js`: recommended + typescript-eslint recommended-type-checked for `**/*.ts(x)`, react-hooks + jsx-a11y for `apps/web/**`, the ignores above.
- Prettier: `singleQuote: true`, `semi: true`, `printWidth: 100`.

- [ ] **Step 4: Verify**

Run: `npm install && npm run lint`
Expected: install ok; lint exits 0 (nothing to lint yet besides configs).

- [ ] **Step 5: Commit**

```bash
git add -A && git status --short | grep -E "\.env$|node_modules" ; git commit -m "chore: npm workspaces skeleton, move legacy apps, shared tooling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: the grep prints nothing before the commit runs.

### Task 2: `packages/shared` — contracts

**Files:**
- Create: `packages/shared/package.json` (`"exports": { ".": "./src/index.ts" }`, scripts `typecheck`, `test`, `lint`)
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/constants.ts`, `src/schemas/{common,auth,ideas,tags,ratings,places}.ts`, `src/dto.ts`, `src/index.ts` (re-exports all)
- Test: `packages/shared/src/schemas/*.test.ts`

**Interfaces (produces; Phases 2–6 use these names exactly):**

`constants.ts`:
- `ROLES = ['user', 'admin'] as const` → `type Role`
- `IDEA_STATUSES = ['pending', 'approved', 'rejected'] as const` → `type IdeaStatus`
- `BUDGETS = [1, 2, 3] as const` → `type Budget`; `BUDGET_LABELS: Record<Budget, string> = { 1: '$', 2: '$$', 3: '$$$' }`
- `DURATIONS = ['short', 'half-day', 'full-day'] as const` → `type Duration`; `DURATION_LABELS: Record<Duration, string> = { short: '1–2 hours', 'half-day': 'Half day', 'full-day': 'Full day' }`
- `PLACE_TYPES = ['none', 'restaurant', 'sushi', 'cafe', 'bar', 'park', 'viewpoint', 'museum', 'cinema', 'theatre', 'climbing_gym', 'bowling', 'escape_room', 'spa', 'beach'] as const` → `type PlaceType`
- `SORTS = ['new', 'top'] as const` → `type IdeaSort`
- `PAGE_SIZE_DEFAULT = 24`, `PAGE_SIZE_MAX = 48`
- `PLACES_RADIUS_DEFAULT_M = 3000`, `PLACES_RADIUS_MAX_M = 10000`, `PLACES_RESULTS_MAX = 20`

`schemas/common.ts`: `objectIdSchema` (string, `/^[a-f\d]{24}$/i`), `paginationSchema` (`page` coerced int ≥1 default 1, `pageSize` coerced int 1..48 default 24).

`schemas/auth.ts`: `registerSchema { name: trim 2..50, email: email lowercased+trimmed, password: 8..72 }`, `loginSchema { email, password: 1..72 }`.

`schemas/tags.ts`: `tagCreateSchema { name: trim 2..30, icon: string 1..40 }`, `tagUpdateSchema = tagCreateSchema.partial()`.

`schemas/ideas.ts`:
- `imageSchema { url: url, publicId: string 1..200 }`
- `ideaCreateSchema { title: trim 3..80, description: trim 20..2000, image: imageSchema, tagIds: objectId[] 1..3, placeType: enum PLACE_TYPES, budget: coerced enum BUDGETS, duration: enum DURATIONS }`
- `ideaUpdateSchema = ideaCreateSchema.partial().extend({ status: enum IDEA_STATUSES optional })`
- `ideaQuerySchema = paginationSchema.extend({ q: trim 1..100 optional, tag: slug string optional, budget: coerced enum BUDGETS optional, duration: enum optional, sort: enum SORTS default 'new' })`

`schemas/ratings.ts`: `ratingSchema { value: int 1..5 }`.

`schemas/places.ts`: `placesQuerySchema { ideaId: objectId, lat: coerced −90..90, lng: coerced −180..180, radius: coerced int 500..10000 default 3000 }`, `geocodeQuerySchema { q: trim 2..120 }`.

Every schema exports its inferred input type: `RegisterInput`, `LoginInput`, `TagCreateInput`, `TagUpdateInput`, `IdeaCreateInput`, `IdeaUpdateInput`, `IdeaQuery`, `RatingInput`, `PlacesQuery`, `GeocodeQuery`.

`dto.ts` (types only):
- `UserDTO { id: string; name: string; email: string; role: Role }`
- `TagDTO { id: string; name: string; slug: string; icon: string }`
- `IdeaDTO { id; title; description; image: { url: string; publicId: string } | null; tags: TagDTO[]; placeType: PlaceType; budget: Budget | null; duration: Duration | null; status: IdeaStatus; ratingAvg: number; ratingCount: number; saveCount: number; creator: { id: string; name: string }; createdAt: string; myRating: number | null; saved: boolean }`
- `Paginated<T> { items: T[]; page: number; pageSize: number; total: number }`
- `PlaceDTO { name: string; lat: number; lng: number; distanceM: number; address?: string; website?: string }`
- `ApiErrorBody { error: { code: ApiErrorCode; message: string; details?: unknown } }` with `ApiErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'RATE_LIMITED' | 'INTERNAL'`

- [ ] **Step 1: Write failing tests** (`*.test.ts` next to each schema)

```ts
// common.test.ts
expect(objectIdSchema.safeParse('64D74918B329DB37043BEF9E').success).toBe(true);
expect(objectIdSchema.safeParse('64d74918b329db37043bef9').success).toBe(false);
expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 24 });
expect(paginationSchema.safeParse({ pageSize: '49' }).success).toBe(false);

// auth.test.ts
expect(registerSchema.parse({ name: ' Ana ', email: ' Ana@X.com ', password: '12345678' }))
  .toEqual({ name: 'Ana', email: 'ana@x.com', password: '12345678' });
expect(registerSchema.safeParse({ name: 'Ana', email: 'a@x.com', password: 'x'.repeat(73) }).success).toBe(false);
expect(registerSchema.safeParse({ name: 'Ana', email: 'a@x.com', password: '1234567' }).success).toBe(false);

// ideas.test.ts — query strings exactly as the web sends them
expect(ideaQuerySchema.parse(Object.fromEntries(new URLSearchParams('budget=2&page=3'))))
  .toEqual({ budget: 2, page: 3, pageSize: 24, sort: 'new' });
expect(ideaQuerySchema.safeParse({ budget: '4' }).success).toBe(false);
expect(ideaQuerySchema.safeParse({ sort: 'old' }).success).toBe(false);
expect(ideaCreateSchema.safeParse({ ...validIdea, tagIds: [] }).success).toBe(false);
expect(ideaCreateSchema.safeParse({ ...validIdea, tagIds: [id, id, id, id] }).success).toBe(false);
expect(ideaCreateSchema.safeParse({ ...validIdea, description: 'too short' }).success).toBe(false);

// ratings.test.ts
expect(ratingSchema.safeParse({ value: 0 }).success).toBe(false);
expect(ratingSchema.safeParse({ value: 3.5 }).success).toBe(false);
expect(ratingSchema.parse({ value: 5 })).toEqual({ value: 5 });

// places.test.ts
expect(placesQuerySchema.parse({ ideaId: id, lat: '37.98', lng: '23.72' }).radius).toBe(3000);
expect(placesQuerySchema.safeParse({ ideaId: id, lat: '91', lng: '0' }).success).toBe(false);
expect(placesQuerySchema.safeParse({ ideaId: id, lat: '0', lng: '0', radius: '20000' }).success).toBe(false);
```

- [ ] **Step 2: Run to see them fail**

Run: `npm test -w @itsadate/shared`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement the constants, schemas and DTOs listed in Interfaces**

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -w @itsadate/shared && npm run typecheck -w @itsadate/shared`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add packages/shared && git commit -m "feat(shared): zod contracts and DTO types

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: `apps/api` skeleton

**Files:**
- Create: `apps/api/package.json` (deps `express@5`, `@itsadate/shared`, `zod`; dev `tsx`, `tsup`, `vitest`, `supertest`, `@types/express`, `@types/supertest`)
- Create: `apps/api/tsconfig.json`, `apps/api/tsup.config.ts` (bundles `@itsadate/shared` via `noExternal`), `apps/api/vitest.config.ts`
- Create: `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/.env.example` (moved from `legacy/`, plus `CORS_ORIGINS`, `NODE_ENV`)
- Test: `apps/api/src/app.test.ts`

**Interfaces:**
- Produces: `export function createApp(): Express` in `src/app.ts`, which mounts `GET /healthz` and an `/api/v1` router (empty for now; Phase 2 fills it). `src/server.ts` calls `createApp().listen(Number(process.env.PORT ?? 4000))`.
- Scripts: `dev` = `tsx watch src/server.ts`, `build` = `tsup`, `start` = `node dist/server.js`, `test` = `vitest run`, `typecheck` = `tsc --noEmit`, `lint` = `eslint src`.

- [ ] **Step 1: Failing test**

```ts
const res = await request(createApp()).get('/healthz');
expect(res.status).toBe(200);
expect(res.body).toEqual({ status: 'ok' });
const missing = await request(createApp()).get('/api/v1/nope');
expect(missing.status).toBe(404);
expect(missing.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
```

- [ ] **Step 2: Run: `npm test -w @itsadate/api`.** Expected: FAIL.

- [ ] **Step 3: Implement `createApp()`** with `express.json({ limit: '100kb' })`, the health route, and a JSON 404 handler typed with `ApiErrorBody` from `@itsadate/shared`.

- [ ] **Step 4: Verify** `npm test -w @itsadate/api && npm run build -w @itsadate/api && node apps/api/dist/server.js`; then `curl localhost:4000/healthz` returns `{"status":"ok"}`. Stop the server.

- [ ] **Step 5: Commit** `feat(api): typescript express 5 skeleton with health check` (with the Co-Authored-By trailer).

### Task 4: `apps/web` skeleton

**Files:**
- Create: `apps/web/package.json` (deps `react@19`, `react-dom@19`, `@itsadate/shared`; dev `vite`, `@vitejs/plugin-react`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/react`, `@types/react-dom`)
- Create: `apps/web/index.html`, `apps/web/vite.config.ts` (dev proxy `/api` → `http://localhost:4000`), `apps/web/tsconfig.json`, `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/test/setup.ts`
- Move: `apps/web/legacy/public/favicon.ico` → `apps/web/public/favicon.ico`
- Test: `apps/web/src/App.test.tsx`

**Interfaces:**
- Produces: a Vite app whose `App` renders `<h1>It's a Date</h1>`. Phase 3 replaces it. Dev server on port 5173 proxies `/api/*` to the API (the spec's same-origin cookie setup). Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `test` (`vitest run`), `typecheck`, `lint`.

- [ ] **Step 1: Failing test** — `render(<App />); expect(screen.getByRole('heading', { name: "It's a Date" })).toBeInTheDocument();`
- [ ] **Step 2: Run** `npm test -w @itsadate/web`. Expected: FAIL.
- [ ] **Step 3: Implement** the files listed above.
- [ ] **Step 4: Verify** `npm test -w @itsadate/web && npm run build -w @itsadate/web`. Expected: pass; `apps/web/dist/index.html` exists.
- [ ] **Step 5: Commit** `feat(web): vite react 19 typescript skeleton` (with trailer).

### Task 5: CI and the full-repo gate

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `README.md` section "Local setup (work in progress)", replacing the one-line README

**Interfaces:**
- Produces: a CI job `ci` on `push` and `pull_request`: `actions/checkout`, `actions/setup-node` with `node-version-file: .nvmrc` and `cache: npm`, `npm ci`, `npm run ci`.

- [ ] **Step 1: Write the workflow and README setup** (clone, `npm ci`, copy `apps/api/.env.example` → `apps/api/.env`, `npm run dev`).
- [ ] **Step 2: Fresh-clone verification on Windows**

Run in a temp dir: `git clone <repo path> fresh && cd fresh && git switch phase-1-foundation && npm ci && npm run ci`
Expected: lint, typecheck, test and build all pass.

- [ ] **Step 3: Commit, push, open the PR into `modernize`**

```bash
git add .github README.md && git commit -m "ci: lint, typecheck, test, build on every push

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin phase-1-foundation
gh pr create --base modernize --title "Phase 1: monorepo foundation" --body "Workspaces, shared contracts, api/web skeletons, CI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```
Expected: the GitHub Actions `ci` check goes green on the PR.
