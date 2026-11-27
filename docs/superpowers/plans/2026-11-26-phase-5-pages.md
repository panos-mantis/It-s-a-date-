# Phase 5 — Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build every page in spec §8.4 (Home, Idea detail, Share an idea, Log in / Sign up, Profile, Admin, 404) in `apps/web` from the approved Phase 4 screens, on the Phase 2 API. Every page has its loading, empty and error states, works at 360px, and is axe-clean.

**Architecture:**
- Feature folders per spec §8.4: `features/ideas/` (data hooks, Home, Idea detail, Share), `features/profile/`, `features/admin/` and `features/tags/`, plus the existing `features/auth/`.
- The Phase 3 kit in `components/ui/` gets the restyles that `HANDOFF.md` §3 lists and the new components in §2.
- Server state goes only through TanStack Query. Filters live in the URL.
- Each page is ported from its screen in `.open-design/itsadate-screens/` with `port_open_design_artifact_to_app`, then wired to hooks. The screen file is the source of truth for layout and copy.
- Features with no API yet (saves, ratings, places, uploads) are not wired in this phase. Ruling P1 below says exactly what's left out.

**Tech Stack:** the Phase 3 stack, with no new runtime dependencies:
- Vite, React 19 and TypeScript strict
- `react-router` 7.x, data mode
- `@tanstack/react-query` 5
- `react-hook-form` with the Zod resolver and the `packages/shared` schemas
- Tailwind CSS v4
- `lucide-react`, imported one icon at a time
- tests: Vitest, Testing Library, MSW 3 and `axe-core`

**Spec:** `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md` §8.3 (API contract), §8.4 (web), §8.7 (port and re-critique).

**Read with it:**
- `.open-design/itsadate-screens/HANDOFF.md`, which this plan cites by section and ruling id (R…)
- `.open-design/itsadate-screens/content.md`
- `DESIGN.md`

## Status (2026-11-28): read this first if you're picking the phase up

**Tasks 1–12 are done.** Every page is built, has had its task review, and was checked against the real API on `itsadate_dev`. The pages have been re-critiqued against their screens and pass the final whole-branch review after one fix wave. `npm run ci` and `prettier --check` pass. **The only step left is Step 6: push, then open the PR into `modernize`. Ask the owner first.**

- **Branch:** `phase-5-pages`, from `modernize` at `ebfbaed`. Nothing is pushed.
- **Ledger:** `.superpowers/sdd/2026-11-26-phase-5-pages/progress.md`. It's git-ignored and exists only on the original machine. It holds every ruling, the deferred minor findings and the review reports.
- **Real-API check (Task 12 Step 1):** passed. A throwaway admin approved and undid, rejected, edited, added, renamed and deleted a tag, and changed roles. Every change was reverted. Two throwaway plain users remain in dev: `phase5-check-1795814746@itsadate-dev.test` and `phase5-check2-1795814746@itsadate-dev.test`.
- **Design re-critique (Step 2):** the verdict was "polish", and it was fixed in `e586eaa`. After the polish, Share, Profile and Admin were checked only by reading their CSS, so the owner click-test should look at those at 360px.

### Commits

| Task | Commits |
|---|---|
| Plan | `1af9bb0` |
| 1 Admin ideas search (API) | `0152f99` |
| 2 Tokens, Button, Chip, tag icons | `6b09a70`, `6748977` |
| 3 Card, StarRating, Toast | `bf8f98a`, `2350bfc`, `7af608e` |
| 4 Data layer, fixtures, MSW | `250debd`, `19e500f` |
| 5 Header, guards, auth, 404 | `50a50fc` |
| 6 Home | `ce22736`, `3631c9a` |
| 7 Idea detail | `e60eed5` |
| 8 Share an idea | `de91b01` |
| 9 Profile | `6a886f0`, `72f4e0d` |
| 10 Admin queue, all ideas, edit | `b0a7213`, `0ea3bab` |
| 11 Admin tags and users | `6d52556`, `239b975` |
| 12 Design polish, final-review fixes | `e586eaa`, `557fcf1` |

### Owner decisions to make (listed in the PR body too)

- **Edit validation.** Admin Edit validates every field, not only the ones that changed. A migrated idea that breaks a create rule can't be saved until it's fixed: for example, a description under 20 characters, or no tags left after a tag delete. Decide before the Phase 7 migration.
- **New copy to approve.** These strings aren't in the screens:
  - the duration clause in Home's no-match line
  - "We couldn't load more ideas / people. Check your connection and try again."
  - the Make admin confirm: "Make X an admin?" / "Admins can review ideas and manage tags and users."
  - "No tags yet."
  - "We couldn't load the tags." and "We couldn't load the people."
  - `No people match "q".` and "No people yet."
  - "You're no longer an admin."
- **Tag slugs.** Renaming a tag changes its slug, so old `?tag=` links stop matching. Home now shows the no-match state for those links.
- **Phone Back.** On phones, Back doesn't close the full-screen search sheet.
- **Delete-tag wording.** The delete-tag dialog wording is verbatim from `admin.html`.
- **Show/Hide toggle.** The Show/Hide password toggle changes its label and also sets `aria-pressed`. This follows the design.

## Rulings for this phase (binding unless the owner overturns them)

**P1. What waits for later phases.** The roadmap gives saves and ratings to 6a, places to 6b, and uploads to 7, and those endpoints don't exist yet (HANDOFF §4). So Phase 5 leaves these out:
- the heart on cards and on Idea detail
- the "Your rating" panel
- the places card
- Profile's Saved tab and the menu's "Saved ideas" item

