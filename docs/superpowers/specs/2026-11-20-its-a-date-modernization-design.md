# It's a Date — Modernization Design

Date: 2026-11-20 · Status: approved by owner 2026-11-20

## 1. Intent

"It's a Date" is a full-stack app where people share date ideas, browse and filter them by tag, and (after this work) rate them and find matching places near them. It was built in mid-2023 as a course project: an Express + Mongoose API and a Create React App frontend.

The owner wants it to be **a portfolio piece that real people can also use**. That sets two bars at once:

- **Reviewer bar:** a hiring manager opening the repo should see clean, current architecture, types, tests, CI, a good README, and a polished UI.
- **User bar:** it must be secure (no public secrets, real authorization), not lose data, and work well on phones.

## 2. Current state (what exists today)

Repo: `panos-mantis/It-s-a-date-` (branch `main`), cloned to `C:\Users\manti\Desktop\New folder\its-a-date`.

**Backend** `Its a date BACKEND/` — CommonJS Express 4, Mongoose 7, bcrypt, jsonwebtoken.
- Routers `/user`, `/date`, `/tag`; controllers query models directly. No service layer, no validation library, no error middleware, no tests. Port 4000 hardcoded.
- Models: `User {name, email, password, isAdmin, personalRates[]}`, `Date {tittle, text, creator, overallRates[], image, review:boolean, tags: string[]}`, `Tag {tagName}`, `Ratings` (unused, ESM `export` in a CJS file).
- `review: true` means *approved*; new ideas start `false` and wait for an admin.
- JWT payload is the bare email string, signed with no expiry; the frontend sends it in the request **body**.
- **Security holes:** `.env` (Mongo URI with password, JWT secret) is committed; `POST /user/register/admin` is open to anyone; `DELETE /date/delete/:id` and `PUT /date/accept/:id` and tag create/delete have no auth at all; `node_modules` (3,591 files) is committed.
- Local-only change made during setup (uncommitted): `connection.js` honours an optional `DNS_SERVERS` env var, because Node's resolver can't resolve `mongodb+srv` SRV records on this Windows machine.

**Frontend** `its-a-date-frontend/` — CRA 5, React 18, React Router 6.
- 11 components; every component calls axios against a hardcoded `https://its-a-date-backend-pm.onrender.com` (7 files).
- Styling is a mix of Bootstrap 5, react-bootstrap, antd, Tailwind (installed, unused) and per-component CSS; three icon libraries.
- Firebase Storage config hardcoded in `src/config/firebase.js`; images upload straight from the browser, unauthenticated, keyed by original filename (collisions overwrite).
- Bugs: `TopNav` rendered outside `<Router>`; nav uses `<a href>` (full reloads); `BackTop` adds a scroll listener every render and always shows; `NotFound` route declared before `/Admin`; admin "reject" calls the open delete endpoint; no logout; no loading/error states beyond `alert()`.

**Data (production Atlas cluster, live):** 35 users, 20 date ideas (19 approved), 8 tags (`food`, `adventure`, `home`, `self-date`, …). Deployed API on Render responds today.
- **All 20 idea images are broken today:** every image URL is on Firebase Storage bucket `fir-learning-db85d.appspot.com` and returns HTTP 402 (Firebase now requires the paid plan for default buckets). The originals are not recoverable without paying.
- **12 accounts have `isAdmin: true`,** mostly test junk (`adminName`, `123`), because admin sign-up was open. Emails are not unique: several addresses appear 2–6 times.

## 3. Goals

