---
trigger: always_on
---

Please follow existing conventions whenever they are found in the codebase.
This means you should, whenever you're unsure of how to make a change, check the structure of an existing file and pattern match to follow its idioms rather than insert code blindly.

1. My source code is in src/, with folders for each specific app:
  - src/app is the SPA web application. It's run using Vite, with the API defined under `src/app/api` and run with Cloudflare workers.
  - src/chrome is the Chrome extension
  - src/firefox is the Firefox extension
  - src/infra is the Terraform and Kubernetes configuration
2. For the web app:
  - I'm using 'react-router-dom', Tailwind, Drizzle ORM, and Vitest.
  - The API is in src/app/api. Each API endpoint comes with an index.ts and index.test.ts. The main routes are in src/app/api/routesV1. Request and response schemas are defined in src/app/schemas.
  - The frontend components are in src/app/components. They use HeroUI under the hood but are all abstracted into reusable components under src/app/components/ui.
  - Components are often structured as src/app/components/ComponentName/index.tsx but may also be src/app/components/ComponentName/Component.tsx.
  - Interacting with data uses @tanstack/react-query, with its QueryClient and useMutation hook.
  - Tests are run with the `vitest.setup.api.ts` and `vitest.setup.jsdom.tsx` depending on whether they test the API or the frontend (see `vitest.config.mts`).
3. The database schema is described in src/app/api/db/schema.ts and is managed with Drizzle. Queries in the app use the Drizzle ORM with Postgres.
4. The mobile apps are generated from the web app in src/app using Capacitor. You can detect if the user is in a mobile app or not using `import { isNativePlatform } from @app/utils/platform`.
5. Browser extensions are in src/chrome and src/firefox and both have the same functionality.
6. Never use the `any` type or `require`.
7. Pretty much all actions for the app should be run from the `src/app` folder (see `src/app/package.json`).