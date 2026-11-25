# Phase 4 hand-off: It's a Date screens

For the Phase 5 web engineers. Port one screen at a time with `port_open_design_artifact_to_app`. Every screen is in this folder, `.open-design/itsadate-screens/`, and is registered in the collection `itsadate-screens` ("It's a Date screens", 7 screens).

**Read first**

- Spec §8.4, §8.6 and §8.7, and `DESIGN.md` (Coral Friendly). The designs follow both.
- `content.md` is the content sheet: every idea, user, label and photo the screens use. `_shared/data.json` holds the same data in `IdeaDTO` / `TagDTO` / `UserDTO` shapes, plus a `places` list. Use it for MSW mocks.
- `_shared/nav.html` is the shared header for a logged-in user (Maya). Auth has its own logged-out header (R3) and Admin has its own admin header (R30).
- `flow.html` is the flow map that the collection check writes. It shows every screen and the links between them.
- Each screen has a **"Show design states"** toggle at the bottom. It opens the States board: one frame per state the page needs. **The toggle is design-only. Port the frames, not the toggle.**
- Kit components are marked `data-component="…"`. The port maps them onto `apps/web/src/components/ui/` (Button, Card, Chip, CategoryRow, EmptyState, Input, SearchBar, Skeleton, StarRating / StarRatingInput, Toast).

## 1. Screens

| # | Screen | File | Route | Skill |
|---|---|---|---|---|
| 0 | Home | `home.html` | `/` | `od:prototype:web-prototype` |
| 1 | Idea detail | `idea-detail.html` | `/ideas/:id` (not in `routes.tsx` yet; Phase 5 adds it) | `od:prototype:web-prototype` |
| 2 | Share an idea | `share.html` | `/share` | `od:prototype:web-prototype` |
| 3 | Log in and sign up | `auth.html` | `/login`, `/signup` | `od:prototype:flow-sign-in` |
| 4 | Profile | `profile.html` | `/profile` (`#ideas`, `#saved`) | `od:prototype:web-prototype` |
| 5 | Admin | `admin.html` | `/admin` (`#pending`, `#all`, `#tags`, `#users`) | `od:prototype:app-table` |
| 6 | Page not found | `not-found.html` | `*` | `od:prototype:web-prototype` |

### Home (`home.html`)

