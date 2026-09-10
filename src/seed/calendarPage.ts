import type { StarterPage } from '@/seed/starterContent'

/**
 * The calendar Page is part of the website's structure rather than editorial
 * work: without it the activities have nowhere to be browsed. It is written by
 * hand so a fresh database has it even before a content pull has captured the
 * published version, and `applyStarterContent` steps aside as soon as a pull
 * does capture it.
 */
export const calendarStarterPage: StarterPage = {
  key: 'kalender',
  navigationOrder: 0,
  locales: {
    nl: {
      slug: 'kalender',
      title: 'Kalender',
      navigationLabel: 'kalender',
      seo: {
        title: 'Kalender',
        description: 'Alle avonden, kringen en activiteiten van Ichtus Leuven, maand per maand.',
        noIndex: false,
      },
      layout: () => [
        {
          blockType: 'calendar',
          heading: 'Alles wat eraan komt.',
          intro:
            'Blader door de maanden en open een activiteit voor de details. Staat er nog niets bij een datum, dan volgt die avond later.',
          emptyMessage: 'Er staan nog geen activiteiten in de kalender.',
          appearance: {
            background: 'white',
            spacing: 'spacious',
            width: 'standard',
            alignment: 'left',
            headingSize: 'large',
            anchor: 'kalender',
          },
        },
      ],
    },
    en: {
      slug: 'calendar',
      title: 'Calendar',
      navigationLabel: 'calendar',
      seo: {
        title: 'Calendar',
        description: 'Every evening, small group and activity at Ichtus Leuven, month by month.',
        noIndex: false,
      },
      layout: () => [
        {
          blockType: 'calendar',
          heading: 'Everything coming up.',
          intro:
            'Browse the months and open an activity for the details. An empty date simply means that evening is still to be announced.',
          emptyMessage: 'There are no activities in the calendar yet.',
          appearance: {
            background: 'white',
            spacing: 'spacious',
            width: 'standard',
            alignment: 'left',
            headingSize: 'large',
            anchor: 'calendar',
          },
        },
      ],
    },
  },
}