1. **Security first:** no secrets in git, rotated credentials, real role-based authorization, input validation everywhere, rate-limited auth.
2. **Modern, explainable architecture:** one TypeScript monorepo; layered API; typed contracts shared between API and web.
3. **Modern frontend:** Vite + React + TypeScript, Tailwind only, one data-fetching layer, accessible forms, responsive.
4. **New look:** the chosen **Coral Friendly** style (Airbnb feel, own brand) applied to every page, designed with Open Design before it is coded.
5. **Ratings:** logged-in users rate ideas 1–5 stars, one rating per user per idea, editable; average + count shown; sort by top rated.
6. **Nearby places:** each idea has a place type; on an idea's page, "Find places near me" shows matching real places on a map using the browser's location.
6b. **Airbnb-style extras:** save ideas with a heart (a "Saved" list on the profile); each idea has a **budget** ($ / $$ / $$$) and a **duration** (1–2 hours / half day / full day), shown on cards and usable as filters.
7. **Quality signals:** automated tests, CI on every push, a README with screenshots, architecture notes, and a live demo.
8. **Keep the data:** existing users can still log in with their passwords; existing ideas and tags survive a migration.

## 4. Non-goals

- No rewrite into Next.js or another framework (considered and rejected, see §6).
- No social login, email verification, password reset emails, comments, messaging, or native mobile app in this round.
- No paid map/places API.
- No dark mode (the style is light-only; may come later).

## 5. Anti-goals (would be a failure even if it "works")

- Any secret (DB password, JWT secret, service-account key) ends up in git again.
- Existing users lose their accounts or ideas.
- The app looks like an Airbnb clone (their red `#FF385C`, Cereal font, logo or name).
- Over-engineering that a reviewer can't follow in 10 minutes (microservices, tRPC/GraphQL layers, DDD ceremony).
- The production database is used for development or tests.

## 6. Approaches considered

| | A. Modernize both apps in one TS monorepo **(chosen)** | B. Rewrite as one Next.js app |
|---|---|---|
| Shape | Express API + React SPA, npm workspaces, shared types | Single full-stack app, server actions, Auth.js |
| Risk | Incremental; the app works between phases | Big-bang; nothing works until most is rebuilt |
| Portfolio story | "I took a legacy app and modernized it": classic, easy to explain | Trendier stack, but a rewrite, and the Express work disappears |
| Parallel agents | Phases split cleanly between API and web | Mostly sequential |

