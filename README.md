# It-s-a-date-
An app where people can upload date ideas rate them filter them and find places near them for those activities

## Local setup (work in progress)

Requirements: Node ^22.22.2 or >=24.15.0 and npm.

```bash
git clone <repo-url> its-a-date
cd its-a-date
npm ci
```

Copy the API env template (then fill in values as needed):

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

Start everything with `npm run dev` (API on http://localhost:4000, web on http://localhost:5173).

Root scripts: `lint`, `typecheck`, `test`, `build`, `ci` (runs all four), `format`.

The previous apps live under `apps/*/legacy/` for reference until they are replaced.
The full README comes in Phase 7.
