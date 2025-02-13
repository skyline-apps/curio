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