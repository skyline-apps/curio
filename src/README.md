# Curio development

## Set up local development
First, set up environment variables and secrets.
1. Copy `.env.template` to `.env` and populate values. Make sure to use the instructions [here](https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys) to generate the `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
2. The `search` container's init script will create an application API key. Retrieve this value by using `curl`, then populate it for `SEARCH_APPLICATION_API_KEY` in `.env`:
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

### Database migrations
Create a new database migration by first editing `src/app/api/db/schema.ts`. Then from the `src/app` folder, run `npm run db:generate <MIGRATION_NAME>` and check in the generated files.

Run the migration against your local development database by running `docker exec -it curio bash` and then `npm run db:migrate`.

### Mobile apps
First, make sure you build the frontend with the production `.env` populated by running `npm run build` from `src/app`. Then run `npx cap sync` to set up mobile app files.

```bash
$ npx cap run android
$ npx cap run ios
```

Follow [these instructions](https://capacitorjs.com/docs/guides/deep-links) to set up app deep links.

To run the app against staging:
1. Change the `.env` values to use staging values.
2. Edit `AndroidManifest.xml`'s `android:host` to `staging.curi.ooo`.
3. Edit `src/app/ios/App/send-to-curio/Info.plist`'s `CURIO_URL` to `https://staging.curi.ooo`.
4. Edit `src/app/ios/App/App/Info.plist`'s `CURIO_URL` to `https://staging.curi.ooo`.

### Payments
To configure payments, make sure the `VITE_REVENUECAT_API_KEY` and the related iOS and Android keys are set.

Then, configure a RevenueCat webhook endpoint for `https://<HOST>/api/v1/public/subscriptions/revenuecat`.
The `Authorization` header should be set to `Bearer <CURIO_APP_SECRET>`.


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
1. `cd src/app/api/eslint-local-rules`
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

### Job workers
Locally, the main worker can push messages to queues, but the separate consumer workers aren't run.

Instead, to run logic for a specific consumer queue locally, set it as the `queue` export in `src/app/api/index.ts`. Then, ensure that the `consumers` are set in `src/app/wrangler.jsonc`

## Instructions for hosting
### Web app
1. Set up Supabase app. We use their database, storage, and auth services.
2. Set up a Posthog account and populate the environment variables `POSTHOG_KEY` and `POSTHOG_HOST`.
3. Set up Cloudflare account. The application will be deployed to their Workers & Pages service.
  - Only the variables in the first section of the `.env.template` are needed. Populate them in `.env.staging` and `.env.prod` and in the project settings per environment.
  - For the `POSTGRES_URL` variable, make sure to use the "Transaction pooler" Supabase Postgres URL.
  - Also generate a `SEARCH_MASTER_API_KEY` (at least 16 bytes) and `SEARCH_APPLICATION_API_KEY` (a UUID v4).
  - When setting up the domain in Cloudflare, make sure to use "Full (strict)" mode for SSL/TLS encryption.
4. Run database migrations against the production database using `DOTENV_CONFIG_PATH=/path/to/.env.prod npm run db:migrate`. This is also set up to run automatically with the GitHub Actions build process.
5. Configure the Supabase storage settings.
  - Create a bucket `items`. Set it to be public with the allowed MIME type `text/markdown`.
  - Also create an `imports` bucket. It should stay private.
  - Create a new policy on the `items` bucket from scratch. Title it "Allow read access for everyone", allow the `SELECT` operation for all roles, and keep the default policy definition `bucket_id = 'items'`.
  - Create a new policy on the `items` bucket. Title it "Allow authenticated to upload", allow the `INSERT` and `UPDATE` operations for the `authenticated` role, and keep the default policy definition.
6. Populate the environment variables and secrets in GitHub so that the Actions build pipeline can deploy.
7. Populate the environment variables and secrets in the deployed Cloudflare workers.
8. From `src/app`, run `npx wrangler queues create <QUEUE>` to create message queues.
  - `items-fetcher-staging`
  - `items-fetcher-prod`

### Cloud services
1. Set up an AWS account, along with an IAM user with programmatic access.
2. Provision cloud resources on AWS.
  - Use the dev environment: `docker exec -it dev zsh`.
  - Authenticate using `gcloud auth application-default login`.
  - Authenticate using `aws configure`.
  - Populate `src/infra/terraform.tfvars` based on `src/infra/terraform.tfvars.sample`.
  - Run `terraform apply`
3. Set up the email newsletter service on AWS.
  - From `terraform output`, create the listed records (should be 3 CNAME, 2 MX, and 4 TXT) on your DNS provider. Note the 10 on the MX record is for priority.
