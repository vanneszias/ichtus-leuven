# ADR 0001: Cloudflare application platform

Status: Accepted

## Context

The application combines Next.js, Payload CMS, private registrations, media and scheduled integrations. Existing implementation targets OpenNext on Cloudflare Workers with D1, R2 and Email Service.

## Decision

Keep Cloudflare as the production platform. OpenNext runs the application, D1 stores CMS and registration data, R2 stores media, Email Service sends transactional mail, and Cloudflare-managed scheduling or Queues runs background work.

Staging and production use separate Workers, D1 databases, R2 buckets, secrets and sender configuration.

## Consequences

- D1 adapter behavior and migration compatibility require release tests.
- Worker execution limits require bounded background batches.
- Platform bindings are validated before deployment.
- Backup and restore procedures are a launch requirement.
- Locale detection remains Edge middleware while OpenNext Cloudflare lacks support for Next.js Node proxy handlers; migrate when the adapter adds support.
