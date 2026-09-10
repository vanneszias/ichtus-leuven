# Domain context

Ichtus Leuven is a bilingual Christian student community in Leuven. The public website primarily helps a new student understand the community, know what to expect, find an activity and register safely. Dutch is the default language; English is a first-class locale.

## Domain language

### Page

A localized, publishable CMS document composed from curated Page Patterns. A Page has one identity across locales, while its title, slug, content and metadata are localized.

### Page Pattern

An approved editorial composition with a defined purpose, content contract and responsive implementation. Editors may reorder Page Patterns and change content, but visual choices stay within documented guardrails.

### Event

A public activity with timing, location, localized content and a Registration Policy. An Event may be maintained manually or synchronized from a Calendar Source.

### Registration Policy

The rules governing whether and when an Event accepts registrations, its capacity, whether a Waitlist is available and what attendees see when registration is closed.

### Registration

The private record of one attendee's active or historical place at an Event. A Registration is confirmed, waitlisted, cancelled or anonymized. Only one active Registration may exist for an Event and normalized email address.

### Waitlist

The ordered set of active Registrations awaiting capacity. The oldest eligible Registration is promoted when a confirmed place becomes available.

### Registration Delivery

A durable intent to send transactional email about a Registration. Delivery has its own pending, processing, sent or failed lifecycle and must be retryable without duplicating messages.

### Registration Closure Work

A durable marker on an Event that active Registrations must be cancelled in bounded background batches after unpublishing, upstream cancellation or a confirmed change away from internal registration.

### Cancellation Token

A high-entropy secret that authorizes cancellation of one Registration. Only its hash is retained on the Registration. Any plaintext needed for Registration Delivery is encrypted at rest and removed after delivery can no longer be retried.

### Calendar Source

An external source of Event timing and basic details. Google Calendar is the production adapter. CMS content remains the place for localized editorial enrichment.

### Site Settings

The global CMS document containing identity, navigation, contact details, footer content, calendar settings and default metadata.

## Invariants

- Confirmed Registrations never exceed Event capacity.
- A successful signup always creates both a Registration and durable Registration Delivery intent.
- Registration Delivery retries are idempotent.
- Cancelling a confirmed Registration promotes at most one eligible Waitlist entry.
- Public interfaces never expose attendee records, cancellation hashes or delivery payloads.
- Personal data is anonymized twelve months after the Event unless the organization approves another documented period.
- Infrastructure failures are not presented as content-not-found responses.
- Every Page Pattern configured in Payload has a rendering implementation and contract test.

## Product direction

- Primary audience: new Leuven students.
- Positioning: clearly Christian and explicitly welcoming of questions, doubt and curiosity.
- Visual direction: evolve the cobalt, expressive-type identity with authentic community photography.
- Editorial model: curated Page Patterns rather than unrestricted visual controls.
- Release model: isolated staging followed by an explicit production approval.
