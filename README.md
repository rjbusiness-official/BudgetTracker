# Budget Tracker

A responsive budget tracker for Ruru and Joselle. It supports cutoff-based income recording, expenses, bills, debts, savings goals, family share, reports, and transaction history.

The app can run locally during development and can also be deployed to GitHub Pages while using Supabase for login and cloud database sync.

## Local Development

```bash
npm install
npm run dev
```

## Build Commands

```bash
npm run build
npm run build:github
```

- `npm run build` verifies the main Vinext build.
- `npm run build:github` creates the static GitHub Pages output in `dist-github`.

## Supabase Setup

1. Create the Auth user in Supabase:
   - Email: `rj.business0416@gmail.com`
   - Password: `041625`
2. Run `supabase/household_budgets.sql` in the Supabase SQL Editor.
3. Keep Row Level Security enabled.

Only use the Supabase publishable key in frontend or GitHub Pages settings. Do not add a service role key to this repository.

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds the static app and publishes it to GitHub Pages.

To publish:

1. Push to the `main` branch.
2. In GitHub, open Settings > Pages.
3. Set Source to GitHub Actions.
4. Wait for the deploy workflow to finish.

## Project Notes

- `.site/hosting.json` stores local site hosting metadata.
- `vite.github.config.ts` is used only for the GitHub Pages static build.
- `supabase/household_budgets.sql` creates the Supabase table and policies.