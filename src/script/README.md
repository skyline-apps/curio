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

```bash
$ npm run send-email -- --template <TEMPLATE_PATH> --subject <SUBJECT> --sender "curio@no-reply.curi.ooo" [--dry-run]
```
