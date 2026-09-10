# ADR 0004: Event and registration lifecycle

Status: Accepted

## Context

Unpublishing an Event currently cancels active Registrations, while deletion and capacity reduction are not fully defined. Calendar cancellation can trigger synchronous email fan-out.

## Decision

- An Event with active Registrations cannot be deleted.
- Reducing capacity below confirmed attendance is rejected.
- Changing registration mode away from internal requires explicit confirmation and cancels active Registrations through background work.
- Unpublishing or upstream cancellation closes registration and enqueues cancellation deliveries.
- Restoring an Event does not restore cancelled Registrations automatically.
- Cancellation and Waitlist promotion are idempotent state transitions.

## Consequences

Collection hooks validate policy and delegate transitions to the Registration module. Bulk delivery never runs synchronously inside an Event update.