It builds everything else as designed. Cards and Idea detail show the read-only rating summary.

- **The upload endpoint.** Share and Admin Edit call `POST /uploads/image`, using the contract in Task 4, but the endpoint arrives in Phase 7. Until then:
  - MSW tests cover the whole flow.
  - Against the real API, the photo step shows the upload-failed state.
- **Why.** Building UI with no endpoint means guessing at contracts that 6a, 6b and 7 own.
- **Cost if wrong.** Phase 6a adds the heart and rating to a finished page instead of wiring an existing one.

**P2. Admin ideas search.** Task 1 adds `q` to `adminIdeaQuerySchema` and the API, with the same regex search as `GET /ideas` (R31). It is the only API change in this phase.

**P3. Mock data.** MSW fixtures are typed DTOs in `apps/web/src/test/fixtures/`, built from `_shared/data.json` with tags, image and dates mapped (R37). Never cast the JSON.

**P4. Port, then wire.** Each page task first runs `port_open_design_artifact_to_app` on its screen file. It then rewrites the output onto the kit components (`data-component` → `components/ui/`) and the hooks. Copy comes verbatim from the screen file and HANDOFF §3 "Copy". The design-states toggle is never ported; its frames become real states (HANDOFF §1).

**P5. Page size.** Home loads 24 cards per page with "Show more" (`useInfiniteQuery`, `PAGE_SIZE_DEFAULT`), not the mock's 12.

## Global Constraints

**Branch and safety**
- Branch `phase-5-pages`, from `modernize` at `ebfbaed`. The PR goes into `modernize`.
- Never check out a commit from before Phase 0 (`e1cf2fe` or older).
- Never read, print, stage or delete any `.env`.

**Style** (`DESIGN.md`, binding)
- Cream `#FBF6F0` canvas.
- Coral `#F06A4C` only as a fill **with dark text** `#2A1A14`, never white on coral, and **at most two coral fills per screen state**. Coral text is `#B23E23`.
- Fraunces with `"SOFT" 100, "WONK" 0`, and at most one italic phrase per headline.
- DM Sans 400/500/600, never 700+. Set `strong, b { font-weight: 600 }`.
- Radii 10/16/20/pill. Lucide 1.75px icons.
- No gradients, glows or illustrations.
- Light only.

**Values** (from `packages/shared/src/constants.ts`)
- Budget labels come from `BUDGET_LABELS` and duration labels from `DURATION_LABELS`.
- Place-type labels:

  | Value | Label |
  |---|---|
  | `none` | No place needed |
  | `restaurant` | Restaurant |
  | `sushi` | Sushi |
  | `cafe` | Cafe |
  | `bar` | Bar |
  | `park` | Park |
  | `viewpoint` | Viewpoint |
  | `museum` | Museum |
  | `cinema` | Cinema |
  | `theatre` | Theatre |
  | `climbing_gym` | Climbing gym |
  | `bowling` | Bowling |
  | `escape_room` | Escape room |
  | `spa` | Spa |
  | `beach` | Beach |

- Limits:
  - title 3–80 characters
  - description 20–2000 characters
  - 1–3 tags
  - tag name 2–30 characters
- Search params `q tag budget duration sort page`. `sort` is `new | top`.

**Copy**
- Copy is sentence case, second person, in the DESIGN.md voice.
- These strings are verbatim:
  - the API strings in HANDOFF §3
  - `NETWORK_MESSAGE`
  - `authErrorMap`
- Copy that already exists in `apps/web` stays, except where HANDOFF §3 lists a change (R19, R33).

**Accessibility**
- Pages work at 360px with no horizontal scroll.
- Controls are keyboard and screen-reader friendly: labels, focus rings and alt text. Hit targets are at least 44px.
- `prefers-reduced-motion` is honoured.
- Every page test runs `axe` (`src/test/axe.ts`) with 0 violations.

**Code and testing**
- Icons: import each Lucide icon by name. Tag icons go only through the curated map in Task 2 (R38).
- Forms type their values with `z.input<typeof schema>`. Map 422 issues onto fields with `lib/form-errors.ts`.
- Query keys that start with `'auth'` survive logout. Per-user keys (`['me', …]`, `['admin', …]`) are cleared at login and logout, as Phase 3 already does.
- MSW is 3.x, so its option is `onUnhandledFrame`. `react-router` stays on 7.x.
- If npm hits arborist errors, run `npm i --package-lock-only`, then `npm i`.

**Gates and commits**
- Each task ends with these passing at the root: `npm run lint -w @itsadate/web`, `npm run typecheck -w @itsadate/web` and `npm test -w @itsadate/web`. The final task also runs `npm run ci` and `npx prettier --check .`.
- Every commit ends with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Filters in the URL.**
   - A shared link, Back and Forward each restore exactly the filters and sort.
   - Junk params (`budget=7`, `sort=hot`, `tag=Bad Tag`, `page=-1`) are treated as absent. They never crash, and never send an invalid query to the API.
   - Pinned in Task 4 (`parseIdeaSearch` tests) and Task 6 (Home navigation test).
2. **Missing and long data.**
   - Missing data:
     - `image: null` shows the placeholder.
     - `budget` or `duration` null hides the meta line, so it never reads "null · null".
     - `ratingCount: 0` shows no rating on cards, and "No ratings yet. Be the first." on the detail page.
   - Long data: the 80-character title, the 50-character name and the 2000-character description wrap and never push the page sideways.
   - Pinned in Task 3 (Card tests), Task 6 and Task 7 (fixtures that carry each case).
