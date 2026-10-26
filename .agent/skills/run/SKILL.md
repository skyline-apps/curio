---
name: run
description: Launch and drive the Curio app locally with Playwright and screenshots. Project override for the built-in run skill — read this first.
---

# Running Curio locally

Curio runs as Docker containers prefixed with `curio-` (e.g., `curio-app`, `curio-db` in the primary checkout; `curio-1046-fix-thing-app` in a worktree) to avoid container collisions.

- Verify active containers:
  ```bash
  docker ps --format '{{.Names}}'
  ```
- Services: `app` (Vite/Cloudflare Worker), `db` (Postgres), `search` (Meilisearch), and Supabase (`supabase-kong`, `supabase-auth`, `supabase-rest`, `supabase-meta`, `supabase-mail`, etc.).

## 1. Start the stack

From the repository root (or worktree root):
```bash
npm run dev:watch
# or for a one-time startup:
npm run dev:up
```

Run `dev:watch` in the background — it stays attached to sync file changes and does not exit on its own.
What it does:
1. Fills `.env` placeholder secrets (`JWT_SECRET`, `POSTGRES_PASSWORD`, Supabase keys, etc.).
2. Namespaces containers: sets `DEV_OWNER`/`COMPOSE_PROJECT_NAME` to your OS username and worktree name.
3. Allocates ports: assigns a unique port offset if running in a linked worktree, persisting it across runs.
4. Syncs environment: copies root `.env` to `src/app/.env` and `src/app/.dev.vars`.
5. Restarts services: runs `docker compose down` then `docker compose up -d`.
6. Seeds database: runs migrations and seeds default test user (`testuser@curi.ooo`).
7. Watches for changes: runs `docker compose watch --no-up` in the foreground.

## 2. Retrieve ports and URLs from environment

Do not assume default ports (e.g. 3000, 8000). Ports are dynamically assigned in worktrees.
- Single source of truth: `src/app/.env`.
- Retrieve values:
  ```bash
  grep -E "^(VITE_CURIO_URL|VITE_SUPABASE_URL|TEST_USER_EMAIL|TEST_USER_PASSWORD)=" src/app/.env
  ```
  - `VITE_CURIO_URL` (e.g. `http://localhost:3000` or `http://localhost:3100`) - URL for app and Playwright tests.
  - `VITE_SUPABASE_URL` - Supabase base URL (Kong).
- Verify app is running:
  ```bash
  curl -sf "$(grep '^VITE_CURIO_URL=' src/app/.env | cut -d= -f2- | tr -d '"')" >/dev/null && echo ok
  ```

## 3. Authenticate in the app

A pre-confirmed test user is seeded automatically on `dev:up` via `db:seed` (using `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` from `.env`).

**Use `scripts/agentLogin.ts` instead of scripting login by hand.** From `src/app`:
```bash
npm run auth:login
# or:
npx tsx --tsconfig tsconfig.api.json scripts/agentLogin.ts
```
This logs in once and writes a Playwright `storageState` file to `src/app/.playwright/auth-state.json`.

Every other Playwright script you write can open an already-authenticated context directly:
```ts
import { chromium } from "playwright";
import { AUTH_STATE_PATH } from "./scripts/agentLogin";

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
const page = await context.newPage();
await page.goto(process.env.VITE_CURIO_URL || "http://localhost:3000"); // lands already signed in
```

## 4. Capturing Screenshots

To quickly take screenshots of any route during QA:
```bash
# From src/app:
npm run screenshot -- --path /home --output screenshots/home.png
npm run screenshot -- --path /settings --output screenshots/settings.png
```

Or write custom Playwright scripts:
```ts
import { chromium } from "playwright";
import { AUTH_STATE_PATH } from "./scripts/agentLogin";

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
const page = await context.newPage();
await page.goto(`${process.env.VITE_CURIO_URL}/home`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: "screenshots/home.png", fullPage: true });
await browser.close();
```

PRs that impact the frontend must have screenshots captured during QA and attached to the PR description (using `github-screenshot-upload`).
