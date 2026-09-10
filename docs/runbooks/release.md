# Release runbook

## First administrator

On an empty production database, set a temporary random `FIRST_USER_SETUP_SECRET` of at least 32 characters and the intended `FIRST_USER_SETUP_EMAIL`. Create that administrator with a `POST /api/users` request carrying the secret in `X-First-User-Setup`. The configured email and the database uniqueness constraint prevent parallel creation of additional administrators. Remove both setup values immediately after the account exists. The normal anonymous Payload setup flow is disabled in production.

## Provision once

1. Create separate staging and production Workers, D1 databases, R2 buckets, Email Service senders and Turnstile widgets. The deployment provisions the dedicated scheduler Workers and their Cron Triggers.
2. Put the real D1 UUIDs in `wrangler.jsonc`. Empty IDs are intentional release blockers, not placeholders to deploy.
3. Create GitHub Environments named `staging` and `production`. Require named reviewers on `production`.
4. Add every secret and variable listed in `.env.example` to each GitHub Environment and to the corresponding Worker's encrypted secrets or dashboard variables. Use different secret values and hostnames. Wrangler `keep_vars` prevents deploys from deleting values maintained in the dashboard.
5. Verify the deployed scheduler Workers invoke registration delivery, cleanup, calendar sync and Payload scheduled publishing. Delivery and cleanup run every five minutes, calendar sync hourly and Payload jobs every minute.
6. Route the health check and delivery failures to named maintainers, redact cancellation URLs from request logs and analytics, and demonstrate D1 backup restore.
7. The first deployment provisions `REGISTRATION_DELIVERY_KEY` only when the Worker has no existing key. Ordinary deployments never overwrite it.

### Delivery key rotation

Pause signup and Registration Delivery processing before rotating `REGISTRATION_DELIVERY_KEY`. Drain every delivery with an encrypted payload to `sent` or terminal `failed`, verify that no `registration_deliveries.encrypted_payload` values remain, update the Worker secret and matching GitHub Environment secret, then resume processing. Never rotate while retryable payloads exist; the old key is required to decrypt their Cancellation Tokens.

## Staging

1. Confirm the `Quality` workflow passed for the exact commit SHA.
2. Create a D1 backup and record the applied migrations.
3. A successful `Quality` run on `master` deploys that SHA to staging automatically. A manual dispatch remains available for recovery. Preflight runs before migration and fails on absent variables, invalid URLs, missing bindings, shared resource names or empty D1 IDs.
4. Run smoke tests for Dutch and English public pages, admin access, signup, email delivery, cancellation, Waitlist promotion and calendar synchronization.
5. Verify the three scheduled jobs, health monitoring, alerts and logs. Logs must not contain personal data.
6. Record product, privacy and maintainer acceptance plus the successful staging workflow run ID.

The deployment never seeds. For a genuinely empty remote database only, run `SEED_EMPTY_DATABASE=staging pnpm seed:staging` as a separate reviewed operation. It aborts if any Page or populated Site Settings exists. Do not use starter refresh remotely.

## Production

1. Manually run `Promote production` with the accepted staging run ID and exact commit SHA.
2. Approve the protected `production` Environment only after the workflow verifies successful staging evidence and matching revision.
3. Create and verify a production D1 backup before approving migration execution.
4. The workflow runs production preflight, applies forward migrations, optimizes D1, deploys the exact OpenNext bundle accepted in staging and synchronizes the validated runtime values. It does not rebuild or seed.
5. Verify `GET /api/health` returns `{"status":"ok"}` and complete one controlled registration/cancellation test with an approved address.
6. Monitor errors, delivery failures and latency through the release window.

## Rollback

1. Stop deployments and background processors if data integrity is at risk.
2. Roll application code back only to a release compatible with the applied schema.
3. Never run `payload migrate:down` during an incident. Committed down migrations contain destructive table drops.
4. Restore D1 only after preserving the failed state and receiving owner approval.
5. Reconcile Registration Delivery records before resuming delivery processing.
6. Record timeline, impact, resolution and follow-up actions.

## Migration safety

Forward migrations never seed or refresh editorial content. The fresh-database CI gate proves the complete `up` chain; staging must additionally test that chain against a recent production-like backup before approval. Down migrations are not an incident rollback mechanism.