3. **Server errors.**
   - Network down or a 500 shows each page's error state with "Try again", never a blank page.
   - A 422 lands on its fields.
   - A 409 shows the API's message verbatim.
   - A 404 on `/ideas/:id`, which includes pending and rejected ideas, shows the not-found state.
   - Pinned in every page task's error test.
4. **Logged out, or not an admin.**
   - `/share`, `/profile` and `/admin` send you to `/login?next=…`, with the right hint, and back again after login.
   - A non-admin on `/admin` gets the R33 page.
   - Pinned in Task 5 and the page tasks.
5. **Stale lists after admin actions.**
   - Approve, reject, edit, delete, tag changes and role changes refresh every list that shows the item: the queue count, All ideas, Home's category row and the user's role chip.
   - Undo restores the state.
   - "You can't remove the last admin" leaves the role unchanged.
   - Pinned in Tasks 10 and 11.

---

### Task 1: Admin ideas search (API)

Agent: `itsadate-api`.

**Files:**
- Modify: `packages/shared/src/schemas/admin.ts`, `packages/shared/src/schemas/admin.test.ts`
- Modify: the admin ideas service and repository under `apps/api/src/features/admin/` and `apps/api/src/features/ideas/`
- Test: `apps/api/src/features/admin/admin-ideas.test.ts`

**Interfaces:**
- Produces: `GET /api/v1/admin/ideas?status=&q=&page=&pageSize=`. `q` is optional, 1–100 characters, trimmed, and an empty value means absent. Matching is the same case-insensitive, regex-escaped title/description match that `GET /ideas` uses. Reuse its helper; don't copy it.

- [ ] **Step 1: Failing tests**
  - Shared: `adminIdeaQuerySchema.parse({ q: '  pottery ' }).q === 'pottery'`; `parse({ q: '' }).q === undefined`; `safeParse({ q: 'x'.repeat(101) }).success === false`.
  - API: `admin ideas search › filters by q within the status` seeds two approved ideas ("Pottery night" and "Sunset picnic") and one pending "Pottery class". `GET /admin/ideas?status=approved&q=pottery` returns only "Pottery night".
  - API: `› treats regex characters literally`: `q=(` returns 200 and no items.
  - API: `› still needs an admin`: 403 for a normal user.
- [ ] **Step 2:** Run `npm test -w @itsadate/shared` and `npm test -w @itsadate/api`. Expected: the new tests fail.
- [ ] **Step 3:** Add `q` to `adminIdeaQuerySchema`, using the same preprocess as `ideaQuerySchema.q`. Pass it through the service to the repository filter.
- [ ] **Step 4:** Run both test suites again. Expected: PASS. Then run `npm run ci`. Expected: exit 0.
- [ ] **Step 5:** Commit `feat(api): search admin ideas by q`.

---

### Task 2: Tokens, base styles, Button, Chip, tag icons

**Files:**
- Modify: `.open-design/design-systems/style-tiles-for-it-s-a-date-a-web-app-where-peop/tokens.css`, `apps/web/src/styles/index.css`, `apps/web/tests/theme.test.ts`
- Modify: `apps/web/src/components/ui/Button.tsx`, `Chip.tsx` and their tests
- Create: `apps/web/src/lib/tag-icons.ts`, `apps/web/src/lib/tag-icons.test.ts`, `apps/web/src/lib/labels.ts`, `apps/web/src/lib/labels.test.ts`

**Interfaces:**
- Produces:
  - Tokens `--on-danger: #FFFDF9`, `--scrim: rgba(42, 26, 20, 0.36)` and `--focus-ring: rgba(240, 106, 76, 0.3)`, with Tailwind names `on-danger`, `scrim` and `focus-ring`.
  - Base layer `strong, b { font-weight: 600 }`. Buttons, links and controls get a 2px coral-ink `focus-visible` outline. Inputs keep the coral-ink border plus the 3px `focus-ring` ring (HANDOFF §3).
  - `Button` gains the props `busy?: boolean` and `tone?: 'default' | 'success' | 'danger'`, plus the variant `'danger'`. `busy` keeps the label, adds a spinner, sets `aria-disabled="true"` (not `disabled`) and ignores clicks. `tone` applies to `variant="ghost"` text buttons and underlines them on hover. `variant="danger"` is the danger fill with `on-danger` text, used only in confirm dialogs. `buttonClasses` takes the same options.
  - `Chip` gains `variant: 'accent' | 'quiet' | 'status' | 'role'`. `status?: 'pending' | 'approved' | 'rejected'` renders the icon and label "Pending review" (clock), "Approved" (circle-check) or "Not approved" (circle-x). `role?: 'admin' | 'user'` renders "Admin" (shield) or "User" (user).
  - `SelectableChip({ selected, disabled, icon, onToggle, children })` is a `<button aria-pressed>`. When picked, it shows a check icon in place of `icon`.
  - `lib/tag-icons.ts` exports `TAG_ICON_NAMES` (the 16 R38 names, in HANDOFF §3 order) and `tagIcon(name: string): LucideIcon`. Unknown names return `CircleHelp`.
  - `lib/labels.ts` exports `PLACE_TYPE_LABELS: Record<PlaceType, string>` (the Global Constraints table) and `ideaMeta(idea: Pick<IdeaDTO, 'budget' | 'duration'>): string | null`. It returns `"$$ · Half day"`, `"$$"` or `"Half day"`, and `null` when both are null.

