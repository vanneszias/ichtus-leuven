# ADR 0005: Staged releases

Status: Accepted

## Context

The site handles private attendee data and depends on D1 migrations, R2, email, Turnstile and calendar synchronization. A direct production-only release cannot verify these bindings safely.

## Decision

Every release is deployed to isolated staging first. CI verifies generated code, lint, integration tests, browser tests, production build and OpenNext build. Staging acceptance verifies migrations, bindings, signup delivery, cancellation, calendar synchronization, monitoring and rollback before production approval.

## Consequences

- Production deployment is an explicit approval action.
- The release artifact and migration set promoted to production match staging.
- Emergency rollback follows the documented runbook rather than an ad hoc redeploy.
