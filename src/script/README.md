## Importing from Omnivore

Run the script `importOmnivore.ts` with your Curio API key:

```bash
$ API_KEY=xxxxx npm run import:omnivore -- <OMNIVORE_EXPORT_FILE>.zip
```

You may optionally want to set the `API_HOSTNAME` environment variable.

```bash
$ DOTENV_CONFIG_PATH=/path/to/.env npm run index:backfill -- [--items|--highlights] --input-file <INPUT_FILE_PATH>
```

## Sending emails

Ensure that an unsubscribe link is included in the email template via `https://curi.ooo/unsubscribe/{{profileId}}`. The `{{profileId}}` placeholder will be replaced with the user's profile ID when you run the script.

```bash
$ DOTENV_CONFIG_PATH=/path/to/.env npm run send-email -- --template <TEMPLATE_PATH> --subject <SUBJECT> --sender "curio@no-reply.curi.ooo" [--dry-run]
```