- [ ] **Step 1: Failing tests**
  - `theme.test.ts` already compares tokens 1:1. Add the three tokens to `tokens.css` first and watch it fail.
  - `Button › busy keeps the label, sets aria-disabled and ignores clicks`.
  - `Button › danger variant uses on-danger text`, checked by class.
  - `Chip › status pending renders "Pending review" with an icon`.
  - `SelectableChip › toggles aria-pressed`.
  - `tagIcon('utensils') === Utensils`, `tagIcon('nope') === CircleHelp`, and `TAG_ICON_NAMES.length === 16`.
  - `ideaMeta({budget: 2, duration: 'half-day'}) === '$$ · Half day'`, and `ideaMeta({budget: null, duration: null}) === null`.
- [ ] **Step 2:** Run `npm test -w @itsadate/web`. Expected: the new tests fail.
- [ ] **Step 3:** Implement. `tagIcon` imports the 17 icon components one by one: the 16 names plus `CircleHelp`.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): tokens, button and chip variants, tag icon map`.

---

### Task 3: Card, StarRating, Toast

**Files:**
- Modify: `apps/web/src/components/ui/Card.tsx`, `StarRating.tsx`, `Toast.tsx` and their tests

**Interfaces:**
- **`Card` props.** It becomes `{ href?: string; title: string; image: { src: string; alt: string } | null; rating?: { value: number; count: number }; meta?: string | null; chip?: ReactNode; badge?: string; status?: { tone: 'pending' | 'approved' | 'rejected'; line: string }; action?: ReactNode }`.
  - Without `href`, the card isn't a link.
  - The `rating` slot is omitted when `count === 0` (R7).
  - The title clamps to two lines with `line-clamp-2` (R5).
  - The status badge sits on the photo's 94% cream overlay. The status line goes under the meta line.
  - The no-photo placeholder uses `ImageOff`.
- **`StarRating` summary.**
  - `format: 'card'` reads "4.7 (89)".
  - `format: 'detail'` reads "★ 4.7 · 89 ratings", and "No ratings yet. Be the first." when the count is 0.
  - The old coral "New" text goes.
- **`StarRatingInput`** is unchanged in this phase (P1).
- **`useToast().show`** becomes `show(message, opts?: { tone?: Tone; action?: { label: string; onAction: () => void } })`.
  - Plain toasts last 4 s, and toasts with an action 8 s.
  - The timer pauses on hover or focus and resumes with that toast's remaining time.
  - Escape closes the toast and returns focus to the element that had it before.
  - The `role="status"` and `role="alert"` regions stay always rendered.

- [ ] **Step 1: Failing tests**
  - `Card › no link without href`.
  - `Card › hides rating when count is 0`.
  - `Card › shows status badge and line`.
  - `Card › renders the 80-character title from the fixture with line-clamp-2`.
  - `StarRating › detail format, no ratings` asserts the exact text.
  - `Toast › action toast lasts 8 s`, with fake timers: still there at 7.9 s, gone at 8 s. `Toast › plain toast gone at 4 s`.
  - `Toast › hover pauses and resumes the remaining time`.
  - `Toast › action button calls onAction and closes`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Update every existing caller to the new props: `HomePage` has none yet, and the kit tests do.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): card status and links, rating summary formats, action toasts`.

---

### Task 4: Ideas and tags data layer, fixtures, MSW

**Files:**
- Create: `apps/web/src/features/ideas/api.ts`, `apps/web/src/features/ideas/search.ts`, `apps/web/src/features/ideas/search.test.ts`, `apps/web/src/features/ideas/api.test.tsx`
- Create: `apps/web/src/features/tags/api.ts`
- Create: `apps/web/src/test/fixtures/{users,tags,ideas}.ts`
- Create: `apps/web/src/test/msw/ideas-handlers.ts`, with stores for ideas, tags, users and uploads. Register it in `handlers.ts`.
- Modify: `apps/web/src/lib/api.ts`, `apps/web/src/lib/api.test.ts`, `apps/web/src/app/paths.ts`

**Interfaces:**
- **`api.upload<T>(path: string, form: FormData): Promise<T>`** sends a POST without a `Content-Type` header, so the browser sets the boundary. Errors are handled as in `request`.
- **`paths`** gains `idea: (id: string) => `/ideas/${id}``.
- **Search helpers** in `features/ideas/search.ts`:
  - `parseIdeaSearch(params: URLSearchParams): IdeaSearch`, where `IdeaSearch = { q: string; tag: string; budget: '' | '1' | '2' | '3'; duration: '' | Duration; sort: IdeaSort }`. It uses `ideaQuerySchema.safeParse` per field and drops invalid fields.
  - `toSearchParams(s: IdeaSearch): URLSearchParams` omits empty values and `sort=new`.
  - `activeFilterCount(s): number` counts only `duration`, for the Filters badge.
- **Hooks:**
  - `ideaKeys` is `{ list: (s) => ['ideas', 'list', s], detail: (id) => ['ideas', 'detail', id], mine: ['me', 'ideas'] }`.
  - `useIdeas(s: IdeaSearch)` is a `useInfiniteQuery` over `GET /ideas`, `pageSize` 24. `getNextPageParam` uses `page * pageSize < total`.
  - `useIdea(id)` is `GET /ideas/:id`. A 404 leaves `error.status === 404`.
  - `useMyIdeas()` is an infinite query over `GET /me/ideas`.
  - `useCreateIdea()` is `POST /ideas`. It invalidates `['me','ideas']`.
  - `useUploadImage()` sends `POST /uploads/image` with the form field `image`. It returns `{ url, publicId }` and passes progress through an `onProgress?: (pct: number) => void` option. Use `XMLHttpRequest` for progress only inside this hook.
