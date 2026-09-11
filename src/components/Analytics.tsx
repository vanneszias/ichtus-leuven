import { OpenPanelComponent } from '@openpanel/nextjs'

import { analyticsConfig } from '@/lib/runtimeConfig'

// OpenPanel serializes this option into its init snippet verbatim, so it has to
// be source text rather than a function. Cancellation links carry a secret
// token in their path and editor previews are not public traffic, so neither
// may ever reach the analytics server.
const excludePrivatePaths =
  "(event) => !/\\/(?:preview|registration\\/cancel)(?:\\/|$)/.test(String(event.payload?.properties?.__path ?? ''))"

export function Analytics() {
  const analytics = analyticsConfig()
  if (!analytics) return null

  return (
    <OpenPanelComponent
      apiUrl={analytics.apiURL}
      clientId={analytics.clientID}
      filter={excludePrivatePaths}
      // The self-hosted instance serves the tracker itself, which keeps the
      // Content-Security-Policy down to a single analytics origin.
      scriptUrl={`${analytics.origin}/op1.js`}
      trackScreenViews
    />
  )
}