4. Set up Meilisearch deployments on Railway for staging and prod.
  - TODO: Use the terraform provider when it's more mature.
  - Create a project called `search` and environments called `staging` and `production`.
  - Add a new service to staging called `search` using the image `getmeili/meilisearch:v1.12`.
  - Under the service variables, set `MEILI_MASTER_KEY` to be `.env.staging`'s `SEARCH_MASTER_API_KEY`.
  - Under the service variables, set `MEILI_ENV` to be `production`.
  - Under the service variables, set `MEILI_MAX_INDEXING_MEMORY` to be `2000Mb` (assuming you're on the paid plan and the max service memory is 8 GB).
  - Right-click and attach a new volume to the service at the mount path `/meili_data`.
  - Add a custom domain that points to the search endpoint (e.g. `search-staging.curi.ooo`) at port 7700.
  - Run `/data/search/init.sh [staging|prod]` to initialize the search application.
  - To bootstrap the search instance with a dump from a previous instance:
    - Upload the search dump to Supabase public object storage and grab its URL.
    - Under the service variables, set `MEILI_IMPORT_DUMP` to be `/meili_data/import.dump`.
    - Add a custom start command to download the dump from Supabase public object storage and place it in `/meili_data/import.dump`: `curl https://<SUPABASE_PROJECT>.supabase.co/storage/v1/object/public/dumps//<DUMP_NAME>.dump --output /meili_data/import.dump`
    - Deploy the service. After it succeeds, remove the custom start command and redeploy to load the dump from the downloaded path.
    - After that succeeds, remove the `MEILI_IMPORT_DUMP` variable and redeploy.

### Extensions
1. Publish the browser extensions and update the values in `src/app/utils/config.json`.

### Android app
1. Ensure the `versionCode` and `versionName` are updated in `src/app/android/app/build.gradle`.
2. Open the application in Android Studio by running `npx cap open android` from `src/app`.
3. Build a signed APK using the Build > Generate Signed App Bundle option.
4. Select "Android App Bundle" and follow the instructions. You should build a `release` app in the `src/app/android/app` folder.
5. Follow the [launch checklist](https://play.google.com/console/about/guides/releasewithconfidence/) and upload the app bundle to the Play Console.
6. In the Google Auth Platform Cloud Console, create a new app of type "Android", populating its package name from the `src/app/android/app/build.gradle` file and the SHA-1 fingerprint from the debug keystore by running `keytool -keystore ~/.android/debug.keystore -list -v` (see [here](https://support.google.com/cloud/answer/15549257?visit_id=638947171547368371-732663243&rd=1#installedapplications&android&zippy=%2Cnative-applications-android-ios-desktop-uwp-chrome-extensions-tv-and-limited-input%2Candroid)).
7. In the Google Play Console, navigate to "Test and release" > "App integrity" > "App signing" and copy the SHA-1 fingerprint.
8. In the Google Auth Platform Cloud Console, create a new app of type "Android", populating its package name from the `src/app/android/app/build.gradle` file and the SHA-1 fingerprint from the step above.

### iOS app
1. Follow instructions [here](https://github.com/Cap-go/capacitor-social-login/blob/main/docs/setup_apple.md) to set up Apple sign in.
2. For each Supabase auth deployment, enable Apple sign-in with the client ID from `PRODUCT_BUNDLE_IDENTIFIER` in `src/app/ios/App/App.xcodeproj/project.pbxproj`.
3. Follow [these instructions](https://github.com/carsten-klaffke/send-intent?tab=readme-ov-file#ios) to allow the app to handle share intents.

### Authentication
1. Set up a Google Cloud project with Google Auth Platform configured for a web application. Copy in the generated client ID and client secret into Supabase's Google auth provider, then copy the Supabase auth callback URL into the "Auhorized redirect URIs" field.
  * For iOS, also create a new iOS app in the Google Auth Platform Cloud Console configuration and include its client ID after the web client ID in the Supabase Google auth provider (separated by a comma).
  * Set both client IDs as `VITE_GOOGLE_WEB_CLIENT_ID` and `VITE_GOOGLE_IOS_CLIENT_ID`.
  * Navigate to "Auth Platform" > "Audience" and make sure to publish the app.
2. Configure the "URL Configuration" site URL and redirect settings in Supabase Auth with the app URL.
  - Site URL should be `$HOSTNAME`.
  - Redirect URLs should include `$HOSTNAME/*`.
3. For email authentication in local development, populate these variables in `.env` and view emails at `http://localhost:9000`.
```
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=admin
SMTP_PASS=password
SMTP_SENDER_EMAIL=admin@example.com
SMTP_SENDER_NAME=Curio
```
4. For email authentication in production, set up a production SMTP server.
  - Set up DNS records for the email sending domain. Populate the values from `terraform output` (should be 3 CNAME, 2 MX, and 4 TXT records).
  - Verify the sending email address by uncommenting `src/infra/aws/email_verification_forward.tf` and running `terraform apply`.
    - You'll have to create a new MX and TXT DNS record to allow receiving email at this domain.
    - You'll need to go to the AWS console > SES > Configuration: Identities > `auth@no-reply.curi.ooo` and send the verification email.
  - Populate the SMTP settings in Supabase. Use the AWS SMTP information in `terraform output`.
    - Generate STMP credentials using `src/infra/script/generate_smtp_password.py`.
  - Populate the email templates in Supabase using `src/email/templates`.
  - Make sure to change the default sending email rate limit :)