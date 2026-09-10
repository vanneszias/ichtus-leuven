// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'

export default {
  ...defineCloudflareConfig({}),
  // OpenNext otherwise shells out to `pnpm build`, which this package does not
  // define. Build Next exactly the way CI and the deploy scripts need it: the
  // webpack builder, with the heap headroom the app build requires.
  buildCommand:
    'pnpm exec cross-env NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" next build --webpack',
}
