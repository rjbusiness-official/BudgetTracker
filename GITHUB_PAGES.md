# GitHub Pages + Supabase Deployment

This project has two build paths:

- `npm run dev` and `npm run build` keep the current Vinext/Sites workflow for local development.
- `npm run build:github` creates a static GitHub Pages build in `dist-github`.

## One-time Supabase setup

1. In Supabase Auth, create this user:
   - Email: `rj.business0416@gmail.com`
   - Password: `041625`
2. In the Supabase SQL Editor, run `supabase/household_budgets.sql`.

The frontend uses the Supabase publishable key only. Do not add a service role key to GitHub or frontend code.

## GitHub Pages setup

1. Push this repository to GitHub.
2. In the repository, open Settings > Pages.
3. Under Build and deployment, set Source to GitHub Actions.
4. Push to `main`, or run the workflow manually from the Actions tab.

The workflow publishes `dist-github` to GitHub Pages and keeps Supabase as the database/auth backend.

## Custom domain or user page

The workflow uses `GITHUB_PAGES_BASE_PATH: ./`, which works well for repository pages and hash routing. If you prefer an absolute base path, change it in `.github/workflows/deploy-pages.yml`:

- User site or custom domain: `/`
- Repository site: `/<repo-name>/`