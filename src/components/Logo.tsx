import Image from 'next/image'
import Link from 'next/link'

import type { Locale } from '@/lib/content'
import { mediaSource } from '@/lib/media'
import type { Media, SiteSetting } from '@/payload-types'

export function Logo({
  footer = false,
  locale,
  settings,
  small = false,
}: {
  footer?: boolean
  locale: Locale
  settings: SiteSetting
  small?: boolean
}) {
  const selected = (footer ? settings.footerLogo : settings.logo) || settings.logo
  const media = typeof selected === 'object' ? (selected as Media) : null
  // Deliberately no `sizes`: a fixed-pixel value would put next/image on its
  // w-descriptor branch and emit the full srcset, burning a transformation per
  // width on a wordmark that paints at 66px tall. Without it the image gets a
  // two-entry 1x/2x srcset instead. No `priority` either -- .logo__current is
  // opacity 0 until hover or focus, so it must not compete with the hero LCP.
  const src = media ? mediaSource(media) : null

  return (
    <Link
      aria-label={settings.logoAlt || settings.siteName}
      className={`logo${small ? ' logo--small' : ''}`}
      href={`/${locale}`}
    >
      <span className="logo__stage">
        <span aria-hidden="true" className="logo__crest" />
        <span className={`logo__current${media ? ' logo__current--image' : ''}`}>
          {src ? (
            <Image alt="" height={media?.height || 100} src={src} width={media?.width || 240} />
          ) : (
            <svg
              aria-hidden="true"
              className="logo__mark"
              viewBox="0 0 1462 1239"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g transform="matrix(1,0,0,1,-269.119242,-380.802671)">
                <g transform="matrix(1.533163,0,0,1.533163,-1064.859321,-323.0427)">
                  <text
                    fill="currentColor"
                    fontFamily="Internet Friends, sans-serif"
                    fontSize="400"
                    fontWeight="500"
                    x="867.207"
                    y="783.881"
                  >
                    ichtus
                  </text>
                </g>
                <g transform="matrix(1.533163,0,0,1.533163,-1091.114451,375.9573)">
                  <text
                    fill="currentColor"
                    fontFamily="Internet Friends, sans-serif"
                    fontSize="400"
                    fontWeight="500"
                    x="867.207"
                    y="783.881"
                  >
                    leuven
                  </text>
                </g>
              </g>
            </svg>
          )}
        </span>
      </span>
    </Link>
  )
}
