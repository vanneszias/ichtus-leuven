import type { Payload, PayloadRequest } from 'payload'
import { Temporal } from 'temporal-polyfill'

import { EVENT_TIME_ZONE } from '@/lib/eventDisplay'
import type { Event } from '@/payload-types'
import type { SeedMediaFilename, SeedMediaIDs } from '@/seed/starter/media'
import type { StarterLocale } from '@/seed/starterContent'

/** The editorial half of a sample activity, in one locale. */
type SampleEventLocale = {
  location?: string
  registrationClosedMessage?: string
  slug?: string
  summary: string
  title: string
}

/**
 * A moment on the sample programme, expressed relative to the Wednesday the
 * seed run lands in and in Brussels wall-clock time, because that is how an
 * editor reads an activity back in the admin panel.
 */
type SampleMoment = { days?: number; time?: string; weeks?: number }

type SampleEvent = {
  allDay?: boolean
  capacity?: number
  detail: NonNullable<Event['detail']>
  detailUrl?: string
  /** Days into the run, plus the local time the activity closes. */
  ends?: SampleMoment
  eventType: NonNullable<Event['eventType']>
  image?: SeedMediaFilename
  locales: Record<StarterLocale, SampleEventLocale>
  registrationDeadlineDaysBefore?: number
  registrationMode?: NonNullable<Event['registrationMode']>
  registrationUrl?: string
  starts: SampleMoment
  waitlistEnabled?: boolean
}

const INSTAGRAM_URL = 'https://www.instagram.com/ichtusleuven/'

/**
 * Ichtus meets on Wednesday evenings, so the sample programme is anchored on
 * the Wednesday of the week the seed runs in. That keeps a freshly seeded
 * database showing a recognisable year: a few evenings that have already
 * happened, and more than a month of activities still to come.
 */
