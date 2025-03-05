# curio

## Local development
First, set up environment variables and secrets.
1. Copy `.env.template` to `.env` and populate values. Make sure to use the instructions [here](https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys) to generate the `ANON_KEY` and `SERVICE_ROLE_KEY`.
2. The `search` container's init script will create an application API key. Retrieve this value by using `curl`, then populate it for `SEARCH_APPLICATION_API_KEY` in `.env.`:
    ```bash
    curl -s -X GET "http://localhost:7700/keys" \
    -H "Authorization: Bearer ${SEARCH_MASTER_API_KEY}" \
    -H "Content-Type: application/json"
    ```
  - Secrets are also stored in the database. You might encounter an issue with initializing them on a fresh start - try to run a search before you add an item.
3. Set up a Posthog account and populate the environment variables `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.

To start the local development environment:
1. Run `docker compose up -d` to start containers in detached mode.
2. Start file syncing with `docker compose watch`.
3. Navigate to `http://localhost:3000` to view the application.

### Chrome extension
To develop locally using the Chrome extension, first make sure that the API hostname is correctly set in `src/chrome/background.js`, `src/chrome/content.js`, and `src/chrome/manifest.json`.

* For local development, this should be set to `http://localhost:3000/*`.
* For production, this should be set to `https://curi.ooo/*`.

The manifest should contain something like
```
    "content_scripts": [
        {
            "matches": [
                "http://localhost:3000/*"
            ],
            "js": [
                "content.js"
            ]
        },
    ],
```

Next, install the extension in development mode. In Chrome, open `chrome://extensions`. Click on "Load unpacked" and select the `src/chrome` directory.

Finally, update `NEXT_PUBLIC_CHROME_EXTENSION_ID` in `.env` based on the Chrome extension ID in the chrome://extensions page.

### Linting
To install the local eslint plugins, run
1. `cd src/web/eslint-local-rules`
2. `npm run build`

### Supabase dashboard
With the development environment running, navigate to `http://localhost:8000` to view the Supabase dashboard.

Use the `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` environment variables to sign in.

Saved Markdown content can be viewed here in the Supabase Storage page.

### Database shell
1. Run `docker exec -it db bash`.
2. Then, run `psql -U postgres`.

To clear the database, run
1. `docker compose down -v`
2. `rm -r docker/volumes/db/data`

## Deployment
1. Set up Supabase app.
2. Set up Vercel app.
  - Include the environment variables from the `web` service in `docker-compose.yml`.
  - For the `POSTGRES_URL` variable, use the "Transaction pooler" Supabase Postgres URL.
3. Copy the prod env variables locally with `vercel env pull .env.prod`.
4. Run database migrations against the production database using `DOTENV_CONFIG_PATH=/path/to/.env.prod npm run db:migrate`.
5. Set up a Google Cloud project with Google Auth Platform configured for a web application. Copy in the generated client ID and client secret into Supabase's Google auth provider, then copy the Supabase auth callback URL into the "Authorized redirect URIs" field.
6. Configure the "URL Configuration" site URL and redirect settings in Supabase Auth with the app URL.
  - Site URL should be `$HOSTNAME/auth/callback?next=%2Fhome`.
  - Redirect URLs should include `$HOSTNAME/*`.
7. Configure the Supabase storage settings.
  - Create a bucket `items`. Set it to be public with the allowed MIME type `text/markdown`.
  - Create a new policy on the `items` bucket from scratch. Title it "Allow read access for everyone", allow the `SELECT` operation for all roles, and keep the default policy definition `bucket_id = 'items'`.
8. Set up a Meilisearch instance on your cloud provider.
  - Use the dev environment: `docker exec -it dev zsh`.
  - Authenticate using `gcloud auth application-default login`.
  - Run `terraform plan` to verify the correct resources will be created, then run `terraform apply`.
  - Then run `script/deploy-volumes.sh [staging|prod]` to deploy a persistent volume to store the search index.
  - Then run `script/deploy.sh [staging|prod]` to deploy the search application.
