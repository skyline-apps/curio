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

To start the local development environment:
1. Run `docker compose up -d` to start containers in detached mode.
2. Start file syncing with `docker compose watch`.
3. Navigate to `http://localhost:3000` to view the application.

### Browser extensions
The Chrome extension is at `src/chrome`, and the Firefox extension is at `src/firefox`.
To develop locally using the extensions, first make sure that the API hostname values are correctly set in all the files of the extension.

* For local development, this should be set to `http://localhost:3000/*`.
* For production, this should be set to `https://curi.ooo/*`.
* For Firefox local development, you may have to set `content_scripts.matches` to be `<all_urls>`.

Next, install the extension in development mode.
In Chrome, open `chrome://extensions`. Click on "Load unpacked" and select the `src/chrome` directory.
In Firefox, open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and upload the `manifest.json` from the unpacked folder.

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
### Web app
1. Set up Supabase app.
2. Set up Vercel app.
  - Include the environment variables from the `web` service in `docker-compose.yml`.
  - For the `POSTGRES_URL` variable, use the "Transaction pooler" Supabase Postgres URL.
  - Also include `SEARCH_MASTER_API_KEY` (at least 16 bytes) and `SEARCH_APPLICATION_API_KEY` (a UUID v4).
3. Set up a Posthog account and populate the environment variables `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.
4. Copy the prod env variables locally with `vercel env pull .env.prod`.
5. Run database migrations against the production database using `DOTENV_CONFIG_PATH=/path/to/.env.prod npm run db:migrate`.
6. Set up a Google Cloud project with Google Auth Platform configured for a web application. Copy in the generated client ID and client secret into Supabase's Google auth provider, then copy the Supabase auth callback URL into the "Authorized redirect URIs" field.
7. Configure the "URL Configuration" site URL and redirect settings in Supabase Auth with the app URL.
  - Site URL should be `$HOSTNAME/auth/callback?next=%2Fhome`.
  - Redirect URLs should include `$HOSTNAME/*`.
8. Configure the Supabase storage settings.
  - Create a bucket `items`. Set it to be public with the allowed MIME type `text/markdown`.
  - Create a new policy on the `items` bucket from scratch. Title it "Allow read access for everyone", allow the `SELECT` operation for all roles, and keep the default policy definition `bucket_id = 'items'`.
  - Create a new policy on the `items` bucket. Title it "Allow authenticated to upload", allow the `INSERT` and `UPDATE` operations for the `authenticated` role, and keep the default policy definition.
9. Set up a Meilisearch instance on your cloud provider.
  - Use the dev environment: `docker exec -it dev zsh`.
  - Authenticate using `gcloud auth application-default login`.
  - Run `terraform plan` to verify the correct resources will be created, then run `terraform apply`.
  - Create an A (Address) DNS record for `terraform output`'s `gke.ip_address` under the subdomain of `SEARCH_EXTERNAL_ENDPOINT_URL`.
  - Set up `cert-manager` on the cluster using `script/deploy-certs.sh`.
  - Then run `script/deploy-volumes.sh [staging|prod]` to deploy a persistent volume to store the search index.
  - Then run `script/deploy.sh [staging|prod]` to deploy the search application.
  - It may take a while for the certificate to be issued. You can check the status of the `gateway`, `certificate`,  and `challenge` resources as well as logs of the `cert-manager` pod to check progress.
  - Run `/data/search/init.sh [staging|prod]` to initialize the search application.
  - Populate the `SEARCH_APPLICATION_API_KEY` after using the master API key to retrieve its value.
10. Publish the browser extensions and update the values in `src/web/lib/config.json`.