# ADR 0002: Durable registration delivery

Status: Accepted

## Context

Signup currently commits a Registration before sending email. Delivery failure is recorded but signup still reports success, while the only plaintext cancellation token is lost.

## Decision

Registration state changes and Registration Delivery intent are persisted together. A delivery worker claims pending records, sends idempotently, records attempts and retries transient failures with bounded backoff.

Cancellation tokens remain hashed on Registration records. Retryable delivery payloads containing a plaintext token are encrypted with a dedicated key and erased after successful delivery or terminal expiry.

## Consequences

- Signup success means the system can continue delivery after the request ends.
- Administrators can inspect and retry failed deliveries without generating duplicate Registration records.
- Key rotation and encrypted-payload retention require an operational runbook.
