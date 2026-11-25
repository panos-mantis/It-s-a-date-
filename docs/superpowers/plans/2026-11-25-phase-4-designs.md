# Phase 4 — Page Designs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design every page in spec §8.4 as a high-fidelity, responsive Open Design screen in the Coral Friendly style, each passing the kit's checks and the design critic, with the owner's sign-off on Home and Idea detail, plus a hand-off sheet that Phase 5 ports from.

**Architecture:** One Open Design **collection** (`itsadate-screens`) under `.open-design/itsadate-screens/`, one responsive HTML file per page. Each file shows the page's default state at the top and, below a divider, a **States board** with the other states the page needs (empty, loading, error, logged-out, phone-only views). A shared content sheet keeps the sample data the same on every screen. A flow plan links the screens, so the collection check can catch broken or missing links. Each screen is checked at desktop 1440×900 and phone 360×800 (the spec's floor).

**Tech Stack:** The Open Design kit (the `open-design` MCP tools and the `open-design:open-design` and `open-design:open-design-critique` skills). Plain HTML and CSS in each screen, with the project's `tokens.css` values. Lucide icons as inline SVG. No app code changes.

**Spec:** `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md` §7, §8.4, §8.6 and §8.7. Style: `DESIGN.md` and `.open-design/design-systems/style-tiles-for-it-s-a-date-a-web-app-where-peop/tokens.css` (the active design system, `user:style-tiles-for-it-s-a-date-a-web-app-where-peop`).

## Scope

**In:** Home, Idea detail, Share an idea, Log in and Sign up, Profile, Admin, and 404, each at desktop and phone width. This includes the phone search sheet that Phase 3 left for this phase. Also in: the content sheet, the flow plan, the collection check, the critic on every screen, owner sign-off on Home and Idea detail, and a hand-off sheet for Phase 5.

**Out:** any change under `apps/` or `packages/`. Porting into React (Phase 5). Real idea photos in the app (Phase 7). Real map tiles: the map is drawn as a static panel with the OSM attribution.

