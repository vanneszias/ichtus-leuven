import type { Locale } from '@/lib/content'

const label = { nl: 'Zet in mijn agenda', en: 'Add to my calendar' } as const

/**
 * A plain link to the activity's `.ics` file. One file covers every calendar
 * application — Google, Apple, Outlook — where a per-provider menu would only
 * ask the visitor a question their own device already answers.
 */
export function AddToCalendarButton({ href, locale }: { href: string; locale: Locale }) {
  return (
    <a className="button button--secondary button--icon" download href={href}>
      <svg aria-hidden="true" className="button__icon" viewBox="0 0 24 24">
        <rect height="16" rx="3" width="18" x="3" y="5" />
        <path d="M3 10h18M8 3v4M16 3v4" />
        <path className="button__icon-detail" d="m9 15 3 3 3-4.5" />
      </svg>
      <span>{label[locale]}</span>
    </a>
  )
}
