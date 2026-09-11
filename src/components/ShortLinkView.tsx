import config from '@payload-config'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { getPayload } from 'payload'

import { ShortLinkInterstitial } from '@/components/ShortLinkInterstitial'
import { getShortLink, type Locale } from '@/lib/content'
import { shortLinkDestination, shortLinkIsOpen } from '@/lib/shortLinks'

async function recordClick(
  linkID: number,
  previousCount: number,
  click: { country: string; referrer: string },
) {
  const payload = await getPayload({ config })
  await payload.update({
    collection: 'short-links',
    id: linkID,
    data: { clickCount: previousCount + 1, lastClickedAt: new Date().toISOString() },
  })
  await payload.create({
    collection: 'short-link-clicks',
    data: {
      country: click.country || undefined,
      link: linkID,
      referrer: click.referrer || undefined,
    },
  })
}

/**
 * The confirmation screen behind a short code. Resolving the destination is
 * the only work the visitor waits for; the two writes that record the click
 * run once the response is on its way, and a failure there costs a statistic
 * rather than the redirect itself.
 */
export async function ShortLinkView({ code, locale }: { code: string; locale: Locale }) {
  const link = await getShortLink(locale, code)
  if (!link || !shortLinkIsOpen(link)) notFound()
  const destination = shortLinkDestination(link, locale)
  if (!destination) notFound()

  const requestHeaders = await headers()
  // Request APIs cannot be read inside an `after` callback in a Server
  // Component, so the two values it needs are captured here.
  const click = {
    country: requestHeaders.get('cf-ipcountry') || '',
    referrer: (requestHeaders.get('referer') || '').slice(0, 255),
  }

  after(async () => {
    try {
      await recordClick(link.id, link.clickCount || 0, click)
    } catch (error) {
      console.error(
        JSON.stringify({ code, level: 'error', msg: 'Recording a short link click failed' }),
        error,
      )
    }
  })

  return <ShortLinkInterstitial code={link.code} destination={destination} locale={locale} />
}
