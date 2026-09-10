# Production readiness

No release may proceed while a required item is unresolved.

## Ownership

| Responsibility                        | Required owner                     | Current status |
| ------------------------------------- | ---------------------------------- | -------------- |
| Product and content approval          | Ichtus Leuven board representative | Unassigned     |
| Privacy, photography and retention    | Privacy owner                      | Unassigned     |
| Application incidents and deployments | Primary maintainer                 | Unassigned     |
| Backup and recovery                   | Secondary maintainer               | Unassigned     |
| Registration and email operations     | Registration manager               | Unassigned     |

## Automated gates

- [x] CI checks generated-file cleanliness, lint, TypeScript, integration tests, browser tests, Next production build and OpenNext build.
- [x] CI has an isolated fresh-database migration command.
- [x] Remote deploys do not seed or refresh editorial content.
- [x] Staging and production have explicit, distinct Wrangler environment definitions.
- [x] Production promotion requires successful staging evidence, the same commit SHA and GitHub Environment approval.
- [x] Deployment applies only preflight-validated runtime values and preserves the Registration Delivery encryption key across releases.
- [x] Real staging and production D1 UUIDs replace the intentionally empty release blockers in `wrangler.jsonc`.
- [x] Migration `20260827_132835_remove_ai_design_patterns` changes schema only and never refreshes populated Page layouts.
- [ ] All staging and production configuration passes `CLOUDFLARE_REMOTE=true pnpm exec tsx src/scripts/preflight.ts --env=<environment>`.
- [x] Next and OpenNext builds use the same absolute persisted D1 location as migration and seed preparation in CI.

## Operational gates

- [ ] Named owners and production approvers are recorded.
- [ ] Photography publication consent and deletion procedure are approved.
- [ ] Privacy notice, retention period and lawful basis are approved.
- [x] Internet Friends production usage rights were confirmed by the project owner on 2026-09-04.
- [ ] Staging and production D1, R2, secrets, Email Service and Turnstile resources are demonstrably isolated.
- [ ] The migration chain is tested against a copy of existing data, not only an empty database.
- [ ] Registration delivery retry and alerting are exercised.
- [ ] Resolve the Cloudflare Email Service crash window: deterministic `Message-ID` values aid correlation, but the provider does not guarantee deduplication after acceptance and before D1 records `sent`.
- [ ] Calendar synchronization failure and recovery are exercised.
- [ ] Rate limiting and Turnstile are enabled on production signup.
- [ ] D1 backup and restore are demonstrated.
- [ ] Security headers, accessibility checks and performance budgets pass.
- [ ] Monitoring and all three scheduled jobs route failures to named maintainers.
- [ ] Rollback is rehearsed from staging.
- [ ] Dutch and English content are approved.

## External values still required

- Cloudflare account ID and scoped deployment API token.
- Staging and production D1 UUIDs, R2 buckets and paid Worker plan.
- Staging and production hostnames and `NEXT_PUBLIC_SITE_URL` values.
- Environment-specific Payload, registration, calendar and Turnstile secrets.
- Email sender/reply-to values and completed Cloudflare Email Service onboarding.
- Delivery, cleanup and calendar schedule declarations plus actual authenticated scheduler jobs.
- Monitoring health-check URL, alert destination and maintainer contacts (post-launch hardening).
- GitHub `staging` and protected `production` Environments plus matching Worker secrets/variables with all values from `.env.example`.
