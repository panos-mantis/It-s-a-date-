# It-s-a-date-
An app where people can upload date ideas rate them filter them and find places near them for those activities

## Local setup (work in progress)

Requirements: Node ^22.22.2 or >=24.15.0 and npm.

```bash
git clone <repo-url> its-a-date
cd its-a-date
npm ci
```

Copy the API env template and fill it in:

```bash
# macOS / Linux / Git Bash
cp apps/api/.env.example apps/api/.env
```

```powershell
# Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env
# Windows cmd
copy apps\api\.env.example apps\api\.env
```

`apps/api/.env` holds the Atlas connection string (`MONGODB_URI`) and the JWT secret, so only the owner can fill it in. It is git-ignored; never commit it. Point it at the dev database `itsadate_dev`, never at `ItsADate` (the app refuses prod outside `NODE_ENV=production`).

Start everything with `npm run dev` (API on http://localhost:4000, web on http://localhost:5173).

### Database scripts

Run from the repo root. Every script targets the database named in `MONGODB_URI` unless you pass `--db <name>`; targeting `ItsADate` (prod) needs an explicit `--db ItsADate` and a typed confirmation.

```bash
# Convert the legacy data to the new schema (idempotent; try --dry-run first)
npm run migrate -w @itsadate/api -- [--dry-run] [--verbose] [--db <name>]

# Create or promote an admin (prompts for the password)
npm run create-admin -w @itsadate/api -- --email <e> --name "<n>" [--db <name>]

# Load curated sample ideas, tags and users
npm run seed -w @itsadate/api -- [--mode dev|prod] [--reset] [--remove] [--db <name>]
```

The server never builds indexes. Only `migrate` and `seed` do, so run one of them on a fresh database. The server logs a warning at startup if any index is missing.

### Web app

`apps/web` is React 19 + Vite + Tailwind v4, with TanStack Query and React Router 7.

- `npm run dev` serves it on http://localhost:5173. Vite proxies `/api` to the API on port 4000. `npm run preview -w @itsadate/web` serves the build on port 4173 with the same proxy.
- The theme (colours, fonts, radii) lives in `apps/web/src/styles/index.css`. It follows `DESIGN.md` and `.open-design/design-systems/style-tiles-for-it-s-a-date-a-web-app-where-peop/tokens.css`.
- The UI kit is in `apps/web/src/components/ui/` (list in `index.ts`). The API client and query hooks are in `apps/web/src/lib/` and `apps/web/src/features/*/api.ts`.
- Tests run with Vitest, Testing Library and MSW: `npm run test -w @itsadate/web`. MSW answers the `/api/v1` calls, so no API or database is needed.

Root scripts: `lint`, `typecheck`, `test`, `build`, `ci` (runs all four), `format`.

The previous web app lives under `apps/web/legacy/` for reference until it is replaced.
The full README comes in Phase 7.
