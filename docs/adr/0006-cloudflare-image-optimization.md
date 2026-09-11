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

## Amendment, 2026-09-11: the binding never applied to CMS media

The decision above was implemented, but a production Lighthouse run showed every
CMS image still shipping its full-resolution original. `ResponsiveMedia` carried
`unoptimized={media.url.startsWith('/api/media/file/')}`, added because the
optimizer answered 404 for those paths.

The cause is in the adapter. `handleImageRequest` branches on whether the `url`
parameter is relative: relative sources are fetched through `env.ASSETS`, the
static-assets binding, which can only see files shipped with the build and not
the objects Payload streams out of R2. Absolute sources take a plain `fetch`
instead, which works — and works specifically because the
`global_fetch_strictly_public` compatibility flag makes a Worker's request to its
own zone loop back through Cloudflare's front door. That flag is now load-bearing
for image optimization; removing it breaks every CMS image.

So CMS media is now requested with an absolute URL (`src/lib/media.ts`), matched
by `images.remotePatterns` scoped to `/api/media/file/**`. `localPatterns` keeps
the same path because `next dev` and `next start` use Next's own optimizer, which
resolves relative sources internally and rejects absolute loopback ones outright.

A second, independent defect surfaced at the same time: **optimized output was
never cacheable**, including on the curated `/photos` path that did work.
`createImageResponse` attaches `Cache-Control` to its own response only when the
upstream response's `Cache-Control` contains the literal word `immutable`. The R2
storage adapter stores only a content type, so `/api/media/file/*` sent no
caching header at all, and `public/_headers` gave `/photos/*` a `max-age` without
`immutable`. Every optimized variant was therefore re-fetched and re-transformed
on every view — the real threat to the transformation budget, far more than
srcset width count. Both are fixed: `Media.upload.modifyResponseHeaders` sets
`public, max-age=31536000, immutable`, and `_headers` adds `immutable` for
`/photos/*` and `/logos/*`.

`immutable` is only safe because the URL changes when the bytes can have changed.
Payload filenames are not content-hashed, so `mediaSource()` appends a `?v=` token
derived from the document's `updatedAt`. The pattern matchers ignore a query
string unless the pattern declares `search`, and Payload's file route ignores
unknown parameters, so the token passes through both.

## Free-tier budget

The Images Free plan includes **5,000 unique transformations per calendar
month** (a unique transformation is one original image × one parameter set;
repeat requests in the same month are not re-counted, and `format=auto` counts
once regardless of the delivered format).

The original arithmetic here ("~30 images × 7 srcset widths ≈ 210") understated
the width count: `imageSizes` had never been configured, so the candidate list
was `deviceSizes` plus the eight Next defaults starting at 16px, and a low-`vw`
slot pulled in widths nobody renders. `imageSizes` is now `[256, 384]`, which
caps every slot at nine srcset entries. With roughly 27 originals site-wide
(14 seeded CMS uploads, 6 curated photos, 6 network logos, the social card), the
realistic steady state is ~250-350 unique transformations per month, or 5-7% of
the free quota. The conclusion survives; the arithmetic did not.

`formats: ['image/avif', 'image/webp']` is free against this budget: Cloudflare
bills one transformation per image and parameter set regardless of how many
output formats it serves.

If the quota is ever exceeded, cached transformations keep being served; only new
transformations fail (error 9422), and no charges are incurred. Note that the
adapter does not wrap the transform call, so a 9422 surfaces as a 500 rather than
a pass-through of the original — the `immutable` headers above are the primary
defense, and the one-line rollback is to restore `unoptimized` in
`src/components/blocks/shared.tsx`.

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