export const sampleEvents: SampleEvent[] = [
  {
    detail: 'none',
    ends: { time: '21:30' },
    eventType: 'smallGroup',
    starts: { time: '18:30', weeks: -2 },
    locales: {
      nl: {
        summary:
          'Samen eten op kot en daarna in gesprek over de gelijkenissen in Lucas 15. Je kring spreekt de locatie onderling af.',
        title: 'Kringavond: Lucas 15',
      },
      en: {
        summary:
          'A shared meal at someone’s place, followed by a conversation about the parables in Luke 15. Each small group agrees on its own location.',
        title: 'Small group: Luke 15',
      },
    },
  },
  {
    detail: 'page',
    ends: { time: '22:00' },
    eventType: 'largeGroup',
    image: 'community-prayer.webp',
    starts: { time: '18:30', weeks: -1 },
    locales: {
      nl: {
        location: 'Leuven',
        slug: 'ga-bidden-als-een-beginner',
        summary:
          'We eten samen, zingen en bidden, en daarna vertelt onze spreker wat bidden midden in een studentenleven kan betekenen.',
        title: 'GA: bidden als een beginner',
      },
      en: {
        location: 'Leuven',
        slug: 'shared-evening-praying-as-a-beginner',
        summary:
          'We eat, sing and pray together, and then our speaker unpacks what prayer can mean in the middle of student life.',
        title: 'Shared evening: praying as a beginner',
      },
    },
  },
  {
    detail: 'page',
    ends: { time: '22:30' },
    eventType: 'wild',
    image: 'community-park-game.webp',
    starts: { time: '18:30', weeks: 0 },
    locales: {
      nl: {
        location: 'Bowling Leuven',
        slug: 'wild-bowlingavond',
        summary:
          'Eerst samen eten, daarna bowlen met heel de groep. De perfecte avond om een vriend of vriendin mee te nemen.',
        title: 'WILD: bowlingavond',
      },
      en: {
        location: 'Bowling Leuven',
        slug: 'wild-bowling-night',
        summary:
          'Dinner together first, then bowling with the whole group. The perfect evening to bring a friend along.',
        title: 'WILD: bowling night',
      },
    },
  },
  {
    detail: 'none',
    ends: { time: '21:30' },
    eventType: 'smallGroup',
    starts: { time: '18:30', weeks: 1 },
    locales: {
      nl: {
        summary: 'Eten, Bijbelstudie rond Lucas 19 en tijd om te horen hoe het met iedereen gaat.',
        title: 'Kringavond: Lucas 19',
      },
      en: {
        summary: 'Food, Bible study on Luke 19 and time to hear how everyone is doing.',
        title: 'Small group: Luke 19',
      },
    },
  },
  {
    detail: 'page',
    ends: { time: '22:00' },
    eventType: 'largeGroup',
    image: 'Ichtus-64.jpg',
    starts: { time: '18:30', weeks: 2 },
    locales: {
      nl: {
        location: 'Leuven',
        slug: 'ga-jaarthema-avond',
        summary:
          'Een avond rond het jaarthema, met een workshop, aanbidding en gebed. Nadien zijn we nog te vinden op café.',
        title: 'GA: jaarthema-avond',
      },
      en: {
        location: 'Leuven',
        slug: 'shared-evening-year-theme',
        summary:
          'An evening around the year theme, with a workshop, worship and prayer. Afterwards you will find us at the pub.',
        title: 'Shared evening: year theme',
      },
    },
  },
  {
    allDay: true,
    capacity: 40,
    detail: 'page',
    ends: { days: 2 },
    eventType: 'other',
    image: 'Ichtus-78.jpg',
    registrationDeadlineDaysBefore: 10,
    registrationMode: 'internal',
    starts: { days: 2, weeks: 3 },
    waitlistEnabled: true,
    locales: {
      nl: {
        location: 'Ardennen',
        registrationClosedMessage:
          'De inschrijvingen zijn gesloten. Stuur ons een berichtje als je toch nog graag meegaat.',
        slug: 'ichtusweekend',
        summary:
          'Drie dagen weg met heel de groep: verdieping, wandelingen, spel en veel tijd voor elkaar. De prijs is inclusief eten en overnachting.',
        title: 'Ichtusweekend',
      },
      en: {
        location: 'Ardennes',
        registrationClosedMessage:
          'Registration has closed. Send us a message if you would still like to join.',
        slug: 'ichtus-weekend',
        summary:
          'Three days away with the whole group: teaching, walks, games and plenty of time for one another. Meals and accommodation are included.',
        title: 'Ichtus weekend',
      },
    },
  },
  {
    detail: 'page',
    ends: { time: '22:30' },
    eventType: 'wild',
    image: 'community-table.webp',
    starts: { time: '18:30', weeks: 4 },
    locales: {
      nl: {
        location: 'Leuven',
        slug: 'wild-ichtus-leuven-quiz',
        summary:
          'De jaarlijkse Ichtus Leuven Quiz. Schrijf je in met een ploegje of laat ons je indelen bij een team.',
        title: 'WILD: Ichtus Leuven Quiz',
      },
      en: {
        location: 'Leuven',
        slug: 'wild-ichtus-leuven-quiz-night',
        summary:
          'The yearly Ichtus Leuven Quiz. Sign up with a team of your own or let us place you in one.',
        title: 'WILD: Ichtus Leuven Quiz',
      },
    },
  },
  {
    detail: 'external',
    detailUrl: INSTAGRAM_URL,
    ends: { time: '22:00' },
    eventType: 'other',
    registrationMode: 'external',
    registrationUrl: INSTAGRAM_URL,
    starts: { time: '20:00', weeks: 6 },
    locales: {
      nl: {
        location: 'Leuven',
        summary:
          'Een avond samen zingen met de Ichtusgroepen uit heel Vlaanderen. Alle praktische info staat op onze socials.',
        title: 'Sing-in met Ichtus Vlaanderen',
      },
      en: {
        location: 'Leuven',
        summary:
          'An evening of singing together with the Ichtus groups from across Flanders. All the practical details are on our socials.',
        title: 'Sing-in with Ichtus Vlaanderen',
      },
    },
  },
]

