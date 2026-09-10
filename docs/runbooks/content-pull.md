# Content pull runbook

Editors work in the deployed admin, so the starter content in this repository
drifts away from what the website actually shows. `pnpm pull:staging` and
`pnpm pull:prod` close that gap: they copy a deployed environment into local
development and regenerate the starter content from it.

```bash
pnpm pull:staging
pnpm pull:prod
```

The remote database and bucket are only ever read. The environment is required,
so a production pull is always deliberate.

## What it does

1. Exports the remote D1 database twice, once for its schema and once for its
   rows, because a single export interleaves inserts with the tables they
   reference and a local database rejects that order.
2. Rebuilds the local database in a temporary directory, verifies it contains
   pages, and only then installs it into `.wrangler/state`. The database it
   replaces is written to `.wrangler/backups` as both a SQL dump and a copy of
   the replaced files.
3. Copies every media file from the environment's R2 bucket into the local
   bucket, so images resolve while running `pnpm dev`.
4. Regenerates `src/seed/starter` from the local database and copies the media
   the starter content needs into `public/photos`.

Stop `pnpm dev` first. The local database files are replaced while it runs.

The pull is a full clone: staging registrations and administrator accounts land
in the local database, so local admin sign-in uses the credentials of the
environment that was pulled.

## Generated starter content

`src/seed/starter` is machine-written and should not be edited by hand. It
holds one module per page, the media metadata, and the Site Settings for both
locales. Uploads and internal page links are stored as `media['file.jpg']` and
`pages['over-ons']` lookups rather than identifiers, so `pnpm seed:local`
resolves them against whichever database it is seeding.

`applyStarterContent` in `src/seed/starterContent.ts` writes that content out. It
creates every page as an empty draft first and fills in the layouts afterwards,
so pages can link to each other in any direction.

The hand-written layouts in `src/seed/home.ts`, `about.ts`, `legal.ts` and
`homeMedia.ts` are kept because past migrations import them. They are frozen
history and are no longer used for seeding.

## Baseline pages

A few Pages are part of the website's structure rather than editorial work, so
a fresh database must have them even before a pull has captured the published
version. `baselinePages` in `src/seed/starterContent.ts` lists them, currently
only the calendar page in `src/seed/calendarPage.ts`. They are hand-written and
therefore survive a pull. A generated page claiming the same slug in either
locale always wins, so once the page has been published and pulled the baseline
stops applying and editors keep control of it.

## After a pull

1. Review the diff. A large diff in `src/seed/starter` is normal after
   editorial work.
2. Commit the new files in `public/photos` together with the generated modules;
   the seed uploads those binaries into an empty database.
3. Run `pnpm check`, and `pnpm generate:types` if the remote schema changed.
4. Verify a fresh seed still works when the generated content changed
   substantially, by migrating and seeding a throwaway database:

```bash
STATE=$(mktemp -d)
CLOUDFLARE_PERSIST_PATH=$STATE pnpm exec payload migrate
CLOUDFLARE_PERSIST_PATH=$STATE pnpm seed:local
```

## Flags

- `--skip-db` regenerates the starter content from the current local database.
- `--skip-media` leaves R2 and `public/photos` untouched.
- `--skip-seed` pulls the database and media without regenerating.
- `--keep-dump` keeps the SQL export and downloaded media for inspection.