- **Tags:** `useTags()` is `GET /tags`, keyed `['tags']`, with `staleTime` 5 minutes.
- **Fixtures:**
  - `ideaFixtures: IdeaDTO[]` holds every idea in `content.md`, mapped per P3. It includes idea 1 (no photo), idea 11 (`ratingCount: 0`), idea 12 (budget and duration null), the 80-character title and the 2000-character description.
  - `tagFixtures: TagDTO[]` holds the 8 tags.
  - `userFixtures` holds Maya (user), Panos (admin) and the others.
- **MSW handlers:**
  - Approved-only listing with `q`, `tag`, `budget`, `duration`, `sort` and paging.
  - 404 for ideas that aren't approved.
  - `POST /ideas` validates with `ideaCreateSchema` and returns 422 with `details.issues` in the API's shape.
  - `/me/ideas`.
  - `/uploads/image` is on in tests. Tests can switch it to fail or delay with `uploadStore.mode('ok' | 'reject' | 'network')`.

- [ ] **Step 1: Failing tests**
  - `parseIdeaSearch` round trip: `?q=picnic&tag=food&budget=2&duration=half-day&sort=top` parses and serializes back to the same params.
  - Junk is absent: `?budget=7&sort=hot&tag=Bad%20Tag&duration=week` returns all fields empty and `sort === 'new'`.
  - `toSearchParams({...empty, sort: 'new'}).toString() === ''`.
  - `useIdeas` passes filters to the API (MSW asserts the request URL) and fetches page 2 on `fetchNextPage`.
  - `useIdea` on a pending fixture id returns an error with status 404.
  - `api.upload` sends no JSON content type.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): ideas and tags data layer, typed fixtures, MSW handlers`.

---

### Task 5: Header, guards, 404, auth pages

Ports: `_shared/nav.html`, `auth.html` and `not-found.html`.

**Files:**
- Modify: `apps/web/src/app/layout/Header.tsx`, `AccountMenu.tsx`, `RootLayout.tsx`, `apps/web/src/app/guards.tsx`, `apps/web/src/app/pages/NotFoundPage.tsx`
- Modify: `apps/web/src/features/auth/LoginPage.tsx`, `SignupPage.tsx`, `AuthLayout.tsx`, `safe-next.ts`
- Modify: their tests and `routes.test.tsx`

**Interfaces:**
- **Header** (HANDOFF §3 "Header", minus "Saved ideas" per P1):
  - "Your ideas" is a desktop ghost link to `/profile`.
  - On phones, "+ Share" is a pill with a visible `aria-hidden` "Share" span and `aria-label="Share an idea"` (R36).
  - The current link gets `aria-current="page"` and the underline.
  - The header gets a sticky bottom border once the page scrolls.
- **AccountMenu:**
  - Items: Your ideas, Admin (admins only), Log out.
  - It closes on an outside click, on Escape, and when an item is picked (H4).
- **Login hints** (HANDOFF §3):
  - `loginHint(next: string | null, reason: string | null): string | null` returns:
    - "Log in to share your idea" for `next` `/share`
    - "Log in to see your ideas and saved ideas" for `/profile`
    - "Log in to save ideas you like." for reason `save`
    - "Log in to rate this idea." for reason `rate`
    - otherwise null
  - `RequireAuth` keeps the hash in `next` (R27).
- **Auth pages** (R19):
  - the link texts
  - Show password toggle
  - "Log in instead" under the 409 error, linking to `/login` with the typed email kept in `?email=`
  - the sub-lines
  - `aria-current` on the current auth link (F7)
  - busy buttons using `Button busy`
  - the password hint hiding while its error shows
- **404 and non-admin copy** (R33), verbatim from HANDOFF §3 Copy. On `/admin`, the non-admin page names the user: "You're logged in as {name}."

- [ ] **Step 1: Failing tests**
  - `Header › desktop shows Your ideas; current link has aria-current`.
  - `Header › phone share link is named "Share an idea"`.
  - `AccountMenu › closes on outside click`.
  - `AccountMenu › no Saved ideas item`.
  - `loginHint` covers its 4 cases plus null.
  - `routes › /share logged out → /login?next=%2Fshare, shows "Log in to share your idea", and returns to /share after login`.
  - `routes › /profile#ideas keeps the hash through login`.
  - `Signup › 409 shows the API message and Log in instead`.
  - `Login › show password toggles type`.
  - `Login › prefills the email from ?email=`.
  - `NotFound › copy and Back to all ideas`.
  - `RequireRole › non-admin sees "This page is for admins." with their name`.
  - An axe test on the login, signup and 404 pages.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Port with `port_open_design_artifact_to_app` (P4), then implement.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): header, guards, auth and 404 from the approved designs`.

---

### Task 6: Home

Port: `home.html`.

**Files:**
- Modify: `apps/web/src/components/ui/SearchBar.tsx` and its test
- Create: `apps/web/src/components/ui/Dialog.tsx` (with `Dialog.test.tsx`), `apps/web/src/lib/use-focus-trap.ts`
- Create: `apps/web/src/features/ideas/HomePage.tsx`, `SearchSheet.tsx`, `FiltersPopover.tsx`, `IdeaGrid.tsx`, `HomePage.test.tsx`
- Delete: `apps/web/src/features/home/`
- Modify: `routes.tsx`

**Interfaces:**
- **`Dialog({ open, onClose, labelledBy, variant: 'sheet' | 'panel' | 'alert', initialFocus?, children })`** is shared by the search sheet (Home) and by Admin Edit and the confirm dialogs (Tasks 10–11).
  - It is `role="dialog"`, or `role="alertdialog"` for the alert variant, with `aria-modal="true"`.
  - It portals to `body` and makes `#root > header, main` inert while open.
  - Focus is trapped with `useFocusTrap`. It starts on `initialFocus` (else the first focusable element) and returns to the opener on close.
  - Escape closes it.
  - `sheet` is full screen. `panel` is 560px on the right and full screen under 640px. `alert` is a centred card.
  - The scrim is the `scrim` token.
