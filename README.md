# Ichtus Leuven

Bilingual website and CMS for Ichtus Leuven, built with Next.js 16, Payload 3, Cloudflare Workers, D1 and R2.

## What is included

- Dutch and English page content with localized slugs and SEO fields
- Fourteen curated Page Patterns with focused content contracts and controlled variants
- Drafts, autosave, scheduled publishing and live preview
- Structured activities with manual editing or protected Google Calendar sync
- An interactive month and list calendar of every published activity, at `/nl/kalender` and `/en/calendar`
- Native activity registration, capacity, automatic waitlists, cancellation and CSV export
- Admin, content-editor and registration-manager roles
- Global navigation, footer, contact links, social links and calendar settings
- R2 media storage, sitemap, robots rules and responsive frontend

## Local development

Requirements: Node.js 20 or newer and pnpm 9 or newer.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Create the editable Dutch and English starter content once with `pnpm seed:local`, then run `pnpm dev`. Open `http://localhost:3000` and `/admin`. The seed becomes a no-op when any Page or populated Site Settings exists. `CLOUDFLARE_REMOTE=false REFRESH_STARTER_CONTENT=overwrite-local-editorial-content pnpm exec tsx src/scripts/refreshStarterContent.ts` intentionally overwrites starter layouts and is forbidden with remote bindings.

Editors change the deployed site, so the starter content in this repository drifts. `pnpm pull:staging` (or `pnpm pull:prod`) copies that environment's database and media into local development and regenerates `src/seed/starter`, which is what `pnpm seed:local` then reproduces. Stop `pnpm dev` first; the replaced local database is backed up to `.wrangler/backups`. See `docs/runbooks/content-pull.md`.

Internet Friends and Instrument Sans are bundled locally. See `public/fonts/README.md` for their sources and licensing notes.

## Content model

Collections:

- `Pages`: localized title, slug, blocks and SEO, including drafts and versions
- `Events`: localized event content, dates, type, accent, synchronization metadata and where “more info” leads: an own page with a localized slug, an external page, or nowhere
- `Registrations`: private attendee records, status and cancellation metadata
- `Registration Deliveries`: private, durable and retryable transactional email intents
- `Short Links`: codes served at the domain root that forward visitors to a page, an activity or an external URL through a confirmation screen, with a QR code and a click counter
- `Short Link Clicks`: one row per followed short link, with referrer and country, pruned after twelve months
- `Media`: localized alt text and captions, stored in R2
- `Users`: Payload administrators, content editors and registration managers

Global:

- `Website-instellingen`: navigation, footer, contact channels, calendar, Instagram and default SEO

Page Patterns:

- Hero
- Values bar
- Text/content section
- Poster
- Events list
- Calendar
- Color statement
- Quote
- Call to action
- Media grid
- Network links
- Photo story
- Practical information cards
- FAQ

Every Page Pattern can be added, removed, duplicated and reordered. Its limited `Vormgeving` group controls approved background, spacing, width and navigation-anchor variants. See `docs/editorial-guide.md`.

## Activity registration

An activity can use no registration, an external registration URL, or the native signup flow. Native registration supports optional capacity, automatic waitlisting, signup windows and localized closed messages. Attendees enter only their name and email address. They receive a secure cancellation link; cancellation automatically promotes the oldest person on the waitlist.

Registration records are never publicly available through REST or GraphQL. Admins and registration managers can filter them in Payload and export an event-specific CSV from the activity edit screen. Personal details are anonymized twelve months after the event.

### Cloudflare Email Service

The native flow sends bilingual transactional mail through Cloudflare Email Service. Workers Paid includes 3,000 outbound messages per month. The domain must use Cloudflare DNS and be onboarded under **Compute > Email Service > Email Sending**. The Worker binding is configured as `EMAIL` in `wrangler.jsonc`.

Configure these Worker variables:

```env
EMAIL_FROM_ADDRESS=hello@your-domain.example
EMAIL_FROM_NAME=Ichtus Leuven
EMAIL_REPLY_TO=leuven@ichtus.be
REGISTRATION_DELIVERY_KEY=
REGISTRATION_DELIVERY_SECRET=
```

### Abuse protection and retention

