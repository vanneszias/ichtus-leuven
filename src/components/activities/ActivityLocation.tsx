import { SmartLink } from '@/components/ui/SmartLink'
import type { Locale } from '@/lib/content'
import { mapsEmbedKey } from '@/lib/runtimeConfig'

const copy = {
  nl: {
    directions: 'Route',
    map: (location: string) => `Kaart met de locatie van deze activiteit: ${location}`,
  },
  en: {
    directions: 'Directions',
    map: (location: string) => `Map showing the location of this activity: ${location}`,
  },
} as const

/**
 * Where the activity is. A map says that faster than an address does, and the
 * embed labels its own pin, so the written address steps aside for it. Without
 * a key there is no map to put a pin on, so the address stays written out with
 * the link that opens it in whichever maps application the visitor has.
 */
export function ActivityLocation({ locale, location }: { locale: Locale; location: string }) {
  const key = mapsEmbedKey()
  const labels = copy[locale]

  if (!key)
    return (
      <p className="activity-location">
        {location}{' '}
        <SmartLink
          className="activity-meta__directions"
          link={{
            label: labels.directions,
            newTab: true,
            type: 'external',
            url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
          }}
          locale={locale}
        />
      </p>
    )

  return (
    <iframe
      allowFullScreen
      className="activity-map"
      loading="lazy"
      // The embed geocodes the address itself, so the free-text location an
      // editor typed is what a visitor sees pinned.
      src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(location)}&language=${locale}&region=BE`}
      title={labels.map(location)}
    />
  )
}
