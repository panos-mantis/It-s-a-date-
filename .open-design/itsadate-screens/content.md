# It's a Date screens: shared sample content

Every screen in this collection uses the data below, so the same idea shows the same title, numbers, photo and creator everywhere. Values follow `packages/shared/src/constants.ts` and the shapes in `packages/shared/src/dto.ts` (`IdeaDTO`, `UserDTO`). Titles and descriptions come from `apps/api/src/seed/ideas.ts`, except the two long-content items marked "authored for this sheet".

"Today" in these mockups is **25 November 2026**.

## Labels (from constants.ts, use verbatim)

- Budget: `1` = `$`, `2` = `$$`, `3` = `$$$`
- Duration: `short` = `1–2 hours`, `half-day` = `Half day`, `full-day` = `Full day`
- Sort: `new` = `New`, `top` = `Top rated`
- Page size: 24 (max 48)
- Card meta line: `<budget> · <duration>`, e.g. `$$ · Half day`. Hidden entirely when both are null; shows only the one that exists when one is null.
- Rating: `4.6 (128)` with a dark star; `ratingCount: 0` shows `No ratings yet` (never `0.0 (0)`).

## Tags (name, slug, Lucide icon)

| Name | Slug | Icon |
|---|---|---|
| Food | `food` | `utensils` |
| Adventure | `adventure` | `mountain` |
| Home | `home` | `house` |
| Self-date | `self-date` | `heart` |
| Board games | `board-game` | `dice-5` |
| Dancing | `dancing` | `music` |
| Self-care | `self-care` | `flower-2` |
| Learning | `learning` | `book-open` |

## Users

