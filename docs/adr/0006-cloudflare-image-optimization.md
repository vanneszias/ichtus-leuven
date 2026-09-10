# 6. Cloudflare Images for Next.js image optimization

Date: 2026-08-30

## Status

Accepted

## Context

The site runs on Cloudflare Workers via `@opennextjs/cloudflare` (ADR 0001). By
default the OpenNext adapter serves `/_next/image` requests without any actual
resizing or format conversion: the original file is fetched and passed through.
Every `next/image` on the site therefore shipped full-resolution WebP/PNG
sources regardless of the rendered size, which hurts LCP and transfer budgets
(tracker items IMG-01, IMG-02, PERF-01/02).

The organization wants to stay on Cloudflare's free tiers.

Two supported options exist:

1. **Cloudflare Images binding** — declare `images: { binding: "IMAGES" }` in
   `wrangler.jsonc`. The adapter then implements a Next.js-compatible
   optimizer behind `/_next/image`, honoring `images.localPatterns` and
   `sizes`/`srcset` from `next.config.ts`.
2. **Custom loader** — rewrite image URLs to `/cdn-cgi/image/...` so
   transformation happens at the edge without invoking the Worker. Requires a
   custom domain zone with transformations enabled, and bypasses Next.js
   source allow-listing (`localPatterns`), which must then be replicated in
   the Cloudflare dashboard.

## Decision

Use the **Cloudflare Images binding** (option 1) in all environments.

- Configuration lives entirely in the repository (`wrangler.jsonc`), keeping
  the source allow-list (`images.localPatterns` in `next.config.ts`)
  authoritative.
- It works on `workers.dev` preview hostnames as well as the production zone.
- `next dev` keeps using the built-in Next.js optimizer, so local behavior is
  unchanged.

To protect the free-tier budget, `images.deviceSizes` in `next.config.ts` is
capped at 1920px (source photography is at most 1600px wide) which keeps the
number of unique transformations per image small.

## Free-tier budget

The Images Free plan includes **5,000 unique transformations per calendar
month** (a unique transformation is one original image × one parameter set;
repeat requests in the same month are not re-counted, and `format=auto` counts
once regardless of the delivered format).

Rough budget: ~30 distinct images site-wide × 7 srcset widths ≈ 210 unique
transformations per month — about 4% of the free quota. If the quota is ever
exceeded, cached transformations keep being served; only new transformations
fail (error 9422), and no charges are incurred.

## Consequences

- `wrangler.jsonc` declares the `IMAGES` binding for local, staging and
  production; `cloudflare-env.d.ts` includes the `ImagesBinding` type.
- Static assets under `/photos`, `/logos` and `/fonts` get explicit
  `Cache-Control` headers via `public/_headers` so originals are also cached
  at the edge.
- Only PNG, JPEG, WebP, AVIF, GIF and SVG inputs are optimized; anything else
  is passed through unchanged.
- Monitoring: the Cloudflare dashboard → Images → Transformations shows
  monthly unique-transformation usage; check it if media volume grows
  significantly (e.g. many CMS uploads per month).