- **`SearchBar`:**
  - Its values become `IdeaSearch` minus `sort`.
  - The segments are What, Vibe (the tags) and Budget, with a Filters pill holding Duration (`FiltersPopover`). The pill carries the `activeFilterCount` badge.
  - Below 768px it renders the "Find a date idea" pill, which opens `SearchSheet` in a `Dialog` sheet. The sheet has What, Vibe chips, a Budget toggle that clears when you tap it again, Duration chips, "Clear all" and "Show ideas".
- **`HomePage`:**
  - It reads and writes the URL through `parseIdeaSearch` and `toSearchParams`. Submitting navigates, pushing history.
  - The category row comes from `useTags` with `tagIcon`, plus "All".
  - The New / Top rated toggle sets `sort`.
  - The grid uses `Card` with `href=paths.idea(id)`, `meta=ideaMeta`, the first tag's chip (HANDOFF §3 Card), and the "New" badge for ideas created within the last 2 days.
  - "Show more" calls `fetchNextPage`.
  - States: loading (8 card skeletons, 3 on phones), "No ideas match those filters." with "Clear filters", no ideas yet, and "Couldn't load" with "Try again".

- [ ] **Step 1: Failing tests**
  - `Home › renders approved ideas from the API`.
  - `Home › URL filters drive the request and the controls`: rendering `/?tag=food&budget=2` shows those filters selected, and MSW sees `tag=food&budget=2`.
  - `Home › Back restores the previous filters`.
  - `Home › junk params are ignored`.
  - `Home › Show more loads page 2`.
  - `Home › idea with no photo, no budget/duration, no ratings shows placeholder, no meta line, no rating`.
  - `Home › empty filters state clears filters`.
  - `Home › 500 shows Couldn't load, and Try again refetches`.
  - `Dialog › traps focus, Escape closes and returns focus to the opener`.
  - `SearchSheet › Show ideas applies all fields`.
  - axe on Home with data, and on the empty state.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Port with `port_open_design_artifact_to_app` (P4), then implement.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): home page with url filters, search sheet and idea grid`.

---

### Task 7: Idea detail

Port: `idea-detail.html`, without the rating panel, heart and places card (P1).

**Files:**
- Create: `apps/web/src/features/ideas/IdeaDetailPage.tsx`, `IdeaDetailPage.test.tsx`
- Modify: `routes.tsx` (`ideas/:id`), `paths.ts`

**Interfaces:**
- Consumes: `useIdea`, `ideaMeta`, `tagIcon`, `StarRating format="detail"`.
- Layout:
  - Desktop: a sticky 4:3 photo on the left. On the right, the tag chips, title, meta line, the rating summary, "Shared by {creator.name} · {date}", "About this date", and the description with its paragraphs kept.
  - Phones: a 3:2 photo (R13), stacked.
- States:
  - loading skeleton
  - not found: "Idea not found" copy from frame 11, with "Back to all ideas"; used for a 404, including pending and rejected ideas
  - error with "Try again"
- `<title>` is the idea's title.

- [ ] **Step 1: Failing tests**
  - `Detail › renders idea 5 fields`, with the exact meta, rating and creator lines.
  - `Detail › no photo and no ratings`: placeholder and "No ratings yet. Be the first.".
  - `Detail › missing budget and duration hides the meta line`.
  - `Detail › 2000-character description and 80-character title render in full`.
  - `Detail › pending id shows not found`.
  - `Detail › network error shows Try again`.
  - axe.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Port with `port_open_design_artifact_to_app` (P4), then implement.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): idea detail page`.

---

### Task 8: Share an idea

Port: `share.html`.

**Files:**
- Create: `apps/web/src/components/ui/SegmentedControl.tsx`, `apps/web/src/components/ui/PhotoDropZone.tsx` (with tests)
- Create: `apps/web/src/features/ideas/SharePage.tsx`, `SharePage.test.tsx`
- Modify: `routes.tsx`, `components/ui/index.ts`

**Interfaces:**
- **`SegmentedControl<T extends string>({ legend, name, options: { value: T; label: string }[], value: T | null, onChange, disabledValues?, columns? })`** is a fieldset of radios. The picked segment is styled like a picked tag. With `columns={2}`, it becomes a 2×2 grid under 480px.
- **`PhotoDropZone({ value: { url: string; publicId: string } | null, onChange, upload })`** covers the drop zone, the 4:3 preview with Replace and Remove, the progress bar, and the two failure messages (HANDOFF §3, R23, verbatim).
  - It revokes object URLs (F8).
  - After a file is picked, focus moves to Replace (F1).
  - It rejects files over 5 MB and files that aren't JPEG, PNG or WebP on the client before uploading, with the same rejected-file message.