**Search bar segments:** **What / Vibe / Budget**, plus a "Filters" pill holding duration (spec §8.4 overrides DESIGN.md's "Where / When / Vibe"). There is no location field on Home.

## Global Constraints

- Branch `phase-4-designs`, cut from `modernize` at `dc15757` (Phases 2 and 3 merged). The PR goes into `modernize`. Work in the main folder; no worktree is needed.
- Never check out a commit from before Phase 0 (`e1cf2fe` or older). Never read, print, stage or delete any `.env`.
- Files live only under `.open-design/itsadate-screens/`, except this plan, the ledger and `docs/superpowers/START-HERE.md`. `.open-design/.checks/` and `**/exports/` are git-ignored; don't force-add them.
- Every screen is one file in the collection: `collectionId: "itsadate-screens"`, `collectionName: "It's a Date screens"`, `screenTotal: 7`. The same `flow` plan (below) goes on every `prepare_open_design_brief` and `register_open_design_artifact` call.
- Skill ids: Home, Idea detail, Share and Profile use `od:prototype:web-prototype`. Auth uses `od:prototype:flow-sign-in`, but only the Log in and Sign up screens: no forgot-password, magic link or code screens (spec §4 non-goals). Admin uses `od:prototype:app-table`. 404 uses `od:prototype:web-prototype`. Leave `designSystemId` out so the active one is used.
- Surface answers on every brief: `{ "platform": "Web app", "density": "Medium" }` for app screens and `{ "purpose": "Explaining a product or service", "theme": "Light", "density": "A multi-section site page" }` for prototype screens. The spec is light-only (§4).
- Check every screen with `viewports: [{ "name": "desktop", "width": 1440, "height": 900 }, { "name": "phone", "width": 360, "height": 800 }]` and `states: true`. Done means **0 errors**, and every taste warning is fixed or noted in the ledger with the reason. Stop after two fix rounds and note what's left.
- Critic: one `open-design:open-design-critique` round per screen. On `polish`, apply its fixes once, register (with the `critique` field) and re-check, then stop. On `rework`, stop and report to the controller; don't rebuild without the owner.
- Style (DESIGN.md, binding): cream `#FBF6F0` canvas, never pure white. Coral `#F06A4C` only as a fill **with dark text** `#2A1A14`, never white on coral, **at most two coral fills per screen state**. Coral text is `#B23E23`. Fraunces with `font-variation-settings: "SOFT" 100, "WONK" 0`, one italic phrase per headline at most. DM Sans 400/500/600, never 700+. Radii 10/16/20/pill. Borderless photo-first cards. Lucide-style 1.75px line icons. No gradients, glows or decorative illustrations. Never Airbnb's `#FF385C`, the Cereal font, its name or logo.
- Copy: sentence case, second person, the DESIGN.md voice. Errors say what to do next. Copy that already exists in `apps/web` is binding (listed in Task 4).
- Real values only, from `packages/shared/src/constants.ts` and the seed:
  - Tags (name, slug, Lucide icon): Food `food` utensils · Adventure `adventure` mountain · Home `home` house · Self-date `self-date` heart · Board games `board-game` dice-5 · Dancing `dancing` music · Self-care `self-care` flower-2 · Learning `learning` book-open.
  - Budget `$ / $$ / $$$`. Duration `1–2 hours / Half day / Full day`. Sort `New` / `Top rated`.
  - Place types: none, restaurant, sushi, cafe, bar, park, viewpoint, museum, cinema, theatre, climbing_gym, bowling, escape_room, spa, beach. Admin shows them with readable labels ("Climbing gym", "Escape room", "No place needed").
  - Limits: title 3–80 characters, description 20–2000, 1–3 tags, name 2–50, password 8–72 characters. Places: up to 20 results, default radius 3 km, up to 10 km.
- The header matches Phase 3's `apps/web/src/app/layout/Header.tsx` and `AccountMenu.tsx`: the wordmark "It's a Date" in Fraunces italic with a small heart, a "Share an idea" text button, and either "Log in" / "Sign up" or the avatar menu. A change from it goes in the hand-off sheet as "Phase 5 restyles".
- Photos: use real Unsplash photos (`images.unsplash.com/photo-…?w=800&q=80&auto=format&fit=crop`, Unsplash licence). Each URL must return HTTP 200 (`curl -sI`) before it goes in the content sheet. Credit each one in the sheet. If a photo URL fails, use the sunk placeholder instead. Never invent a photo id without checking it.
- Phase 5 ports from these files with `port_open_design_artifact_to_app`. Mark kit components with `data-component="Card"` (also `Button`, `Chip`, `SearchBar`, `CategoryRow`, `StarRating`, `Input`, `EmptyState`, `Skeleton`, `Toast`), so the port maps them onto `apps/web/src/components/ui/`.
- Commit trailer on every commit: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `npx prettier --check .` must pass (`.open-design` and `*.md` are prettier-ignored).

### Flow plan (the same object on every screen)

```json
{
  "screens": [
    { "id": "home", "title": "Home", "role": "Browse and filter approved date ideas" },
    { "id": "idea-detail", "title": "Idea detail", "role": "Read one idea, rate it, save it, find places near me" },
    { "id": "share", "title": "Share an idea", "role": "Submit a new idea for review", "end": true },
    { "id": "auth", "title": "Log in and sign up", "role": "Get an account or log back in" },
    { "id": "profile", "title": "Profile", "role": "My ideas with their status, and my saved ideas" },
    { "id": "admin", "title": "Admin", "role": "Review pending ideas, edit ideas, manage tags and users" },
    { "id": "not-found", "title": "Page not found", "role": "A friendly 404 with a way home" }
  ],
  "links": [
    { "from": "home", "trigger": "an idea card", "to": "idea-detail" },
    { "from": "home", "trigger": "Share an idea", "to": "share" },
    { "from": "home", "trigger": "Log in", "to": "auth" },
    { "from": "home", "trigger": "Profile", "to": "profile" },
    { "from": "home", "trigger": "Admin", "to": "admin" },
    { "from": "idea-detail", "trigger": "It's a Date", "to": "home" },
    { "from": "idea-detail", "trigger": "Log in to rate", "to": "auth" },
    { "from": "share", "trigger": "It's a Date", "to": "home" },
    { "from": "auth", "trigger": "It's a Date", "to": "home" },
    { "from": "profile", "trigger": "an idea card", "to": "idea-detail" },
    { "from": "profile", "trigger": "Share an idea", "to": "share" },
    { "from": "admin", "trigger": "It's a Date", "to": "home" },
    { "from": "not-found", "trigger": "Back to all ideas", "to": "home" }
  ],
  "nav": [
    { "label": "It's a Date", "to": "home" },
    { "label": "Share an idea", "to": "share" },
    { "label": "Profile", "to": "profile" }
  ],
  "tasks": [
    { "name": "Find an idea and the places near me", "start": "home", "end": "idea-detail", "maxSteps": 1 },
    { "name": "Share an idea", "start": "home", "end": "share", "maxSteps": 1 },
    { "name": "Check on an idea I shared", "start": "home", "end": "profile", "maxSteps": 1 }
  ]
}
```

## Review Focus

- **Long and odd content at 360px:** an 80-character title, a 50-character name, a three-tag idea and a 2000-character description must wrap, never clip or push the page sideways. Expected: titles clamp to two lines on cards and wrap in full on the detail page. Pinned in Task 1 (the content sheet has these items) and in every screen's check at 360px (`overflow`, `horizontal-scroll` = 0).
- **Missing data, which is the real state until Phase 7:** `image: null` (every migrated idea), `budget`/`duration: null` (the meta line is hidden, not "null · null"), and `ratingCount: 0` ("No ratings yet", not "0.0 (0)"). Pinned in Task 1 (the Home grid shows all three) and Task 2 (the detail page with no photo and no ratings).
- **Logged out vs logged in:** the heart, "Your rating" and "Share an idea" for a logged-out user lead to log in and say so. Expected: the header shows Log in / Sign up, the heart is still visible, and the rating says "Log in to rate". Pinned in Task 1 and Task 2 (the logged-out state on each States board).
- **Places when things go wrong:** location denied, no places within the radius, and an at-home idea (`placeType: none`). Expected: denied shows the city or postcode fallback, "none" hides the button entirely, and no results offers to widen to 10 km. Pinned in Task 2's States board.
- **Admin and the phone:** tables at 360px must not scroll the page sideways (rows stack into cards), and destructive actions (reject, delete tag, demote) ask before acting. Demoting the last admin shows the API's message "You can't remove the last admin". Pinned in Task 6.

---

### Task 1: Content sheet and Home

**Files:**
- Create: `.open-design/itsadate-screens/content.md` (the shared sample data)
- Create: `.open-design/itsadate-screens/home.html` (+ `home.html.artifact.json` written by register)
- Ledger: `.superpowers/sdd/2026-11-25-phase-4-designs/progress.md`

**Interfaces:**
- Produces `content.md`: 12 ideas taken from `apps/api/src/seed/ideas.ts` (use the seed's titles and descriptions; read the file), each with tag(s), budget, duration, placeType, ratingAvg/ratingCount, saveCount, creator name and a checked photo URL with its credit. The 12 must include:
  - one with `image: null`
  - one with `budget` and `duration` null
  - one with `ratingCount: 0`
  - one with three tags
  - one with an 80-character title: "A slow Saturday at the farmers market, then a picnic lunch by the river for two!" (80 characters; count again if you edit it)
  - one with a 50-character creator name
  - one with a 2000-character description, for Task 2
- Also produces two sample users: "Maya Chen" (user) and the owner as "Panos" (admin, only in Admin screens). Every later screen reuses these, so they show the same data.
- Produces the header markup and the card markup that later screens copy (`data-component` attributes as in Global Constraints).

- [ ] **Step 1: Branch and ledger**

The branch `phase-4-designs` already exists (the controller created it and committed this plan at `6357dd8`); work on it. Create the ledger with a row per task (status, screen path, check result, critic verdict, notes).

- [ ] **Step 2: Write `content.md`**

Check every photo URL with `curl -sI <url>` and keep only 200s. Expected: 12 ideas, every Review Focus item present, a credit for every photo.

- [ ] **Step 3: Prepare the brief**

`prepare_open_design_brief` with `skillId: "od:prototype:web-prototype"`, the collection fields, `screenRole: "home"`, `screenTotal: 7`, the flow plan, the prototype answers, `sources: [".open-design/itsadate-screens/content.md", "DESIGN.md"]`. Brief, in substance: the Home page per spec §8.4. Sticky header. Hero headline "Plans worth *saying yes* to." The sticky pill search bar What / Vibe / Budget with a Filters pill (duration). The centred category row of the 8 tags, with "All" first and active. A sort toggle New / Top rated. A 4/3/2/1-column grid of 12 cards: 4:3 photo, overlay badge "New" on the newest, heart top-right, Fraunces title, rating "4.6 (128)" right-aligned, meta "$$ · Half day", tag chip. A "Show more" button for the next page (page size 24).

- [ ] **Step 4: Write `home.html`, with the States board below it**

The States board shows, each labelled with an eyebrow:
1. logged-out header
2. loading: 8 `CardSkeleton`s
3. no results for a filter, as an `EmptyState`: "No ideas match those filters." with a "Clear filters" button
4. no ideas at all: "No ideas here yet. Be the first to share one."
5. error loading: "We couldn't load ideas. Check your connection and try again." with "Try again"
6. phone (360px) view: the collapsed search pill "Find a date idea", and the **open search sheet** (full screen, with What, Vibe as chips, Budget as a 3-way toggle, Duration, then "Clear all" and "Show ideas")
7. phone category row scrolled sideways

Filters are written as URL query state. Note it in a comment: `?q=&tag=&budget=&duration=&sort=`.

- [ ] **Step 5: Register and check**

`register_open_design_artifact` (`kind: "html"`, title "Home", the collection fields, `flow`, `sources`, `brief`). Then `check_open_design_artifact` with the Global Constraints viewports. Expected: 0 errors, `horizontal-scroll` 0 at 360. Fix and re-check (two rounds max).

- [ ] **Step 6: Critic**

Run `open-design:open-design-critique` on `home.html`. Apply the one polish round if needed, then register with `critique` and re-check. Record the verdict in the ledger.

- [ ] **Step 7: Commit**

```bash
git add .open-design/itsadate-screens docs/superpowers/plans/2026-11-25-phase-4-designs.md
git commit -m "design: content sheet and home screen"
```

---

### Task 2: Idea detail

**Files:**
- Create: `.open-design/itsadate-screens/idea-detail.html` (+ manifest)

**Interfaces:**
- Consumes: `content.md`, and the header and card markup from `home.html` (Task 1).
- Produces: the rating, save and places patterns Phase 6a and 6b build: `StarRatingInput` (5 × 24px star buttons, "Your rating"), the save heart with its count, and the places panel (button, list, map, fallback).

- [ ] **Step 1: Prepare the brief** (`screenRole: "idea-detail"`, `skillId: "od:prototype:web-prototype"`)

The idea is "Golden-hour viewpoint drive" from `content.md`. Desktop shows the large 4:3 photo (20px radius) with the heart. Then the title, the tag chips, "$$ · Half day", "Shared by Maya Chen" and the rating summary "4.6 · 128 ratings". Then the description (max 65ch) and the rating input "Your rating" (the logged-in user's 4 stars, with "Remove rating" as a ghost button). Then the places section: "Find places near me" (one coral fill), which leads to a list of up to 20 places (name, distance "1.2 km", address, website link) next to a static map panel with numbered markers and "© OpenStreetMap contributors". A radius control: 3 km default, widen to 5 or 10 km. A back link "All ideas". Phone: photo full-width, the sections stack, the map sits above the list.

- [ ] **Step 2: Write `idea-detail.html` with its States board**

1. logged out: the heart leads to log in, the rating shows "Log in to rate" (link to auth)
2. no photo (`image: null`, the sunk placeholder with the tag icon) and no ratings: "No ratings yet. Be the first."
3. `budget`/`duration` null: the meta line is hidden
4. the 2000-character description, wrapped
5. places: waiting for location ("Finding places near you…" with skeleton rows)
6. places: location denied, which explains why and shows the "City or postcode" input with "Search"
7. places: no results within 3 km, with "Widen to 10 km"
8. places: an error, "We couldn't reach the map service. Try again in a minute."
9. an at-home idea (`placeType: none`): no places section at all, and "Plan it at home" in the meta
10. idea not found or not approved: "We couldn't find that idea." with "Back to all ideas"
11. a rating saved toast: "Rating saved"

- [ ] **Step 3: Register, check, fix** (as Task 1 Step 5, title "Idea detail")

Expected: 0 errors, and at most two coral fills in every state (the places button and at most one other).

- [ ] **Step 4: Critic** (as Task 1 Step 6)

- [ ] **Step 5: Commit**

```bash
git add .open-design/itsadate-screens
git commit -m "design: idea detail screen"
```

---

### Task 3: Owner sign-off on Home and Idea detail (controller, owner present)

Not an agent task. The owner must approve these two before the other screens copy their patterns (spec §8.7, §10.3).

- [ ] **Step 1: Show them**

`open_open_design_preview` on `home.html`. Also publish a private preview of each with `publish_open_design_artifact` (`provider: "claude-artifact"`), and give the owner both links.

- [ ] **Step 2: Collect feedback**

Take comments from chat or the preview's Comment pins (`get_open_design_artifact` → `openComments`). Apply them in a fresh `itsadate-designer` agent (register with `resolvedCommentIds`, re-check), then re-publish the previews. Repeat until the owner says yes.

- [ ] **Step 3: Record the sign-off**

Ledger: date, the owner's words, the final check run ids. Commit any changes:
```bash
git commit -am "design: owner sign-off changes on home and idea detail"
```
Expected: the owner said, in so many words, that Home and Idea detail are approved.

---

### Task 4: Share an idea, and Log in / Sign up

**Files:**
- Create: `.open-design/itsadate-screens/share.html`, `.open-design/itsadate-screens/auth.html` (+ manifests)

**Interfaces:**
- Consumes: the signed-off header, inputs and buttons from Tasks 1–3.
- Binding copy from `apps/web/src/features/auth/`: the titles "Welcome back" and "Create your account". The labels "Name", "Email" and "Password". The hint "At least 8 characters.". The errors "Email or password is wrong" and "An account with this email already exists". The network error "We can't reach the server…" (`NETWORK_MESSAGE` in `apps/web/src/lib/api.ts`; copy it exactly).

- [ ] **Step 1: Share — brief and write** (`screenRole: "share"`, `od:prototype:web-prototype`)

A single-column form (max 640px):
- Photo: a drop zone "Add a photo", "JPEG, PNG or WebP, up to 5 MB", then a 4:3 preview with "Replace" and "Remove"
- Title, with a counter "0/80"
- Description, with "At least 20 characters" and a counter "0/2000"
- Tags: chips, pick 1–3, "Pick up to 3"
- Place type: a select with readable labels and "No place needed"
- Budget: a $/$$/$$$ segmented control
- Duration: a 3-way segmented control
- The primary "Send for review", and the note "An admin checks every idea before it goes live."

States board:
1. inline field errors (the API's 422 maps onto the fields)
2. uploading: the photo shows progress and the submit button is disabled
3. upload failed: "That photo didn't upload. Try a JPEG, PNG or WebP under 5 MB."
4. submitting: busy button
5. success: "Thanks! Your idea is waiting for review." with "See it on your profile" and "Share another"
6. logged out: you never see this page, because the guard sends you to log in (show it as a note only)

- [ ] **Step 2: Auth — brief and write** (`screenRole: "auth"`, `od:prototype:flow-sign-in`, Log in and Sign up only)

One file: Log in on top, Sign up beside it on desktop (stacked on phone), each a card on cream with a link to the other ("New here? Create an account" / "Already have an account? Log in").

States board:
1. wrong password
2. email taken
3. field validation (name under 2 characters, password under 8)
4. busy button
5. network error
6. the `?next` hint, "Log in to share your idea", when sent from `/share`

- [ ] **Step 3: Register and check both** (titles "Share an idea" and "Log in and sign up"). Expected: 0 errors each.

- [ ] **Step 4: Critic on both** (as Task 1 Step 6)

- [ ] **Step 5: Commit**

```bash
git add .open-design/itsadate-screens
git commit -m "design: share an idea and auth screens"
```

---

### Task 5: Profile

**Files:**
- Create: `.open-design/itsadate-screens/profile.html` (+ manifest)

**Interfaces:**
- Consumes: the card and chip markup, and `content.md`.

- [ ] **Step 1: Brief and write** (`screenRole: "profile"`, `od:prototype:web-prototype`)

A header with the avatar initial, the name "Maya Chen" and the email. Two tabs: "My ideas" and "Saved".
- **My ideas:** a grid of Maya's ideas, each card with a status chip: Pending (warn), Approved (success), Rejected (danger, with "Not approved this time" helper text). Approved cards link to the detail page; pending ones are not public yet ("Waiting for review").
- **Saved:** the saved grid; un-saving a card removes it, with an "Undo" toast.

States board:
1. no ideas yet: "You haven't shared an idea yet." with "Share an idea"
2. nothing saved: "Tap the heart on any idea to save it for later."
3. loading skeletons
4. error with retry
5. the 50-character name, wrapped in the header

- [ ] **Step 2: Register, check, critic** (as Task 1 Steps 5–6, title "Profile")

- [ ] **Step 3: Commit**

```bash
git add .open-design/itsadate-screens
git commit -m "design: profile screen"
```

---

### Task 6: Admin and 404

**Files:**
- Create: `.open-design/itsadate-screens/admin.html`, `.open-design/itsadate-screens/not-found.html` (+ manifests)

**Interfaces:**
- Consumes: the header, Button, Input and Chip. The Admin panel and table rules from DESIGN.md "Admin panels and tables".
- Real API behaviour to show: the pending queue is **oldest first**. Statuses are pending, approved and rejected. The role change is `POST /admin/users/:id/role`, and demoting the last admin fails with "You can't remove the last admin". The tag name is 2–30 characters, and a duplicate shows "A tag with this name already exists". The icon is a Lucide name. `GET /admin/users` lists users.

- [ ] **Step 1: Admin — brief and write** (`screenRole: "admin"`, `od:prototype:app-table`, the app-screens answers)

The admin uses the same site header, plus a tab row: Pending (with a count), All ideas, Tags, Users.
- **Pending:** rows with a thumb (or placeholder), title, creator, "Submitted 3 days ago", tags, and the actions Approve (success text button), Edit and Reject (danger text button).
- **Edit idea:** a side panel (a full-screen sheet on phone) with every field from Share plus Status. Budget, duration and place type offer "Not set" for migrated ideas, and a hint says "Migrated ideas start without a budget or duration."
- **All ideas:** a status filter and search.
- **Tags:** a list of name, slug and icon preview, with add, rename and delete.
- **Users:** name, email, role chip and "Make admin" / "Remove admin".

At 360px every table becomes stacked cards, and the page never scrolls sideways.

States board:
1. empty queue: "Nothing to review. Nice work."
2. reject confirm: "Reject "…"? The author will see it as not approved."
3. delete tag confirm
4. "You can't remove the last admin" error
5. duplicate tag name error
6. an approved toast: "Idea approved"
7. loading
8. the phone stacked rows
9. a non-admin who opens `/admin`: "This page is for admins." with "Back to all ideas"

- [ ] **Step 2: 404 — brief and write** (`screenRole: "not-found"`, `od:prototype:web-prototype`)

The site header, then the headline "This page *wandered off*." and the line "The link may be old, or the idea was removed.", then the primary "Back to all ideas". No illustration.

- [ ] **Step 3: Register, check, critic for both** (titles "Admin" and "Page not found")

Expected: 0 errors. `tap-target` passes at 360 on the admin row actions.

- [ ] **Step 4: Commit**

```bash
git add .open-design/itsadate-screens
git commit -m "design: admin and 404 screens"
```

---

### Task 7: Collection check and hand-off sheet

**Files:**
- Create: `.open-design/itsadate-screens/HANDOFF.md`
- Modify: `docs/superpowers/START-HERE.md`, `docs/superpowers/plans/2026-11-20-00-roadmap.md` (Phase 4 row), this plan (a Status section at the top)

**Interfaces:**
- Produces, for Phase 5: per screen, its path, the states it shows, the kit components it uses (`data-component`), the **new components** Phase 5 must add (the phone search sheet, tabs, the segmented control, the photo drop zone, the status chip variants, the side panel or sheet, the confirm dialog, the places panel and map), and every "Phase 5 restyles" change to the Phase 3 kit or header.

- [ ] **Step 1: Collection check**

`check_open_design_artifact` with `collectionId: "itsadate-screens"`. Expected: no `flow-broken-link`, `flow-dead-end`, `flow-unlinked`, `flow-nav-drift` or `task-unreachable`. `flow.html` is written. Fix the links (two rounds max).

- [ ] **Step 2: Write `HANDOFF.md`**

Include the owner's sign-off record from Task 3, and the critic verdict and last check run for each screen.

- [ ] **Step 3: Docs**

Mark Phase 4 built in the roadmap and START-HERE (branch, PR pending), and add Phase 5 hand-off notes pointing to `HANDOFF.md`. Add a Status section to the top of this plan.

- [ ] **Step 4: Commit**

```bash
git add .open-design/itsadate-screens docs/superpowers
git commit -m "docs: phase 4 hand-off sheet and status"
```

---

### Task 8: Whole-branch review, push and PR (controller)

- [ ] **Step 1: Review**

A final `itsadate-reviewer` pass on the most capable model, over the whole branch against this plan, spec §8.4/§8.6/§8.7 and DESIGN.md. It reads each screen's latest check screenshots under `.open-design/.checks/`. Fix the findings in a fresh designer agent, re-check, and commit.

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin phase-4-designs
gh pr create --base modernize --head phase-4-designs --title "Phase 4: page designs" --body-file <temp file>
```
The body has the Summary (the screen list and the sign-off), the Evidence (checks and critic verdicts per screen) and the Merge Danger (two-way, contained: designs only), and ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Expected: the `ci` check is green. Don't merge: the owner merges.
