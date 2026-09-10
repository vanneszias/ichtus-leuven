# ADR 0003: Curated page patterns

Status: Accepted

## Context

The current page builder exposes broad color, width, spacing, alignment and heading controls. This gives editors flexibility but permits inconsistent compositions and spreads each pattern across schema, rendering, styles and seeds.

## Decision

Editors compose Pages from curated Page Patterns. Each pattern owns a focused content contract and a small set of meaningful variants. Arbitrary visual controls are removed when existing content has been migrated.

Pattern schema, rendering, fixture and tests stay close together and are registered through an exhaustive typed registry.

## Consequences

- Editors retain composition and content control.
- Brand consistency becomes the default.
- New visual behavior requires a reviewed Page Pattern or variant.