| Name | Role | Email | Avatar initial | Where it appears |
|---|---|---|---|---|
| Maya Chen | user | maya.chen@example.com | M | The logged-in user on Home, Idea detail, Share and Profile |
| Panos | admin | (owner's account) | P | Only on the Admin screen |

Other creators (sample users who shared ideas; they only appear as a creator name): Jonah Reyes, Priya Natarajan, Sam Okafor, Lena Brooks, Daniel Okoye, and **Maria Fernanda Castellanos-Villalobos y de la Cruz** (50 characters, the long-name test).

## The 12 ideas

Sorted by `createdAt`, newest first (the Home "New" order). All are `status: approved`.

| # | Title | Tags | Budget | Duration | Meta line | placeType | Rating | Saves | Creator | createdAt | Photo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Salsa social night | dancing | 2 | short | $$ · 1–2 hours | bar | No ratings yet (0) | 3 | Jonah Reyes | 2026-11-24 | P1 |
| 2 | A slow Saturday at the farmers market, then a picnic lunch by the river for two! | food, adventure | 1 | full-day | $ · Full day | park | 4.8 (23) | 61 | Maria Fernanda Castellanos-Villalobos y de la Cruz | 2026-11-22 | P2 |
| 3 | Dumpling crawl | food | 2 | short | $$ · 1–2 hours | restaurant | 4.6 (128) | 342 | Maya Chen | 2026-11-19 | P3 |
| 4 | Bookshop and coffee afternoon | self-date, learning, food | 1 | half-day | $ · Half day | cafe | 4.9 (57) | 203 | Maya Chen | 2026-11-14 | P4 |
| 5 | Golden-hour viewpoint drive | adventure | 1 | half-day | $ · Half day | viewpoint | 4.7 (89) | 276 | Sam Okafor | 2026-11-10 | P5 |
| 6 | Game cafe afternoon | board-game | 2 | half-day | $$ · Half day | cafe | 4.2 (19) | 47 | Jonah Reyes | 2026-11-06 | P6 |
| 7 | Dress-up night at a jazz club | dancing | 3 | short | $$$ · 1–2 hours | bar | 4.5 (64) | 190 | Priya Natarajan | 2026-10-30 | P7 |
| 8 | Pizza from scratch | home, food | 1 | short | $ · 1–2 hours | none | 4.4 (112) | 301 | Sam Okafor | 2026-10-24 | P8 |
| 9 | Couples massage | self-care | 3 | half-day | $$$ · Half day | spa | 4.8 (36) | 154 | Maya Chen | 2026-10-15 | P9 |
| 10 | Sushi counter night | food | 3 | short | $$$ · 1–2 hours | sushi | 4.6 (73) | 219 | Priya Natarajan | 2026-10-08 | P10 |
| 11 | Backyard movie night | home | 1 | short | $ · 1–2 hours | none | 4.3 (41) | 88 | Lena Brooks | 2024-06-02 | **null** |
| 12 | Planetarium show | learning | **null** | **null** | (hidden) | museum | 3.9 (8) | 12 | Daniel Okoye | 2024-02-17 | P12 |

On the Home grid the card's tag chip shows the **first** tag only (the main tag); Idea detail shows all of them.

Maya's state (logged in): she has **saved** ideas 2, 5 and 9 (filled heart) and **rated** idea 3 (her rating 5) and idea 10 (her rating 4).

### Review Focus items

| Case | Idea |
|---|---|
| `image: null` (a migrated idea; the card shows the sunk placeholder) | #11 Backyard movie night |
| `budget` and `duration` null (a migrated idea an admin hasn't filled in; the meta line is hidden) | #12 Planetarium show |
| `ratingCount: 0` ("No ratings yet") | #1 Salsa social night |
| Three tags | #4 Bookshop and coffee afternoon (self-date, learning, food) |
| 80-character title (clamps to two lines on cards, wraps in full on detail) | #2 |
| 50-character creator name | #2, by Maria Fernanda Castellanos-Villalobos y de la Cruz |
| 2000-character description (for Idea detail, Task 2) | #2 |

New ideas require a photo, budget and duration (`ideaCreateSchema`), so the null cases are migrated ideas (older `createdAt`, older accounts).

### Descriptions

1. **Salsa social night.** Many studios run a beginner lesson before an open social. Learn a basic step, swap partners if you feel brave and stay for the last song.
2. **A slow Saturday at the farmers market, then a picnic lunch by the river for two!** (authored for this sheet; seed title "Farmers market lunch"; exactly 80 characters). Description, exactly 2000 characters, paragraphs separated by one blank line:

```text
Get there early, before the crowds and while the bread is still warm. Bring a tote bag each, some cash in small notes and no shopping list at all. The rule for the morning is simple: you each have ten dollars, and you have to buy one thing the other person has never tried.

Walk the whole market once before you buy anything. Taste every sample you are offered, ask the cheese seller what they would take home tonight, and let the person at the flower stall talk you into a small bunch of something bright. If there is a coffee cart, start there. If there is a busker, stop and listen to one full song, even if you have heard it a hundred times.

On your second lap, start building lunch. A good loaf, something soft to spread on it, a handful of whatever fruit is in season and a jar of something pickled are all you really need. Add a wedge of cheese, a few slices of cured meat or a tub of hummus, and one sweet thing you will argue about splitting. Ask for a paper bag for the tomatoes and keep the berries on top so they survive the walk.

Then head for the river. Find a patch of grass with a bit of shade, spread out a blanket or your jackets, and unpack everything at once like a little feast. Tear the bread by hand. Use a pocket knife for the cheese, or just break it. Take your time: nobody is waiting for the table, and there is no bill to ask for.

After lunch, lie back and watch the boats, the joggers and the dogs who think every picnic is for them. Read a few pages of a book out loud, play a round of cards, or close your eyes for twenty minutes. If the weather turns, there is usually a covered bench or a cafe close by, and the picnic simply moves indoors.

Before you leave, gather every crumb and wrapper and take them with you. Keep the flowers for the kitchen table, in a jar of water by the window, all week. And write down the name of the stall that sold you the best thing you ate, because next Saturday you will want to go back and say thank you, and probably buy double.
```

3. **Dumpling crawl.** Pick three dumpling spots within walking distance and order one plate at each. Compare the fillings, argue about the dipping sauce, and keep the best place for round two.
4. **Bookshop and coffee afternoon.** Browse an independent bookshop until something finds you. Take it to a cafe nearby, order a good coffee and read the first chapter before you head home. (Seed tags are self-date and learning; food is added here for the three-tag case.)
5. **Golden-hour viewpoint drive.** Chase the last hour of daylight to the best lookout within reach. Bring a thermos, a blanket and a playlist, and stay until the lights come on below you.
6. **Game cafe afternoon.** Find a cafe with a shelf of games and ask the staff for something neither of you has played. Order a snack, read the rules together and play the first round slowly.
7. **Dress-up night at a jazz club.** Wear the outfit you save for special occasions and book a table near the band. Order something good, stay for both sets and slow dance on the way home.
8. **Pizza from scratch.** Make the dough together, then pile on whatever is in the fridge. Stretch it badly, bake it hot and eat it straight off the tray.
9. **Couples massage.** Book side-by-side treatments and arrive early enough for tea. The best part is the hour after: nowhere to be and nothing to decide.
10. **Sushi counter night.** Grab two seats at the counter and let the chef choose. Ask what is best today, try one thing neither of you would normally order, and take your time.
11. **Backyard movie night.** Hang a sheet, point a projector or a laptop at it and bring out every blanket you own. Make popcorn, dim the lights and let the stars do the rest.
12. **Planetarium show.** Lean back in the dark and let someone else point out the constellations. Afterwards, walk home looking up and see how many you can still find.

## Photos

Every URL below returned **HTTP 200** to `curl -sI` on 2026-11-25 (a made-up id returned 404, so the check discriminates). Each was also viewed as a thumbnail to confirm it matches its idea. Size suffix used on every screen: `?w=800&q=80&auto=format&fit=crop`.

Licence: [Unsplash Licence](https://unsplash.com/license) (free to use, no permission needed; credit is appreciated, not required). The photographer's name could not be looked up from this environment, so each credit names the Unsplash photo id; confirm the photographer on unsplash.com before these photos go into the real app (Phase 7).

| Ref | Idea | URL | Shows | Credit |
|---|---|---|---|---|
| P1 | Salsa social night | `https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&q=80&auto=format&fit=crop` | A crowded dance floor seen from above, warm light | Unsplash photo-1504609813442-a8924e83f76e, Unsplash Licence |
| P2 | Farmers market (long title) | `https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80&auto=format&fit=crop` | Market stalls piled with fruit and vegetables | Unsplash photo-1488459716781-31db52582fe9, Unsplash Licence |
| P3 | Dumpling crawl | `https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80&auto=format&fit=crop` | Dumplings on a wooden plate with chopsticks | Unsplash photo-1496116218417-1a781b1c416c, Unsplash Licence |
| P4 | Bookshop and coffee afternoon | `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80&auto=format&fit=crop` | Long bookshelves under warm hanging bulbs | Unsplash photo-1481627834876-b7833e8f5570, Unsplash Licence |
| P5 | Golden-hour viewpoint drive | `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&auto=format&fit=crop` | Mountain valley lookout with pines | Unsplash photo-1464822759023-fed622ff2c3b, Unsplash Licence |
| P6 | Game cafe afternoon | `https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&q=80&auto=format&fit=crop` | A board game mid-play, dice and pieces | Unsplash photo-1610890716171-6b1bb98ffd09, Unsplash Licence |
| P7 | Dress-up night at a jazz club | `https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80&auto=format&fit=crop` | Saxophone section under stage lights | Unsplash photo-1415201364774-f6f0bb35f28f, Unsplash Licence |
| P8 | Pizza from scratch | `https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop` | A home-baked pizza with tomatoes and rosemary | Unsplash photo-1513104890138-7c749659a591, Unsplash Licence |
| P9 | Couples massage | `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&auto=format&fit=crop` | A massage at a spa, oil being poured | Unsplash photo-1544161515-4ab6ce6db874, Unsplash Licence |
| P10 | Sushi counter night | `https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&auto=format&fit=crop` | Salmon sushi rolls at a counter, low light | Unsplash photo-1579871494447-9811cf80d66c, Unsplash Licence |
| P12 | Planetarium show | `https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80&auto=format&fit=crop` | A starry night sky with a shooting star | Unsplash photo-1419242902214-272b3f66ee7a, Unsplash Licence |

Spare checked photos (200, viewed), for later screens that need one more: croissants `photo-1555507036-ab1f4038808a` (pastry walk), books on a shelf `photo-1495446815901-a7297e633e8d`, sushi `photo-1553621042-f6e147245754`.

Missing photo (idea 11, and any `image: null`): the sunk placeholder, a `#F4EBE0` 4:3 box with a 32px muted `image-off` line icon, as in `apps/web/src/components/ui/Card.tsx`.

## Shared markup

`home.html` holds the header and the card markup that later screens copy. Kit components carry `data-component` (`Card`, `Button`, `Chip`, `SearchBar`, `CategoryRow`, `StarRating`, `Input`, `EmptyState`, `Skeleton`, `Toast`) so the Phase 5 port maps them onto `apps/web/src/components/ui/`.
