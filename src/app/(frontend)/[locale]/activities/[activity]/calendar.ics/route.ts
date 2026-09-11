import { activityCalendarFile } from '@/lib/calendarFile'
import { getEvent, getEventBySlug, type Locale, locales } from '@/lib/content'
import { eventDetailHref } from '@/lib/events'
import { siteURL } from '@/lib/runtimeConfig'

/**
 * The “add to my calendar” download. It sits beside the activity page and
 * resolves the activity exactly as the page does, including the numeric
 * identifiers that addressed activities before slugs existed, so a link that
 * still points at one keeps working.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ activity: string; locale: string }> },
) {
  const route = await params
  if (!locales.includes(route.locale as Locale)) return new Response('Not found', { status: 404 })
  const locale = route.locale as Locale
  const event = /^\d+$/.test(route.activity)
    ? await getEvent(locale, route.activity)
    : await getEventBySlug(locale, route.activity)
  if (!event) return new Response('Not found', { status: 404 })

  // Only an activity with a page of its own has a calendar file to offer: the
  // others are either announced elsewhere or deliberately without a detail.
  const canonical = eventDetailHref(event, locale)
  if (!canonical || canonical.external) return new Response('Not found', { status: 404 })

  const file = activityCalendarFile(event, {
    now: new Date(),
    url: new URL(canonical.href, siteURL()).toString(),
  })

  return new Response(file, {
    // Cache-Control is left to the middleware, which already answers for every
    // locale-prefixed path and would otherwise overwrite whatever is set here.
    headers: {
      'Content-Disposition': `attachment; filename="${event.slug || `activiteit-${event.id}`}.ics"`,
      'Content-Type': 'text/calendar; charset=utf-8',
    },
  })
}
