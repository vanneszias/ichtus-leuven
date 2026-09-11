// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache'

export default {
  ...defineCloudflareConfig({
    // Without an incremental cache the adapter resolves this to "dummy", whose
    // get/set both throw IgnorableError, so the unstable_cache wrappers in
    // src/lib/content.ts were pure pass-throughs and every request re-queried
    // D1 for the page and the site settings. R2 rather than KV because these
    // entries revalidate every 60s (300s for settings) across two locales,
    // which is far past KV's free-tier write allowance, and R2 is strongly
    // consistent where KV is not.
    incrementalCache: withRegionalCache(r2IncrementalCache, {
      // Keeps the hot path inside the colo: a regional hit is sub-millisecond
      // against ~30-60ms for an R2 round trip, and the homepage makes several
      // partly sequential cache reads.
      mode: 'long-lived',
      // Next >= 16 defaults this to true, which fires a background R2 read on
      // every regional hit. Nothing here calls revalidateTag and there is no
      // tag cache, so that work buys no freshness -- staleness is already
      // bounded by each entry's own revalidate window.
      shouldLazilyUpdateOnCacheHit: false,
    }),
    // No tagCache on purpose. Nothing in src calls revalidateTag or
    // revalidatePath, so the declared tags are never invalidated on demand and
    // expiry is computed from age inside Next. Adding the D1 tag cache would
    // put a table Payload does not own in Payload's database and add a D1
    // round trip to the path this change exists to take D1 off.
  }),
  // OpenNext otherwise shells out to `pnpm build`, which this package does not
  // define. Build Next exactly the way CI and the deploy scripts need it: the
  // webpack builder, with the heap headroom the app build requires.
  buildCommand:
    'pnpm exec cross-env NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" next build --webpack',
}
