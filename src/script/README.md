## Importing from Omnivore

Run the script `importOmnivore.ts` with your Curio API key:

```bash
$ API_KEY=xxxxx npm run import:omnivore -- <OMNIVORE_EXPORT_FILE>.zip
```

You may optionally want to set the `API_HOSTNAME` and `BYPASS` (for Vercel deployment protection bypass) environment variables.

## Backfilling the search index

```bash
$ DOTENV_CONFIG_PATH=/path/to/.env npm run index:backfill -- [--items|--highlights] --input-file <INPUT_FILE_PATH>
```