- **`SharePage`:**
  - React Hook Form with `ideaCreateSchema`.
  - Title has a counter (n/80). Description has "At least 20 characters" and a counter (n/2000).
  - Tags use `SelectableChip`, from 1 to 3. At 3, the rest get `aria-disabled` and the hint changes.
  - Place type is a select labelled with `PLACE_TYPE_LABELS`.
  - Budget and Duration use `SegmentedControl`.
  - "Send for review" is disabled with `aria-describedby` while the upload runs (F4).
  - A 422 maps onto the fields, and a summary with jump links shows.
  - Success replaces the form with "Thanks! Your idea is waiting for review.", a card preview with the "Pending review" status, "See it on your profile" and "Share another". Focus moves to the success `h2` (F3).

- [ ] **Step 1: Failing tests**
  - `Share › happy path`: pick a photo (MSW ok), fill every field, then submit. MSW receives a body that passes `ideaCreateSchema`, and the success view shows with focus on its heading.
  - `Share › client validation`: an empty submit shows each field's error and the summary.
  - `Share › 422 from the API lands on the field`.
  - `Share › 3 tags disables the rest`.
  - `PhotoDropZone › rejected file shows the R23 message verbatim`.
  - `PhotoDropZone › network failure keeps the preview and offers Try again`.
  - `PhotoDropZone › submit disabled while uploading`.
  - `SegmentedControl › arrow keys move the selection`.
  - axe on the form and on the success view.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Port with `port_open_design_artifact_to_app` (P4), then implement.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): share an idea form with photo upload`.

---

### Task 9: Profile (Your ideas)

Port: `profile.html`, "Your ideas" only (P1).

**Files:**
- Create: `apps/web/src/features/profile/ProfilePage.tsx`, `ProfilePage.test.tsx`
- Modify: `routes.tsx`

**Interfaces:**
- Consumes: `useMe`, `useMyIdeas`, `Card` with `status`, and `Chip variant="status"`.
- Content:
  - The avatar initial, the name and the email. The 50-character name wraps, and the email breaks at `@` and the dots with `<wbr>`.
  - "Your ideas" lists the user's ideas newest first, showing every tag (HANDOFF §3 Card):
    - Pending: status "Pending review", the line "Waiting for review", and no link.
    - Rejected: status "Not approved", the line "Not approved this time", no link, and a "Share it again with changes" link to `/share`.
    - Approved: status "Approved", the line "Live · {saveCount} saves", and a link to the detail page.
  - Per-card ids are generated (G3).
- States: loading, error with retry, and "You haven't shared an idea yet." with "Share an idea".

- [ ] **Step 1: Failing tests**
  - `Profile › lists my ideas with the three statuses; only approved links`.
  - `Profile › empty state`.
  - `Profile › error state`.
  - `Profile › 50-character name wraps`, checked by class.
  - axe.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Port with `port_open_design_artifact_to_app` (P4), then implement.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): profile with your ideas and their status`.

---

### Task 10: Admin — tabs, pending queue, all ideas, edit panel

Port: `admin.html`, the Pending and All ideas tabs and the Edit panel.

**Files:**
- Create: `apps/web/src/components/ui/Tabs.tsx` (with `Tabs.test.tsx`)
- Create: `apps/web/src/features/admin/api.ts`, `AdminPage.tsx`, `PendingTab.tsx`, `AllIdeasTab.tsx`, `EditIdeaPanel.tsx`, `ConfirmDialog.tsx`, `relative-date.ts` (with `relative-date.test.ts`), `AdminPage.test.tsx`
- Modify: `apps/web/src/test/msw/ideas-handlers.ts` (admin routes), `routes.tsx`

**Interfaces:**
- **`Tabs({ label, tabs: { id: string; label: ReactNode; panel: ReactNode }[] })`** is a real tablist with roving tabindex and Left / Right / Home / End. Selection syncs with `location.hash`, using `replaceState` and no blur hack (G5). It scrolls inside itself on phones.
- **Hooks:**
  - `adminKeys = { ideas: (status, q) => ['admin','ideas',status,q], users: (q) => ['admin','users',q] }`.
  - `useAdminIdeas(status, q)`.
  - `useUpdateIdea()` is `PATCH /admin/ideas/:id`. It invalidates `['admin','ideas']`, `['ideas']` and `['me','ideas']`.
  - `useDeleteIdea()`.
- **`ConfirmDialog({ title, body, confirmLabel, onConfirm, open, onClose })`** uses `Dialog variant="alert"`. Focus starts on Cancel. The confirm button is `Button variant="danger"`.
- **`relativeSubmitted(iso: string, now: Date): string`** returns "today", "N days ago" up to 6 days, then "Mar 9, 2024" (HANDOFF §3 Copy).
- **Pending tab:**
  - Ideas are oldest first, with a count in the tab.
  - Each row shows the thumb, title (which opens Edit), place type and meta, the description clamped to 2 lines, the creator, tags and submitted date.
  - Approve sends PATCH `{status: 'approved'}`, then shows the toast "Idea approved" with Undo, which sends PATCH `{status: 'pending'}`.
  - Reject asks first, with the copy from frame 2, then sends PATCH `{status: 'rejected'}`.
  - Afterwards, focus moves to the next row's Approve, or to "See all ideas" when the queue is empty.
  - Empty state: "Nothing to review. Nice work."
- **All ideas tab:**
  - A status `SegmentedControl` (Approved / Pending review / Not approved; R32), plus "Search titles", which feeds `q` (Task 1), debounced 300 ms.
  - Approved titles link to the detail page.
