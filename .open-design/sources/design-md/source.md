---
name: "Design System Inspired by Coral Friendly"
description: "Category: Lifestyle & Social Warm cream canvas, coral accent and soft-serif headlines: a photo-first, Airbnb-feel marketplace for date ideas with its own personal, approachable voice."
colors:
  primary: "#F06A4C"
  on-primary: "#2A1A14"
  background: "#FBF6F0"
  surface: "#FFFDF9"
  text: "#2A1A14"
  text-secondary: "#2A1A14"
  muted: "#6E5D52"
  border: "#E6D9CB"
  success: "#2E7D4F"
  warning: "#9A6400"
  danger: "#B42C2C"
typography:
  display:
    fontFamily: "Fraunces"
    fontSize: "3rem"
    lineHeight: "1.08"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Fraunces"
    fontSize: "1.875rem"
    lineHeight: "1.08"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Fraunces"
    fontSize: "1.5rem"
  body:
    fontFamily: "DM Sans"
    fontSize: "1rem"
    lineHeight: "1.55"
  label:
    fontFamily: "DM Sans"
    fontSize: "0.875rem"
  code:
    fontFamily: "ui-monospace"
    fontSize: "0.875rem"
rounded:
  sm: "10px"
  md: "16px"
  lg: "20px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "32px"
---

<!-- Written by Open Design from the "Design System Inspired by Coral Friendly" design system. Open Design never changes this file again; edit it freely. -->

# Design System Inspired by Coral Friendly

> Category: Lifestyle & Social
> Warm cream canvas, coral accent and soft-serif headlines: a photo-first, Airbnb-feel marketplace for date ideas with its own personal, approachable voice.

## Color Palette

All pairs below are measured; body text pairs clear 4.5:1.

- **Background `#FBF6F0`** (`--bg`): warm cream page canvas. Never pure white.
- **Surface `#FFFDF9`** (`--surface`): cards, search bar, inputs, menus.
- **Sunk surface `#F4EBE0`** (`--surface-sunk`): photo placeholders, quiet chips, secondary-button hover, table stripes.
- **Text `#2A1A14`** (`--fg`): warm near-black brown for all primary text (15.56:1 on bg). Also the text colour *on* coral.
- **Muted `#6E5D52`** (`--muted`): meta lines, captions, inactive categories, placeholder text (5.83:1 on bg).
- **Border `#E6D9CB`** (`--border`): hairlines, dividers, card edges. Decorative only; never the sole carrier of meaning.
- **Coral `#F06A4C`** (`--accent`): the brand. Primary buttons, the search button, the active rating. Used as a *fill*, with dark text `#2A1A14` on it (5.47:1). White on coral fails contrast, so never use it. At most two coral fills per screen.
- **Coral hover `#F4826A`** (`--accent-hover`): lighter on hover, keeps dark text.
- **Coral ink `#B23E23`** (`--accent-ink`): coral as *text*: links, tag text, "new" labels (5.42:1 on bg).
- **Coral soft `#FDE7DE`** (`--accent-soft`): tag/chip backgrounds with coral-ink text (4.90:1).
- **Status:** success `#2E7D4F`, warn `#9A6400`, danger `#B42C2C`. Text-safe on bg; use for form messages and admin approve/reject.
- **Overlay `rgba(255,253,249,0.94)`** (`--overlay`): badges sitting on photos.

## Typography

- **Display: Fraunces** (Google Fonts), a soft variable serif. Always set `font-variation-settings: "SOFT" 100, "WONK" 0` (`--soft`) so the serifs read rounded and friendly. Weight 500 for hero/H1, 600 for card titles. Italic 400 is the signature move: one or two emphasised words in a headline ("Plans worth *saying yes* to.").
- **Body/UI: DM Sans** (Google Fonts). 400 for reading, 500 for UI labels and nav, 600 for buttons and emphasis. Never 700+.
- **Scale:** xs 12 · sm 14 · base 16 · lg 20 · xl 24 · 2xl 30 · 3xl 38 · 4xl 48 px.
- Headings use `--leading-tight` 1.08 and `--tracking-display` -0.025em at 30px and up; card titles -0.01em, line-height 1.2. Body `--leading-body` 1.55, max 65ch.
- Small uppercase eyebrows (xs, 600, letter-spacing at least 0.06em) for section labels only.
- Never more than three type sizes above the fold.

## Voice & Tone

Warm, a little playful, never cheesy. Talk like a friend who plans great evenings: "Plans worth saying yes to", "Save for later", "Find places near me". Short, concrete titles for ideas ("Golden-hour desert drive", "Pottery for two"). Second person, sentence case everywhere (no Title Case Buttons). Empty states are encouraging ("No ideas here yet. Be the first to share one."). Errors say what to do next and never blame.

## Imagery & Iconography