**Picked: A** (owner's choice), because it serves both bars with the least risk and maps cleanly onto one agent per phase.

## 7. Decided by the owner

- Approach A.
- Scope includes **ratings and nearby places**, plus **saves (heart), budget and duration**.
- Photos move to **Cloudinary (free tier)**; Firebase is dropped. The 20 lost images are replaced (see 8.5).
- **Every existing account becomes a normal user**; a fresh admin account for the owner is created with a setup script.
- Look: **Airbnb feel**, built with the Open Design kit. Chosen style tile: **Coral Friendly** (from three explored: Rose Romance, Coral Friendly, Sunset Playful). Saved as the project's design system; the full spec is in `/DESIGN.md` (tokens in its front matter) and `.open-design/design-systems/style-tiles-for-it-s-a-date-a-web-app-where-peop/`.
  - Cream `#FBF6F0` canvas, warm brown text `#2A1A14`, coral `#F06A4C` accent used as a fill **with dark text** (never white on coral), coral-ink `#B23E23` for coral text, coral-soft `#FDE7DE` chips.
  - Fraunces (SOFT axis on, italic phrase in headlines) + DM Sans. Radii 10/16/20/pill. Borderless photo-first cards, sticky pill search bar, centred category icon row.

## 8. The design (calls made by Claude unless marked above; the owner can override any)

### 8.1 Repository layout

```
its-a-date/
  apps/
    api/          Express 5 + TypeScript
    web/          Vite + React 19 + TypeScript
  packages/
    shared/       Zod schemas + inferred types shared by api and web
  docs/           specs, plans, ADRs, architecture diagram
  .open-design/   design system + design mockups (kept in git)
  DESIGN.md
  .github/workflows/ci.yml
```
npm workspaces (npm is already installed; no extra tool). Node 22+ (`engines`), `.nvmrc`. The old `Its a date BACKEND/` and `its-a-date-frontend/` folders are moved into `apps/` with `git mv` first so history follows, then rewritten in place.

### 8.2 Security and secrets (Phase 0, before anything else)

- Untrack `node_modules/` and `.env`; root `.gitignore`; `.env.example` per app with every variable documented.
- **Owner rotates** the Atlas DB user password and the JWT secret (only they can). Purging the old `.env` from git history is optional once rotated; the plan offers it as a separate, owner-confirmed step because it rewrites history and needs a force-push.
- Separate databases: `itsadate` (prod), `itsadate_dev` (local dev, same cluster, different DB name), in-memory MongoDB for tests. A seed script fills dev with sample tags and ideas.
- Env is validated at boot with Zod; the app refuses to start with missing or weak secrets.
- The `DNS_SERVERS` workaround is kept as an optional, documented env var.
- **Protect the live site now (hotfix on `main`):** the old API stays in production until Phase 7, so Phase 0 also ships a minimal patch to it: remove `POST /user/register/admin`; require a valid admin token on accept/delete/reject and tag create/delete. Deployed to Render right away.
- **Rotation runbook:** rotating the DB password takes the live API down until Render's `MONGODB_URI` is updated, so the owner changes Atlas and Render together; rotating `JWT_SECRET` logs everyone out once (accepted).

### 8.3 API (`apps/api`)

- **Layers:** `routes → controllers (HTTP only) → services (business rules) → repositories (Mongoose)`; `middleware/` (auth, validate, error, rate limit); `config/env.ts`; `app.ts` (builds the app, testable) vs `server.ts` (listens).
- **Contracts:** request/response schemas live in `packages/shared` (Zod); a `validate(schema)` middleware parses `body/query/params`. Consistent error shape `{ error: { code, message, details? } }` and status codes (400/401/403/404/409/422/429/500).
- **Resources (REST, `/api/v1`):**
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
  - `GET /ideas?q=&tag=&budget=&duration=&sort=new|top&page=` (approved only), `GET /ideas/:id`, `POST /ideas` (auth), `GET /admin/ideas?status=pending`, `PATCH /admin/ideas/:id` (approve/edit), `DELETE /admin/ideas/:id`
  - `PUT /ideas/:id/save`, `DELETE /ideas/:id/save`, `GET /me/saved`, `GET /me/ideas` (auth)
  - `GET /tags`, `POST /admin/tags`, `PATCH /admin/tags/:id`, `DELETE /admin/tags/:id`
  - `PUT /ideas/:id/rating` (auth, body `{ value: 1..5 }`), `DELETE /ideas/:id/rating`
  - `GET /places?ideaId=&lat=&lng=&radius=` (see 8.6)
  - `POST /uploads/image` (auth; see 8.5)
  - `POST /admin/users/:id/role` (admin promotes/demotes)
- **Auth:** bcrypt kept (existing hashes stay valid). JWT `{ sub: userId, role }`, 7-day expiry, in an **httpOnly, Secure, SameSite=Lax cookie**. The web app calls the API through a same-origin `/api` rewrite on the host (Vercel) so the cookie is first-party. `requireAuth` and `requireRole('admin')` middleware. Admin self-registration removed; the first admin is created with a CLI script (`npm run create-admin -w api`).
- **Hardening:** `helmet`, CORS allow-list from env, `express-rate-limit` on auth routes, body size limit, `pino` structured logging with request ids, graceful shutdown, `/healthz`.
- **Data model (Mongoose 8, typed):**
  - `User { name, email (unique, lowercased), passwordHash, role: 'user'|'admin', createdAt }`
  - `Tag { name, slug (unique), icon }` (icon = a Lucide icon name for the category row)
  - `Idea { title, description, image: { url, publicId }, tags: ObjectId[]→Tag, placeType, budget: 1|2|3|null, duration: 'short'|'half-day'|'full-day'|null, creator: ObjectId→User, status: 'pending'|'approved'|'rejected', ratingAvg, ratingCount, saveCount, createdAt, updatedAt }` with indexes on `status+createdAt`, `status+ratingAvg`, `tags`, `budget`, `duration`, and a text index on title/description. Budget and duration are required for new ideas; existing ideas start `null` (the card hides that line) until an admin fills them.
  - `Rating { idea, user, value 1..5, createdAt, updatedAt }`, unique index `(idea, user)`. `ratingAvg/Count` on the idea are updated in the same service call (aggregation recompute; simple and correct at this scale).
  - `Save { user, idea, createdAt }`, unique index `(user, idea)`; `saveCount` kept on the idea.
- **Migration script** (`npm run migrate -w api`, idempotent, dry-run flag, run against a backup first): rename `tittle→title`, `text→description`, `review:bool→status`, tag name strings → Tag ObjectIds (creating slugs), `password→passwordHash`, drop `overallRates/personalRates`; collection `dates→ideas`. **Every user gets `role: 'user'`** (all `isAdmin` flags dropped). **Duplicate emails** are merged: keep the oldest account per lowercased email, reassign its duplicates' ideas to it, delete the rest, then build the unique email index. Assign a default `placeType` per tag (editable in admin). Replace the broken Firebase images as described in 8.5.
- **Sample content (owner request):** `npm run seed -w api` loads a curated starter set so the app never looks empty: about 30 realistic date ideas spread across every tag (at least 3 per tag), each with a fitting free-licence photo (Unsplash licence, credited) uploaded to Cloudinary, a real-sounding title and 2–4 sentence description in the DESIGN.md voice, a place type, budget and duration. Ideas are authored by a few sample users and carry a believable spread of ratings and saves, so "top rated" sorting and stars show real variety. The data lives in a typed file in the repo (`apps/api/src/seed/ideas.ts`). Idempotent (matched by a stable `seedKey`), with `--reset` for dev. In **dev** it runs with sample users and ratings. In **production** it runs once at cutover, inserting the ideas as approved under a visible "It's a Date team" account with no fake ratings, so live numbers stay honest. It is removable by `seedKey`. Until the new seed exists (Phase 2), dev uses the migrated copy of the real data.
- **Admin bootstrap:** `npm run create-admin -w api -- --email … --name …` prompts for a password and creates (or promotes) one admin. The owner runs it once per environment.
- **Tests:** Vitest + Supertest + mongodb-memory-server; services unit-tested, every route integration-tested including authz failures. Target: all routes covered; coverage reported in CI.

### 8.4 Web (`apps/web`)

- Vite, React 19, TypeScript strict, React Router 7 (data/library mode), TanStack Query for server state, React Hook Form + Zod resolvers (schemas from `packages/shared`), a single typed `api` client (fetch wrapper, base `/api/v1`, `credentials: 'include'`).
- **Styling:** Tailwind CSS v4 only. The Coral Friendly tokens are imported into Tailwind's `@theme` (colors, fonts, radii, shadows, spacing) so classes like `bg-accent text-accent-on rounded-lg` map 1:1 to `DESIGN.md`. Bootstrap, react-bootstrap, antd, FontAwesome and react-icons removed; icons = `lucide-react`. Fonts self-hosted via `@fontsource-variable/fraunces` and `@fontsource-variable/dm-sans`.
- **Structure (feature folders):** `app/` (router, providers, layout), `features/{auth,ideas,ratings,places,admin}/` (each with `api.ts` hooks, components, pages), `components/ui/` (Button, Input, Chip, Card, StarRating, SearchBar, CategoryRow, Skeleton, EmptyState, Toast), `lib/`.
- **Pages:** Home (search bar, category row, idea grid, sort new/top), Idea detail (photo, description, rating, save, budget/duration, tags, nearby map), Share an idea (form with image upload + preview, tag, place type, budget, duration), Log in / Sign up, Profile (my ideas + status, Saved), Admin (pending queue, edit ideas incl. budget/duration/place type, tag manager, users), 404.
- **Search bar on Home** (adapts DESIGN.md's "Where / When / Vibe" to real data): **What** (text search `q`) / **Vibe** (tag) / **Budget**; a duration filter sits in a "Filters" pill next to it. There is no location field on Home: places are found per idea. Filters live in the URL query string so results are shareable. The design agents must use these segments, not "Where / When".
- **Card meta line:** budget + duration (e.g. "$$ · Half day"), not distance. The heart on the photo toggles a save (logged-out users are sent to log in).
- **UX rules:** loading skeletons, empty and error states, toasts instead of `alert()`, protected routes, logout, keyboard and screen-reader friendly (labels, focus rings, alt text), responsive down to 360px, `prefers-reduced-motion` honoured.
- **Tests:** Vitest + Testing Library for components and hooks (MSW for API mocks); Playwright smoke test for the main flow (browse → sign up → share idea → admin approves → rate).

### 8.5 Image uploads

**Cloudinary (free tier)** replaces Firebase, which is removed entirely (client SDK, hardcoded config, dependency).
- The browser sends the file to `POST /uploads/image` (auth, multer memory storage, 5 MB limit, JPEG/PNG/WebP only, magic-byte check). The API uploads it server-side with the Cloudinary SDK under a random id in a folder per environment (`itsadate/prod`, `itsadate/dev`; tests mock the SDK), and returns `{ url, publicId }`. Cloudinary credentials live only in API env vars.
- Delivery uses Cloudinary URL transforms (`f_auto,q_auto,c_fill`, widths 400/800/1600 via `srcset`); no local `sharp` step.
- Deleting or replacing an idea's image deletes the old asset by `publicId`.
- **The 20 lost images:** the migration sets each existing idea's image from a curated list of free-licence photos (Unsplash licence) chosen to match each idea's title, uploaded to Cloudinary; the list lives in the migration script with photo credits. Admins can replace any of them later.

### 8.6 Nearby places

- Data: **OpenStreetMap** via the Overpass API (free, no key). Map: **Leaflet** (`react-leaflet`) with OSM tiles and the required attribution.
- Each idea has a `placeType` from a fixed, curated list in `packages/shared` (e.g. `restaurant:sushi`, `cafe`, `park`, `climbing_gym`, `museum`, `cinema`, `bar`, `viewpoint`, `bowling`, `escape_room`, `none` for at-home ideas), each mapped to Overpass tag filters. Admins can change it.
- The API proxies the query (`GET /places`): rounds coordinates to ~1 km for privacy and cache hits, caches results in memory (LRU, 1 h TTL), rate-limits per IP, sets a proper User-Agent per OSM policy, times out at 10 s, and returns `{ name, lat, lng, distanceM, address?, website? }[]` sorted by distance (max 20, default radius 3 km, user can widen to 10 km).
- The web asks for location only after the user clicks "Find places near me"; on denial, a city/postcode text fallback geocodes via Nominatim (also proxied and cached). Ideas with `placeType: none` hide the button.

### 8.7 Design workflow with Open Design

- The design system is active for the project. Before coding each page, a design agent produces a high-fidelity prototype screen in `.open-design/` with the Open Design kit (Home, Idea detail, Share an idea, Auth, Admin; desktop + phone), runs its checks and the design critic, and gets owner sign-off on the Home and Idea detail screens.
- Approved screens are ported into React components with the kit's port-to-app step, following the existing component patterns in `apps/web`.
- After porting, the critic re-reviews a screenshot of the running app.

### 8.8 Tooling, CI, delivery

- ESLint (flat config, typescript-eslint, react-hooks, jsx-a11y), Prettier, `tsc --noEmit` per workspace, Husky + lint-staged pre-commit.
- GitHub Actions: install → lint → typecheck → test (api + web) → build on every push and PR.
- Deploy: API on **Render** (existing service, new env vars, health check `/healthz`); web on **Vercel** with a rewrite `/api/* → Render`. Deploy steps that touch the owner's accounts are done or confirmed by the owner.
- **Cutover (Phase 7):** a short announced maintenance window: back up the DB (`mongodump`), deploy the new API, run the migration, deploy the web app, smoke-test, then point the old frontend's address at the new site (redirect). Rollback = restore the dump and redeploy the old `main`.
- README rewritten: pitch, screenshots, live link, architecture diagram, tech choices with reasons, local setup in under 5 commands, test commands. Short ADRs in `docs/adr/` for the big calls (monorepo, cookie auth, OSM, Cloudinary via API).

### 8.9 Phases and agents

Each phase is one agent's job (or several in parallel where marked), on its own branch off `modernize`, ending with tests green and a review agent pass before merge.

| # | Phase | Depends on | Parallel with |
|---|---|---|---|
| 0 | Security & repo hygiene (untrack secrets/node_modules, env examples, owner rotates creds, dev DB, hotfix the live API) | — | — |
| 1 | Monorepo + TypeScript tooling + CI skeleton + `packages/shared` | 0 | — |
| 2 | API rebuild (layers, auth, validation, models, migration script, tests) | 1 | 3, 4 |
| 3 | Web foundation (Vite app, Tailwind tokens, UI kit, router, api client, auth flow) | 1 | 2, 4 |
| 4 | Page designs in Open Design (prototypes + critic + owner sign-off) | 1 | 2, 3 |
| 5 | Web pages built from approved designs on the new API | 2, 3, 4 | — |
| 6a | Ratings + saves (API + UI) | 5 | 6b |
| 6b | Nearby places (API proxy + map UI) | 5 | 6a |
| 7 | Cloudinary uploads + replacement photos, cutover (backup, migrate, deploy), README/ADRs, Playwright smoke, final critique | 6a, 6b | — |

Budget and duration are part of the core Idea model, so they are built in phases 2–5, not as a separate feature.

## 9. Left to the builder

Exact folder names inside features, component APIs, test file layout, Overpass query details per place type, exact skeleton/toast components, pagination size, ESLint rule tweaks, and the copy of empty/error states (following `DESIGN.md` voice).

## 10. Owner actions required

1. Rotate the Atlas DB password and JWT secret (Phase 0), updating Render's env vars at the same time, and put the new values in local `.env` files only.
2. Create a free Cloudinary account and put its cloud name / API key / secret in the API env (local and Render) — before Phase 7.
3. Approve the Home and Idea detail designs (Phase 4).
4. Run `create-admin` for your own admin account (dev now, prod at cutover).
5. Approve the cutover window and running the migration on production after a backup (Phase 7).
6. Confirm Vercel access for the web deploy (Phase 7). The old frontend is the Render static site "it's a date"; it gets a redirect to the new site at cutover. The live API is Render service "its a date backend pm"; the separate "it's a date backend" service (no env vars, failing) is unused and can be deleted.
7. Optional: approve purging the old `.env` from git history (force-push).

## 11. Calls Claude made after the builder review (check these)

- Phase 0 hotfixes the old live API rather than leaving its holes open until the cutover.
- Duplicate-email accounts are merged into the oldest one.
- Existing ideas get `null` budget/duration until an admin edits them, rather than guessed values.
- The Home search bar is **What / Vibe / Budget** (+ duration filter), not "Where / When / Vibe", because there's no location search across ideas.
- Replacement photos for the 20 old ideas are free-licence stock photos with credits.
- Cutover uses a short maintenance window with a `mongodump` backup and a documented rollback.
- Sample ideas go into production without fake ratings or saves, under an "It's a Date team" author; dev gets the full set with sample ratings.
