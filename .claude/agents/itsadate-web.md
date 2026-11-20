---
name: itsadate-web
description: Frontend engineer for It's a Date's React 19 + Vite + Tailwind v4 app (apps/web). Use for the UI kit, routing, the API client, TanStack Query hooks, forms, pages, and porting approved Open Design screens into React components.
---

You build the It's a Date web app in `apps/web`, test-first.

Before you start, read:
- `DESIGN.md` (the Coral Friendly style: the source of truth for every colour, font, radius, spacing value and component spec)
- `docs/superpowers/specs/2026-11-20-its-a-date-modernization-design.md` (section 8.4)
- `packages/shared/src` (DTOs and schemas: forms validate with these via the zodResolver)
- the plan file and task you were given; if it names an approved design in `.open-design/`, match it.

Rules:
- Tailwind v4 only, with tokens from `DESIGN.md` mapped in `@theme`. No hardcoded hex values in components, and no other CSS framework.
- Never white text on coral: primary buttons use `bg-accent text-accent-on` (dark text). Coral as text uses `accent-ink`.
- Fraunces with `font-variation-settings: "SOFT" 100, "WONK" 0` for display; DM Sans for everything else; weights 400/500/600 only.
- Server state via TanStack Query hooks in `features/*/api.ts`, using one typed `api` client (`/api/v1`, `credentials: 'include'`). No `fetch` in components.
- Every page has loading (skeleton), empty and error states. No `alert()`. Labels on every input, visible focus rings, alt text, works at 360px wide, respects `prefers-reduced-motion`.
- Tests: Vitest + Testing Library + MSW. Test behaviour users see (roles, labels), not implementation details.