- **Photography leads.** Every date idea has a real, warm, naturally lit photo, 4:3, `object-fit: cover`, `--radius-lg` 20px corners. People and places over objects; golden hour and candid over staged stock.
- Photos never carry text except one overlay badge (top-left, `--overlay` background, pill) and a save-heart (top-right, 36px round).
- **Icons:** simple 1.75px-stroke line icons with rounded caps and joins on a 24px grid (Lucide-style). Category row icons 26px, inline icons 14-18px. Icons inherit `currentColor`.
- No decorative illustrations, decorative gradients or glow effects.

## Layout & Spacing

- Container max 1200px; gutters 16 / 28 / 40px (phone / tablet / desktop). Section rhythm 32 / 48 / 64px.
- Spacing steps: 4, 8, 12, 16, 24, 32, 48px (`--space-1` to `--space-7`).
- **Idea grid:** 4 columns at 1280px and up, 3 at 1024px, 2 at 640px, 1 below; 24px column gap, 40px row gap. Cards are borderless: the photo is the card.
- **Radius:** 10px inputs (`--radius-sm`), 16px buttons and menus (`--radius-md`), 20px photos and panels (`--radius-lg`), pill for search bar, chips, badges and avatars.
- **Elevation:** flat by default. `--elev-raised` for menus, modals, hovered cards and badges; `--elev-search` only for the sticky search bar.
- Sticky header: surface background, 1px bottom border once scrolled.

## Motion

Quiet and quick. Hover and micro-states 150ms, state changes 200ms, easing `cubic-bezier(0.2, 0, 0, 1)`.
- Cards: the photo scales to 1.03 inside its rounded mask on hover; title colour unchanged.
- Buttons: background colour change only, no lift.
- Category row: the active underline slides between items (200ms).
- No scroll-triggered entrance animations; loading skeletons shimmer softly.
- The hero does not animate on load.
- `prefers-reduced-motion: reduce` removes the photo scale, underline slide and shimmer.

## Components

- **Primary button:** coral fill `#F06A4C`, text `#2A1A14`, DM Sans 600 16px, letter-spacing 0.02em, padding 12x24px (about 44px tall), radius 16px, 1.5px transparent border, no shadow. Hover `#F4826A`. Sentence case.
- **Secondary button:** surface fill, `--fg` text, 1.5px `--fg` border, same size; hover fills `--surface-sunk`.
- **Ghost / text button:** no fill or border, `--accent-ink` text, underline on hover.
- **Input:** surface fill, 1px border in `--muted` for visibility, radius 10px, padding 12x14px, 16px DM Sans; label above in 14px 600. Focus: a 3px ring of coral at 30% opacity plus a coral-ink border. Helper text 12px muted; error text in danger.
- **Search bar (signature):** pill, surface, 1px border, `--elev-search`, min-width 520px on desktop, segments "Where / When / Vibe" separated by 1px borders (label 12px 600, value 14px muted), round 44px coral search button with a dark icon. On phones it collapses to a single "Find a date idea" pill that opens a full-screen sheet.
- **Category row:** centred row of icon-over-label items, 48px gap, 12px 500 muted labels; the active item uses `--fg` and a 2px `--fg` underline. Scrolls horizontally on small screens.
- **Date-idea card:** 4:3 photo (20px radius), then a title row (Fraunces 600 20px, rating right-aligned: dark 13px stars, "4.6" 14px 600, "(128)" muted), a meta line 14px muted (distance / time / price), and a foot row with the tag chip.
- **Tag chip:** pill, `--accent-soft` background, `--accent-ink` text, 12px 600, padding 4x12px, optional 14px icon. Quiet variant: sunk background with fg text.
- **Rating input:** five 24px star buttons, filled `--fg`, empty `--border`; hover previews the value; the signed-in user's rating is labelled "Your rating".
- **Badge on photo:** pill, `--overlay`, 12px 600, `--elev-raised`.
- **Nav:** wordmark "It's a Date" in Fraunces italic 500 20px with a small heart glyph; on the right a "Share an idea" text button and an avatar menu (pill, 1px border).
- **Admin panels and tables:** surface panels, 20px radius, 1px border, rows separated by `--border`; approve is a success text button, reject a danger text button.

## Agent Prompt Guide

Build on a warm cream canvas (`#FBF6F0`) with cream-white surfaces, warm brown text and a single coral accent used sparingly as a fill with dark text on top: never white on coral, never Airbnb red. Headlines are Fraunces with the SOFT axis on, often with one italic phrase; everything else is DM Sans at 400/500/600. Let real 4:3 photos with 20px corners lead every listing, keep cards borderless, and give pages Airbnb-like whitespace, a sticky pill search bar and a centred category icon row. Tags are coral-soft pills, ratings are dark stars with a muted count, and motion is subtle and respects reduced motion.