- **`EditIdeaPanel`:**
  - It uses `Dialog variant="panel"` and has every Share field plus Status.
  - Budget and Duration have "Not set", which is disabled once a value exists (R32), with the hint "Migrated ideas start without a budget or duration."
  - Save sends only the changed fields, including tags and photo, and validates with `ideaUpdateSchema` (H1).
  - A danger zone holds "Delete idea" behind a confirm.
- **Phones:** at 360px the rows stack as cards.

- [ ] **Step 1: Failing tests**
  - `Tabs › arrow keys and hash`.
  - `relativeSubmitted` covers same day, 3 days and 9 days, which gives an absolute date.
  - `Admin › pending queue oldest first with count`.
  - `Admin › approve, then Undo restores pending and the count`.
  - `Admin › reject asks first; Cancel does nothing`.
  - `Admin › edit saves only changed fields and refreshes the row`.
  - `Admin › delete asks first and removes the row from every list`.
  - `Admin › all ideas filters by status and q`: MSW sees `q`.
  - `Admin › empty queue copy`.
  - `Admin › 500 shows error with Try again`.
  - axe on each tab and on the open panel.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Port with `port_open_design_artifact_to_app` (P4), then implement.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): admin queue, all ideas and edit panel`.

---

### Task 11: Admin — tags and users

Port: `admin.html`, the Tags and Users tabs.

**Files:**
- Create: `apps/web/src/components/ui/IconPicker.tsx` (with test)
- Create: `apps/web/src/features/admin/TagsTab.tsx`, `UsersTab.tsx`, `AdminTagsUsers.test.tsx`
- Modify: `apps/web/src/features/admin/api.ts`, `AdminPage.tsx`, `ideas-handlers.ts`

**Interfaces:**
- **`IconPicker({ name, value, onChange })`** is a radio group over `TAG_ICON_NAMES`. The buttons are 44px. Each accessible name is the icon name. A preview shows the picked icon. The helper reads "Pick the icon people will see on the chip."
- **Hooks:**
  - `useCreateTag()`, `useUpdateTag()` and `useDeleteTag()` use `/admin/tags`. They invalidate `['tags']` and `['ideas']`.
  - `useAdminUsers(q)` is `GET /admin/users?q=`.
  - `useSetRole()` is `POST /admin/users/:id/role`. It invalidates `['admin','users']`, and also `['auth','me']` when the user changed their own role.
- **Tags tab:**
  - Add a tag with a name (2–30 characters), a live slug preview and the icon picker. Add starts on `sparkles`.
  - Rename in place, with name and icon. Cancel and Escape restore the row.
  - Delete asks first, with the frame 3 copy.
  - A 409 shows "A tag with this name already exists" under the name field.
- **Users tab:**
  - Search; a role chip; "Make admin" (user-plus) and "Remove admin" (shield-off).
  - Both actions ask first. Demoting yourself asks "Remove your own admin access?".
  - A 409 shows "You can't remove the last admin." with the frame 4 copy, keeps the role, and returns focus to the button.

- [ ] **Step 1: Failing tests**
  - `IconPicker › 16 options, keyboard selection`.
  - `Tags › add with icon refreshes the category row data`: the `['tags']` query is invalidated.
  - `Tags › duplicate name shows the API message`.
  - `Tags › rename cancel restores`.
  - `Tags › delete asks first`.
  - `Users › make admin asks first and updates the chip`.
  - `Users › last admin 409 keeps the role and shows the message`.
  - `Users › search sends q`.
  - axe on both tabs.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Port with `port_open_design_artifact_to_app` (P4), then implement.
- [ ] **Step 4:** Run the web gates. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): admin tags and users`.

---

### Task 12: Real-API check, design re-critique, docs and PR (controller)

**Files:**
- Modify: `docs/superpowers/START-HERE.md`, `docs/superpowers/plans/2026-11-20-00-roadmap.md` (the Phase 5 row), this plan (add a Status section at the top), `README.md` (only if setup changed)

- [ ] **Step 1: Real API.** Run the API and web locally against `itsadate_dev` (`npm run dev -w @itsadate/api` and `npm run dev -w @itsadate/web`). Click through as the owner's dev admin and as a new throwaway user:
  - Browse Home with each filter, and check that Back and Forward restore them.
  - Open an idea. Try to open a pending one.
  - Open Share. The photo step shows the upload-failed state (P1).
  - Open Profile.
  - In Admin, approve and undo, reject, edit, add, rename and delete a tag, and change a user's role.
  - Record what you saw. Delete the test tag. Leave the database as you found it.
- [ ] **Step 2: Screens.** Take headless screenshots of every page at 1440 and 360. Use the cached Playwright headless shell; full chrome.exe hangs on this PC. Then run the design critic once per page against its approved screen (spec §8.7). On `polish`, fix once in a fresh `itsadate-web` agent. On `rework`, stop and ask the owner.
- [ ] **Step 3: Gates.** Run `npm run ci` and `npx prettier --check .`. Expected: both pass.
- [ ] **Step 4: Final review.** Run a whole-branch review on the most capable model, then one fix wave and one re-review.
- [ ] **Step 5: Docs.**
  - START-HERE: Phase 5 is built, and the PR is pending.
  - Add hand-off notes for 6a (heart, rating panel, Saved tab, "Saved ideas" menu item), 6b (places card) and 7 (`POST /uploads/image` with the field `image`, returning `{url, publicId}`).
  - The roadmap row and this plan's Status section.
- [ ] **Step 6: Push and PR, after asking the owner.** Run `git push -u origin phase-5-pages`, then `gh pr create --base modernize`. The body uses the Summary / Evidence / Merge Danger template and ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Wait for CI to go green. The owner merges.
