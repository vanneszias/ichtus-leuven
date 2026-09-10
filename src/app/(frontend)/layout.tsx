import { headers } from 'next/headers'
import type React from 'react'
import '@fontsource-variable/instrument-sans'
import './styles.css'
import { siteURL } from '@/lib/runtimeConfig'
import {
  createGlobalStructuredData,
  createSocialMetadata,
  metadataRobots,
  resolveSocialImage,
  serializeJSONLD,
} from '@/lib/seo'

export async function generateMetadata() {
  const locale = (await headers()).get('x-site-locale') === 'en' ? 'en' : 'nl'
  const baseURL = siteURL()
  const title = 'Ichtus Leuven'
  const description =
    locale === 'nl'
      ? 'Ichtus Leuven is een christelijke studentengemeenschap in Leuven.'
      : 'Ichtus Leuven is a Christian student community in Leuven.'
  const image = resolveSocialImage(undefined, undefined, title, baseURL)
  return {
    ...createSocialMetadata({
      description,
      image,
      locale,
      siteName: title,
      title,
      url: `/${locale}`,
    }),
    description,
    metadataBase: new URL(baseURL),
    robots: metadataRobots(),
    title,
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const locale = (await headers()).get('x-site-locale') === 'en' ? 'en' : 'nl'
  const structuredData = createGlobalStructuredData(siteURL())

  return (
    <html data-scroll-behavior="smooth" lang={locale}>
      <body>
        {/* The display font renders the hero heading (the LCP element on most
            pages); preloading it removes the late, CSS-discovered fetch.
            React hoists this link into <head>. */}
        <link
          as="font"
          crossOrigin="anonymous"
          href="/fonts/internet-friends.ttf"
          rel="preload"
          type="font/ttf"
        />
        {/* JSON-LD has to be injected as raw text: React escapes text children
          of <script>, which would corrupt the payload. serializeJSONLD escapes
          `<` as \u003c so the value cannot close the tag or inject markup. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: escaped JSON-LD, see above
          dangerouslySetInnerHTML={{ __html: serializeJSONLD(structuredData) }}
          id="website-structured-data"
          type="application/ld+json"
        />
        <a className="skip-link" href="#main-content">
          {locale === 'nl' ? 'Naar de inhoud' : 'Skip to content'}
        </a>
        {children}
      </body>
    </html>
  )
}