/** The Wednesday of the week a seed run lands in, read in Brussels. */
function anchorWednesday(reference: Date): Temporal.PlainDate {
  const today = Temporal.Instant.fromEpochMilliseconds(reference.getTime())
    .toZonedDateTimeISO(EVENT_TIME_ZONE)
    .toPlainDate()
  return today.subtract({ days: (today.dayOfWeek - 3 + 7) % 7 })
}

function instant(date: Temporal.PlainDate, time = '00:00'): string {
  return date
    .toZonedDateTime({ plainTime: Temporal.PlainTime.from(time), timeZone: EVENT_TIME_ZONE })
    .toInstant()
    .toString()
}

/**
 * Turns the relative programme into the timestamps Payload stores. An all-day
 * activity ends on the last day it runs, which is what an editor enters by
 * hand and what `calendarEnd` expects from a manually maintained activity.
 */
export function sampleEventTimes(sample: SampleEvent, reference: Date) {
  const anchor = anchorWednesday(reference)
  const startDate = anchor.add({ days: sample.starts.days ?? 0, weeks: sample.starts.weeks ?? 0 })
  return {
    endsAt: sample.ends
      ? instant(startDate.add({ days: sample.ends.days ?? 0 }), sample.ends.time)
      : undefined,
    registrationDeadline: sample.registrationDeadlineDaysBefore
      ? instant(startDate.subtract({ days: sample.registrationDeadlineDaysBefore }), '23:59')
      : undefined,
    startsAt: instant(startDate, sample.starts.time),
  }
}

/**
 * Publishes the sample programme, skipping any activity whose Dutch title is
 * already in the database so a second seed run neither duplicates nor
 * overwrites what an editor has since done with it.
 */
export async function ensureSampleEvents(
  payload: Payload,
  media: SeedMediaIDs,
  req?: PayloadRequest,
  reference: Date = new Date(),
): Promise<number[]> {
  const ids: number[] = []

  for (const sample of sampleEvents) {
    const existing = await payload.find({
      collection: 'events',
      draft: true,
      limit: 1,
      locale: 'nl',
      overrideAccess: true,
      req,
      where: { title: { equals: sample.locales.nl.title } },
    })
    if (existing.docs[0]) {
      ids.push(existing.docs[0].id)
      continue
    }

    const times = sampleEventTimes(sample, reference)
    const created = await payload.create({
      collection: 'events',
      locale: 'nl',
      overrideAccess: true,
      req,
      data: {
        _status: 'published',
        allDay: Boolean(sample.allDay),
        capacity: sample.capacity,
        detail: sample.detail,
        detailUrl: sample.detailUrl,
        endsAt: times.endsAt,
        eventType: sample.eventType,
        image: sample.image ? media[sample.image] : undefined,
        location: sample.locales.nl.location,
        registrationClosedMessage: sample.locales.nl.registrationClosedMessage,
        registrationDeadline: times.registrationDeadline,
        registrationMode: sample.registrationMode ?? 'none',
        registrationUrl: sample.registrationUrl,
        slug: sample.locales.nl.slug,
        source: 'manual',
        startsAt: times.startsAt,
        summary: sample.locales.nl.summary,
        title: sample.locales.nl.title,
        waitlistEnabled: sample.waitlistEnabled ?? true,
      },
    })

    await payload.update({
      collection: 'events',
      id: created.id,
      locale: 'en',
      overrideAccess: true,
      req,
      data: {
        _status: 'published',
        location: sample.locales.en.location,
        registrationClosedMessage: sample.locales.en.registrationClosedMessage,
        slug: sample.locales.en.slug,
        summary: sample.locales.en.summary,
        title: sample.locales.en.title,
      },
    })

    ids.push(created.id)
  }

  return ids
}
