'use client'

import FullCalendar, { useCalendarController } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import listPlugin from '@fullcalendar/react/list'
import enLocale from '@fullcalendar/react/locales/en-gb'
import nlLocale from '@fullcalendar/react/locales/nl'
import themePlugin from '@fullcalendar/react/themes/forma'
import { useEffect } from 'react'

import type { Locale } from '@/lib/content'
import { EVENT_TIME_ZONE } from '@/lib/eventDisplay'
import type { CalendarEntry } from '@/lib/events'

// FullCalendar ships its own layout and theme, so the site only supplies the
// palette. `styles.css` maps every `--fc-forma-*` token onto a brand colour.
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/forma/theme.css'

const plugins = [themePlugin, dayGridPlugin, listPlugin]

// A month grid truncates activity titles on a phone, so the same calendar
// opens as a list there. Visitors can still switch with the toolbar.
const COMPACT_VIEWPORT = '(max-width: 720px)'

/**
 * Entries carrying a `url` render as real anchors, so the calendar stays
 * keyboard operable and right-clickable without a click handler. Activities
 * that opted out of a page render as plain, unlinked entries.
 */
export function EventCalendar({ entries, locale }: { entries: CalendarEntry[]; locale: Locale }) {
  const controller = useCalendarController()

  useEffect(() => {
    const compact = window.matchMedia(COMPACT_VIEWPORT)
    const applyView = () => controller.changeView(compact.matches ? 'listMonth' : 'dayGridMonth')
    applyView()
    compact.addEventListener('change', applyView)
    return () => compact.removeEventListener('change', applyView)
  }, [controller])

  return (
    <div className="event-calendar">
      <FullCalendar
        dayMaxEvents={3}
        // Filled chips rather than the default dot: the colour names the kind
        // of evening here, so it is information and not decoration on a bullet.
        eventDisplay="block"
        // FullCalendar refines every key an event input carries, so a
        // present-but-undefined `url` arrives as the string "undefined" and
        // sends an unlinked activity to /undefined. An activity without a
        // detail page has to leave the key out altogether.
        events={entries.map(({ url, ...entry }) => (url ? { ...entry, url } : entry))}
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit' }}
        headerToolbar={{
          center: 'title',
          left: 'prev,next today',
          right: 'dayGridMonth,listMonth',
        }}
        height="auto"
        initialView="dayGridMonth"
        controller={controller}
        locale={locale === 'nl' ? nlLocale : enLocale}
        plugins={plugins}
        timeZone={EVENT_TIME_ZONE}
      />
    </div>
  )
}