- **Default:** Maya logged in. Sticky header. Hero "Plans worth *saying yes* to." A sticky search band: the What / Vibe / Budget pill (its search button is the page's only coral fill) and a "Filters" pill whose popover holds Duration. Category row ("All" plus the 8 tags). "Date ideas" with the New / Top rated toggle. A grid of 12 cards (4/3/2/1 columns), then "Show more". The URL shape `?q=&tag=&budget=&duration=&sort=` is in a comment at the top of the file.
- **Phone (below 768px):** the search collapses to a "Find a date idea" pill that opens a full-screen sheet. The category row scrolls in its own strip.
- **Board frames:** 1 Logged out · 2 Loading · 3 No ideas match the filters · 4 No ideas yet · 5 Couldn't load · 6 Phone, 360 px (collapsed pill and open search sheet) · 7 Category row, scrolled · 8 Filters, account menu and saving (Filters popover with a count badge, user and admin menus, save / unsave / failure toasts).
- **Components:** Card, Button, Chip, SearchBar, CategoryRow, StarRating, Input, EmptyState, Skeleton, Toast.

### Idea detail (`idea-detail.html`)

- **Default:** Maya on idea 5, "Golden-hour viewpoint drive". Desktop has two columns: on the left, a sticky 4:3 photo with the heart-and-count pill ("♥ 276"). On the right: the tag chip, the title, "$ · Half day", "★ 4.7 · 89 ratings", "Shared by Sam Okafor · Nov 10, 2026", "About this date", the "Your rating" panel (4 of 5 stars, "Remove rating"), and then the compact places card "Viewpoints *near you*" with "Find places near me" (the one coral fill). On phones the photo is 3:2 (R13) and everything stacks.
- **Board frames:** 1 Logged out ("Log in to rate") · 2 No photo, and no ratings yet · 3 Budget and duration missing · 4 An 80-character title, a 50-character name and the 2000-character description · 5 Places, waiting for your location · 6 Places found (radius 3 / 5 / 10 km, numbered list, static map, OSM attribution, "Show all 7" on phones) · 7 Places, location turned off (city or postcode fallback) · 8 Places, nothing within 3 km ("Widen to 10 km") · 9 Places, the map service is down · 10 An at-home idea, no place needed (no places card) · 11 Idea not found, or not approved · 12 Rating saved, and the rating input step by step.
- **Components:** Button, Chip, StarRating (summary and input), Input, Skeleton, EmptyState, Toast.

### Share an idea (`share.html`)

- **Default:** Maya part way through the form, in a 640px column. Photo preview (4:3) with Replace and Remove, or the drop zone. Title (18/80). Description (164/2000). Tags (pick 1–3, with a check icon on picked ones). Place type (a select with readable labels). Budget and Duration as segmented controls. "Send for review" (the one coral fill) with "An admin checks every idea before it goes live."
- **Board frames:** 1 Field errors (summary with jump links; a 422 maps onto the fields) · 2 Uploading the photo (progress bar; submit disabled) · 3 Upload failed (rejected file, and a dropped connection) · 4 Sending for review (busy button) · 5 Sent: waiting for review ("See it on your profile", "Share another") · 6 Logged out (a note: the guard sends you to `/login?next=%2Fshare`) · 7 Empty, before you start · 8 At the limits: 80 characters and 3 tags.
- **Components:** Button, Card (the success preview), Chip, Input, Toast.

### Log in and sign up (`auth.html`)

- **Default:** the logged-out header. Two cards: "Welcome *back*" (Log in) and "Create your *account*" (Sign up). They sit side by side on desktop and stack on phones. Both submit buttons are coral (two fills, the limit).
- **Board frames:** 1 Wrong email or password · 2 Email already has an account ("Log in instead") · 3 Field checks · 4 Busy · 5 Can't reach the server (`NETWORK_MESSAGE` verbatim) · 6 Sent here from Share an idea ("Log in to share your idea") · 7 Done: the toast after logging in or signing up.
- **Components:** Button, Input, Toast.

### Profile (`profile.html`)

- **Default:** Maya: avatar, name, email. Tabs "Your ideas 5" and "Saved 3", with hash sync (`#ideas`, `#saved`). Your ideas lists her ideas newest first, each with a status badge: Pending review, Not approved (with "Share it again with changes"), or Approved. Only approved cards link. Saved has three cards with filled hearts. Un-saving works in the preview, with an Undo toast.
- **Board frames:** 1 No ideas yet · 2 Nothing saved · 3 Loading · 4 Couldn't load · 5 A 50-character name · 6 Un-saving a card, with Undo · 7 Logged out (a note: `/login?next=%2Fprofile`, hint "Log in to see your ideas and saved ideas").
- **Components:** Card, Chip (tags, and status with `data-variant="pending|approved|rejected"`), Button, EmptyState, Skeleton, StarRating, Toast.

### Admin (`admin.html`)

- **Default:** Panos (admin). The site header with the menu Your ideas, Saved ideas, Admin (current), Log out. "Admin" heading. Tabs: Pending 3 / All ideas / Tags / Users, with hash sync.
  - **Pending:** oldest first. Each row has a thumb, title (opens Edit), place type and meta, an excerpt, creator, tags, submitted time, and Approve / Edit / Reject.
  - **Edit idea:** a 560px side panel, a full-screen sheet on phones. It has every Share field plus Status, "Not set" for migrated ideas, and a danger zone with "Delete idea".
  - **All ideas:** "Search titles" and a status filter (Approved / Pending review / Not approved).
  - **Tags:** add (with a live slug and icon preview), rename in place, delete.
  - **Users:** search, role chip, Make admin / Remove admin.
  - **At 360px** every table becomes stacked cards, with no sideways scroll.
- **Board frames:** 1 Nothing to review · 2 Reject, asked first · 3 Delete a tag, asked first · 4 Removing the last admin ("You can't remove the last admin. …") · 5 A tag name that's taken · 6 Approved, with Undo · 7 Loading · 8 Phone: rows become cards · 9 Signed in, but not an admin. Plus a note frame on the All ideas search API gap.
- The tab panels also carry the kit's `data-od-state` slots (default, empty, loading).
- **Components:** Button, Chip (tags; status `pending|approved|rejected`; role `admin|user`), Input, EmptyState, Skeleton, StarRating, Toast.

### Page not found (`not-found.html`)

- **Default (the only state):** the shared header, the eyebrow "Page not found", "This page *wandered off*.", "The link may be old, or the idea was removed." and the primary "Back to all ideas". No illustration and no board. Logged out, only the header changes.
- **Components:** Button, EmptyState.

## 2. New components Phase 5 must add

None of these exist in `apps/web/src/components/ui/` yet.

| Component | Where | What it must do |
|---|---|---|
| Phone search sheet | Home (phone pill, frame 6) | Full screen. What (Input), Vibe as chips, Budget as a 3-way toggle ("Tap again to clear."), Duration chips, "Clear all" and "Show ideas". **Trap focus, return focus to the pill on close, make the page behind it inert, close on Escape.** The preview does none of this. |
| Filters popover | Home | Holds Duration. Its pill shows a count badge when a filter is on. |
| Tabs | Profile, Admin | A real tablist: `role=tab`, `aria-selected`, `aria-controls`, roving tabindex, Left / Right / Home / End. Selection follows the URL hash. Scrolls inside itself on phones. |
| Segmented control | Share, Admin Edit | Radios styled as segments. The picked one is coral-soft with a coral-ink border, 600 text and a check icon (the same as a picked tag). Admin's 4-option version becomes a 2×2 grid under 480px. |
| Selectable choice chip | Share tags, Home sheet | `aria-pressed`. Picked: coral-soft, coral-ink border, check icon in place of the tag icon. At 3 tags the rest get `aria-disabled` and the hint changes. |
| Photo drop zone | Share, Admin Edit | "Add a photo", "Drag it here or choose a file", "JPEG, PNG or WebP, up to 5 MB". Then a 4:3 preview with Replace and Remove, a progress bar while uploading, and the two failure states (frame 3). Upload starts on file pick. |
| Status chip variants | Profile, Admin, Share success | Pending review (warn, clock), Approved (success, circle-check), Not approved (danger, circle-x). Always icon plus word, never colour alone. On a photo it sits on the 94% cream overlay. |
| Role chip | Admin Users | Admin (coral-soft, shield) and User (quiet, user icon). |
| Side panel / sheet | Admin Edit | `role=dialog`, `aria-modal`, labelled by its heading. Focus starts on the heading, Tab cycles inside, Escape closes, focus returns to the opener, and the header and `<main>` are inert. 560px on desktop, full screen on phones. |
| Confirm dialog | Admin reject, delete tag, demote | `role=alertdialog`. Focus starts on Cancel. The confirm button is a danger fill with cream text (`--on-danger`). Demoting yourself asks "Remove your own admin access?". |
| Places panel and map | Idea detail | The compact card, then waiting / found / denied / none / error. The numbered list and map markers are linked by hover and focus. The radius toggle is 3 / 5 / 10 km. "Show all 7" on phones. The map is a static drawing now; Phase 6b swaps in react-leaflet at the same size, with the same numbered markers and the "© OpenStreetMap contributors" attribution. |
| Toast with action | Profile, Admin | An "Undo" button. Undo toasts last 8 s, others 4 s. Pause on hover or focus, then resume with the toast's own remaining time. Escape closes it. Use **one** live region (`role=status`), rendered from page load and never `display:none`. |
| Password show toggle | Auth | A "Show" / "Hide" button inside the password field. |
| Heart with count | Idea detail | One overlay pill, "♥ 276", `aria-pressed`. Cards keep the round 44px heart. |
| Rating panel | Idea detail | See StarRatingInput in section 3. |
| Design-states toggle | every screen except 404 | **Design only. Don't port it.** Port the frames inside it as real states. |

## 3. Phase 5 restyles (changes to the Phase 3 kit and header)

### Header (`Header.tsx`, `AccountMenu.tsx`)

- **"Your ideas"** is a ghost link next to "Share an idea" from 640px up, going to `/profile#ideas` (R8). It is hidden on phones.
- **Phone "+ Share":** a labelled ghost pill (a + icon and "Share", 78×44, 1px hairline border) replaces the bare + icon. Its accessible name stays "Share an idea" (R8). To fit at 360px: the wordmark is 18px on phones (20px on desktop), ghost and secondary buttons have 10px side padding, and the share icon is 16px.
- **Account menu:** "Your ideas" first, then **"Saved ideas"** (`/profile#saved`) in place of "Profile" (R28), then "Admin" for admins (as today), then "Log out".
- **Current page:** the current header link gets a 2px `--fg` underline, 6px below the text. The phone pill gets a `--fg` border instead. A current menu item is weight 600. On Profile, the current mark follows the selected tab. With the menu closed on the Saved tab, the desktop header shows no current item.
- The header actions may wrap below 360px. Logged out, the Phase 3 header needs about 344px.
- The header is sticky. Its bottom border shows once the page scrolls.
- On the auth page's phone header: keep the 16px gutter, a 2px gap between actions, and `padding: 0 6px` on "Log in" under 400px. Every target stays 44px tall.

### Kit components

- **Focus ring:** a 2px coral-ink outline. The kit's 3px coral ring at 30% opacity is too faint on cream.
- **Card:** an optional `href` (pending and not-approved cards don't link), an optional status line ("Waiting for review", "Not approved this time", "Live · 342 saves"), and a status badge overlay with a tone. Leave the rating slot out when `ratingCount` is 0 (R7). Clamp titles to two lines with `line-clamp` (R5). The no-photo placeholder uses `image-off` on cards and the main tag's icon on the detail page: pick one rule.
- **StarRating summary:** on the detail page it reads "★ 4.7 · 89 ratings", and with no ratings "No ratings yet. Be the first." Cards keep "4.7 (89)". The kit's coral "New" for 0 ratings goes.
- **StarRatingInput:** 44×44 hit areas around 24px stars. The legend is "Rate this idea" until rated, then "Your rating". A status line ("You gave it 4 out of 5. Pick a star to change it."), and a "Remove rating" ghost button shown only while a rating exists. Empty stars use `--muted`, not `--border` (1.3:1 fails WCAG 1.4.11).
- **SearchBar:** the segments are What / Vibe / Budget, plus the Filters pill for Duration. On phones it collapses to the pill and sheet (section 2), instead of stacking its segments.
- **Chip:** add the selectable variant, the status variants and the role variants (section 2).
- **Button:** a busy state with a spinner and `aria-disabled` (not `disabled`), with the label unchanged. Text-button tones success and danger (Admin Approve and Reject; they underline on hover for contrast). A danger fill with cream text, for confirm dialogs only.
- **Toast:** an action button, pause on hover or focus, and an always-rendered live region (section 2).
- **New tokens** used in `admin.html`: `--on-danger: #FFFDF9`, `--scrim: rgba(42, 26, 20, 0.36)`, `--focus-ring: rgba(240, 106, 76, 0.3)`. Add them to `tokens.css` and the Tailwind theme, keeping `theme.test.ts` 1:1.

### Copy

- **Auth (R19):** the links read "New here? Create an account" and "Already have an account? Log in" (Phase 3 says "Sign up"). Added: the Show password toggle, "Log in instead" on its own line under the email-taken error, a muted sub-line under each card title, icons in the form-level error box, and `aria-disabled` busy buttons. The password hint hides while its error shows, and comes back at 8 or more characters.
- **404 (R33):** "This page wandered off." / "The link may be old, or the idea was removed." / the primary "Back to all ideas". This replaces `NotFoundPage.tsx`'s "We couldn't find that page." / "Back to home" (secondary).
- **Non-admin on `/admin` (R33):** "This page is for admins." / "You're logged in as Maya Chen. If you need to review ideas, ask an admin to give you access." / the primary "Back to all ideas". This replaces `RequireRole`'s secondary "Go home".
- **Status labels:** "Pending review", "Approved" and "Not approved", the same on every screen (R26, R29).
- **`?next` hints:** "Log in to share your idea" from `/share` (R18), and "Log in to see your ideas and saved ideas" from `/profile`.
- **API strings shown verbatim:** "Email or password is wrong", "An account with this email already exists", `NETWORK_MESSAGE`, "You can't remove the last admin", "A tag with this name already exists", "Use at least one letter or number". Map the real `authErrorMap` and API messages, not the design copy.

## 4. API gaps (Phase 5 or 6)

- **Admin ideas search (R31):** `adminIdeaQuerySchema` (`packages/shared/src/schemas/admin.ts`) has only `status`. The All ideas tab has a "Search titles" box. Add `q` to the admin ideas query, using the same regex search as the public ideas list.
- **No "All" status filter (R32):** the API needs one status per request, so the filter is Approved / Pending review / Not approved. The tab is still called "All ideas".
- **Budget and duration can't be cleared (R32):** `ideaUpdateSchema` has no null for them. So "Not set" in Edit is disabled once a value exists. Allow null on PATCH if the owner wants clearing.
- **No review note (R29):** there is no field for why an idea wasn't approved. The Not approved card shows only "Not approved this time".
- Also not designed, because no API exists: bulk actions, rows-per-page (one page, `pageSize` 24) and tag usage counts.

## 5. Parked reviewer notes, by screen

These are what the real components must do. The prototype doesn't always do them.

**All screens**

- The account menu closes on an outside click, as well as on Escape and on picking an item (H4).
- Give anchor targets and state sections a `scroll-margin-top` below the sticky header (F2).

**Home**

- Don't put a `title=` attribute on long title links that repeats the visible text (M2). The full title is already the accessible name.
- The search sheet traps focus, returns it and makes the page inert (M4; see section 2).
- Show 24 cards before "Show more" (the page size). The design shows 12.

**Idea detail**

- Arrow keys on the rating radios must not save every step. Commit on Enter, Space or blur, or debounce (D1, Phase 6a).
- The 5 km and 10 km counts (14 and 20) are illustrative. Use the API's counts (D5).
- "Show all 7": announce the change once. Either swap the label or use `aria-expanded`, not both (E1).
- Clear the lit list row and marker on blur and mouse leave (E2).
- "Search by city or postcode" shows on the compact card only after a timeout or a denial, as the brief says (E3).
- "Find places near me" runs the search in place and expands the card into the results (R15).

**Share an idea**

- After a file is picked, move focus to Replace or the preview, because the focused drop zone is gone (F1).
- On success, focus the heading, and make it an `h1` or `h2` (F3).
- While the upload runs, point the disabled submit's `aria-describedby` at the note "You can send it once the photo has uploaded." (F4).
- The title is a one-line input. Frame 8 shows it in a growing box only so the 80 characters can be read.
- "Share it again with changes" on Profile opens a blank form. Decide whether to prefill it (G2).

**Log in and sign up**

- Mark the current auth link: `aria-current` on "Log in" at `/login` and on "Sign up" at `/signup` (F7).

**Profile**

- The heart says "Save <title>" with `aria-pressed`, not "Saved: …" as well as `aria-pressed` (G4).
- Generate per-card ids (no fixed `id="rejected-title"`), and drop the `.status-action` z-index and negative margins (G3).
- Focus the tab from the URL hash without the blur-on-load hack (G5). Don't wrap the tablist in an extra region landmark (G6).
- Escape on the toast returns focus to where the user was, not always to the first heart (G7).
- A toast that replaces another while hovered starts its own timer. It must not stay paused until the pointer leaves (G1).
- **Undo reach (R27, H3):** with many saved cards, Undo is several Tab presses away and times out after 8 s. Consider keeping the toast until the next action, or a shortcut.
- **Hash through login (R27):** keep `#saved` in `?next` through the login redirect. The guard keeps only path and query today.

**Admin**

- Edit's Save sends tags and photo too, and checks the 20–2000 description and 1–3 tags rules. The title error has `aria-describedby` (H1).
- Refresh the All ideas row after a status change, including the rating cell and the title link (H2). Query invalidation does this.
- Use one helper for the excerpt, or better, `line-clamp` on the real description (H6, R34).
- Sample emails are `example.com` placeholders. `panos@example.com` stands in for the owner's real admin email.

## 6. Prototype-only behaviour: don't copy

- **"Find places near me"** jumps to the board's "Places found" frame in the preview (R15). The real button runs the search in place.
- **"Send for review"** shows the busy button briefly, then jumps to the board's "Sent" frame. The real form replaces itself with the success view after the 201.
- **The static board toasts and messages** carry no live roles, or a static `role="status"` on the older screens (D8). Real toasts go through the one live region.
- **`URL.createObjectURL`** is never revoked in Share's preview (F8). Revoke it on Replace, Remove and unmount.
- **The excerpt word cut** (admin pending rows, 60 characters plus "…", R34) and the card title clamp (R5) are there only because the check counts a CSS clamp as overflow. Use `line-clamp` on the real text.
- **The phone "Share" label** is CSS `content` (`.nav-share-short::before`), so the collection check reads the link as "Share an idea". In React, use a normal `<span>`. The link's `aria-label` stays "Share an idea".
- **Dead code:** `.site-header.is-static` on Share (F5) and the copied `.design-states` CSS on each page (E4).
- **Admin rows** come from `_shared/data.json` through a scratchpad generator script. The committed HTML is the source of truth.

## 7. Sign-off, checks and critic

### Owner sign-off (Task 3)

- On 2026-11-25 the owner agreed owner round 1, then said **"i let you decide im fine with everything"**.
- The controller recorded this as approval of Home and Idea detail (R12), with round 1 applied (commits `3b37350` and `4af6e2f`).
- The owner delegated the 3:2 phone photo on Idea detail. It is in (R13).
- Final runs at sign-off: home `2026-11-25T11-37-36`, idea-detail `2026-11-25T11-36-46`.
- Spec §8.7 asks for sign-off on Home and Idea detail only. The other five screens copy their signed-off patterns.

### Checks and critic

All runs use desktop 1440×900 and phone 360×800 with `states: true`. Each screen was also checked with its board open during its task (R16).

| Screen | Last task check | Result | Collection check (Task 7) | Critic |
|---|---|---|---|---|
| Home | `2026-11-25T12-23-24` (after the menu rename) | 1 error, 2 warnings: all the accepted R5 clamp | `2026-11-25T18-08-07`: same | polish, applied |
| Idea detail | `2026-11-25T12-27-32` | 0 / 0 | `2026-11-25T18-08-11`: 0 / 0 | polish, applied twice (Task 2 and owner round 1) |
| Share an idea | `2026-11-25T12-27-34` | 0 / 0 | `2026-11-25T18-08-14`: 0 / 0 | polish, applied |
| Log in and sign up | `2026-11-25T12-01-32` | 0 errors, 1 accepted warning (R21) | `2026-11-25T18-08-19`: same | polish, applied |
| Profile | `2026-11-25T12-27-37` | 0 / 0 | `2026-11-25T18-08-23`: 0 / 0 | polish, applied |
| Admin | `2026-11-25T18-02-05` | 0 errors, 16 data-thin and stress warnings | `2026-11-25T18-08-31`: same | polish, applied |
| Page not found | `2026-11-25T17-41-18` | 0 / 0 | `2026-11-25T18-08-34`: 0 / 0 | ship |

- **R5:** the overflow on the 80-character card title is the two-line clamp the Review Focus asks for.
- **R21:** auth's `state-missing` warning. Its states are on the closed board, by design.
- **Admin's warnings:** `sample-data-thin` on the 3-row queue and the board excerpts, and `stress-overflow` from the 2.5× text pass on fixed button labels, the nowrap `@example.com` and the shared header. With the real content nothing overflows at 360 or 320.
- **No taste warnings** came up on any screen.

### Collection check (Task 7)

- **Round 1** (`18-05-*`): no broken links, dead ends, unlinked screens or unreachable tasks. Three `flow-nav-drift` findings: auth's header, admin's header, and the shared nav missing "Share an idea" and "Profile".
- **Fix:**
  - The flow plan's nav label "Profile" became "Your ideas", the header's real label (R8/R24, R35). All 7 screens were re-registered with the same updated plan.
  - The phone "Share" text moved into CSS content, so the link text reads exactly "Share an idea".
  - Commit `295e247`.
- **Round 2** (`18-08-*`): one `flow-nav-drift` left, on auth. It is accepted: the logged-out header has Log in / Sign up and no avatar menu (R3). The flow map has 23 links, none missing, and all 3 tasks take 1 step.

## 8. Photos (R6)

- Every photo is a real Unsplash photo under the Unsplash Licence. Each URL returned HTTP 200 before it went in.
- The credits in `content.md` (Photos table) give the Unsplash photo id and the licence. **The photographers' names are missing**, because the lookup was blocked here. Confirm them on unsplash.com if any of these photos reach the real app.
- Phase 7 replaces all idea photos with credited Cloudinary uploads.
- The Share preview's croissant photo (R20) is darker than DESIGN.md's warm look. It was the only verified unused photo that fit.