Create a Turnstile widget for the production hostname and configure:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
REGISTRATION_CLEANUP_SECRET=
```

Turnstile is mandatory in production and intentionally bypassed in local development when no key is configured. The dedicated scheduler Worker calls `/api/registration-delivery-process` and `/api/registration-cleanup` every five minutes; the cleanup endpoint drains bounded batches for up to 20 seconds, reports `timedOut` when it exhausts that budget and reports `needsContinuation` when timed-out or deferred work needs a future run. Also configure a Cloudflare rate-limiting rule for `/api/activity-signup`.

## Analytics

Traffic is measured with a self-hosted [OpenPanel](https://openpanel.dev) instance, which serves both the tracker script and the endpoint it reports to. Configure the project from its OpenPanel settings:

```env
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=
NEXT_PUBLIC_OPENPANEL_API_URL=https://analytics.zias.be/api
OPENPANEL_CLIENT_SECRET=
```

The OpenPanel client rejects browser events from origins outside its CORS allow list with `Ingestion: Invalid cors or secret`, so add the deployed hostnames to the client in the OpenPanel dashboard. Only the two public values are required; the client secret exists for server-side events, which the site does not send today.

Analytics are configured in the production environment only. Nothing is required for a deploy: leaving the client id unset disables the tracker entirely, which is why staging, local development and the test suites never report. The analytics origin is a constant in the Content-Security-Policy rather than a build-time read, because production deploys the bundle the staging workflow built; allowing the origin tracks nobody by itself. Point that constant and `NEXT_PUBLIC_OPENPANEL_API_URL` at the same instance.

Tracking is cookieless, records screen views only, and drops any event whose path is an editor preview or a registration cancellation link, because those paths carry a secret cancellation token.

## Google Calendar

Create a Google API key with read access to the selected public calendar, then configure:

```env
GOOGLE_CALENDAR_ID=
GOOGLE_CALENDAR_API_KEY=
CALENDAR_SYNC_SECRET=
```

Trigger a sync with:

```bash
curl -X POST https://your-domain.example/api/calendar/sync \
  -H "Authorization: Bearer $CALENDAR_SYNC_SECRET"
```

The dedicated scheduler Worker makes that request hourly. Imported events are marked as Google-sourced; event titles determine the initial event type and accent, while Dutch content falls back in the English locale until translated in Payload.

## Cloudflare release

Payload's D1 adapter is currently beta. Payload also requires a paid Workers plan because the Worker bundle exceeds the free-plan size limit.

Cloudflare remains the concrete deployment adapter. Staging and production use separate Workers, D1 databases, R2 buckets, secrets, senders, Turnstile widgets and schedules.

1. Provision the isolated resources referenced by `wrangler.jsonc` and verify their IDs before release.
2. Configure GitHub Environments `staging` and `production` from `.env.example`, with required reviewers on production.
3. Generate a migration with `pnpm exec payload migrate:create` after schema changes and verify it with `PAYLOAD_SECRET=local-migration-test-secret-32-chars pnpm exec tsx src/scripts/testFreshMigrations.ts`.
4. Push to `master`. A successful `Quality` workflow automatically deploys its exact SHA to staging. Complete acceptance, then run `Promote production` with the staging run ID and SHA.

Deployments apply migrations and deploy the Worker but never seed. See `docs/runbooks/release.md` for backup, acceptance, promotion and rollback steps. A remote empty database can be seeded only as a separate confirmed operation; the command aborts if Pages or Site Settings are populated.

Release preflight validates the selected environment. Deployment applies migrations, deploys the staged artifact, synchronizes the validated Worker secrets and deploys the scheduler.

## Quality checks

`pnpm check` runs Biome (lint and formatting), `tsc --noEmit` and the integration tests. Biome is the only linter and formatter; run `pnpm exec biome check --write .` to apply its fixes. The remaining gates are wired into the `Quality` workflow and can be run directly when needed:

```bash
pnpm check
pnpm exec payload generate:types
pnpm exec tsx src/scripts/testFreshMigrations.ts
pnpm exec playwright test --config=playwright.config.ts
pnpm exec next build --webpack
pnpm exec opennextjs-cloudflare build
pnpm audit --prod
```

Cloudflare Workers does not support Payload's `sharp` image transforms. Crop controls and generated image sizes are intentionally disabled; upload appropriately sized web images.
