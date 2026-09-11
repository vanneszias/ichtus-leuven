import type { CollectionConfig, PayloadRequest } from 'payload'

import { activityManagers, publishedOrAuthenticated } from '@/access'
import { eventSlugFromTitle } from '@/lib/events'

/**
 * Calendar synchronization publishes recurring activities that repeat their
 * title, so a derived slug has to step aside for the next occurrence rather
 * than fail the whole sync run on the unique index.
 */
async function availableEventSlug(
  req: PayloadRequest,
  candidate: string,
  eventID?: number | string,
): Promise<string> {
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const slug = attempt === 1 ? candidate : `${candidate}-${attempt}`
    const taken = await req.payload.count({
      collection: 'events',
      // Slugs are localized, so uniqueness is only ever a question within the
      // locale being written; 'all' would compare across both columns.
      locale: req.locale === 'nl' || req.locale === 'en' ? req.locale : 'nl',
      overrideAccess: true,
      where: eventID
        ? { and: [{ slug: { equals: slug } }, { id: { not_equals: eventID } }] }
        : { slug: { equals: slug } },
    })
    if (!taken.totalDocs) return slug
  }
  return `${candidate}-${Date.now()}`
}

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Activiteit', plural: 'Activiteiten' },
  access: {
    create: activityManagers,
    delete: activityManagers,
    read: publishedOrAuthenticated,
    update: activityManagers,
  },
  admin: {
    components: {
      beforeListTable: ['@/components/admin/CalendarSyncButton'],
    },
    defaultColumns: ['title', 'startsAt', 'eventType', 'detail', 'source', '_status'],
    group: 'Activiteiten',
    useAsTitle: 'title',
  },
  defaultSort: 'startsAt',
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        if ((data.detail ?? originalDoc?.detail ?? 'page') !== 'page') return data
        if (typeof data.slug === 'string' && data.slug.trim()) {
          data.slug = eventSlugFromTitle(data.slug)
          return data
        }
        if (originalDoc?.slug) return data
        const candidate = eventSlugFromTitle(data.title || originalDoc?.title || '')
        if (candidate) data.slug = await availableEventSlug(req, candidate, originalDoc?.id)
        return data
      },
    ],
    beforeChange: [
      async ({ context, data, originalDoc, req }) => {
        if (!originalDoc?.id) return data
        if (data.capacity != null && data.capacity !== originalDoc.capacity) {
          const confirmed = await req.payload.count({
            collection: 'registrations',
            overrideAccess: true,
            where: {
              and: [{ event: { equals: originalDoc.id } }, { status: { equals: 'confirmed' } }],
            },
          })
          if (data.capacity < confirmed.totalDocs)
            throw new Error(
              `Capaciteit kan niet lager zijn dan ${confirmed.totalDocs} bevestigde inschrijvingen.`,
            )
        }
        const publicationClosed =
          originalDoc._status === 'published' && data._status && data._status !== 'published'
        const internalRegistrationClosed =
          originalDoc.registrationMode === 'internal' &&
          data.registrationMode &&
          data.registrationMode !== 'internal'
        if (internalRegistrationClosed && !data.confirmRegistrationClosure) {
          throw new Error('Bevestig expliciet dat alle actieve inschrijvingen worden geannuleerd.')
        }
        if (publicationClosed || internalRegistrationClosed) {
          data.registrationClosurePendingAt = new Date().toISOString()
          data.registrationClosureReason = internalRegistrationClosed
            ? 'modeChanged'
            : context.registrationClosureReason === 'upstreamCancelled'
              ? 'upstreamCancelled'
              : 'unpublished'
        }
        data.confirmRegistrationClosure = false
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const registrations = await req.payload.count({
          collection: 'registrations',
          overrideAccess: true,
          where: { event: { equals: id } },
        })
        if (registrations.totalDocs)
          throw new Error(
            'Een activiteit met inschrijvingsgeschiedenis kan niet worden verwijderd. Bewaar de activiteit voor de vereiste historiek.',
          )
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'summary', type: 'textarea', localized: true },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'allDay', type: 'checkbox', defaultValue: false },
    { name: 'location', type: 'text', localized: true },
    {
      name: 'eventType',
      type: 'select',
      defaultValue: 'largeGroup',
      options: [
        { label: 'Gezamenlijke avond', value: 'largeGroup' },
        { label: 'Kringavond', value: 'smallGroup' },
        { label: 'WILD', value: 'wild' },
        { label: 'Overig', value: 'other' },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'detail',
      type: 'select',
      label: 'Meer info',
      defaultValue: 'page',
      options: [
        { label: 'Eigen pagina op deze website', value: 'page' },
        { label: 'Externe pagina', value: 'external' },
        { label: 'Geen pagina', value: 'none' },
      ],
      admin: {
        description:
          'Bepaalt waar “meer info” in de agenda en de kalender naartoe wijst. “Geen pagina” toont de activiteit zonder link.',
      },
      validate: (
        value: string | null | undefined,
        { data }: { data?: { registrationMode?: string } },
      ) =>
        value === 'page' ||
        data?.registrationMode !== 'internal' ||
        'Inschrijving via deze website vraagt een eigen activiteitpagina.',
    },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      unique: true,
      index: true,
      admin: {
        condition: (_, siblingData) => siblingData?.detail === 'page',
        description:
          'Adres van de activiteitpagina, bijvoorbeeld “kringavond-kerst”. Laat leeg om het uit de titel af te leiden.',
      },
      validate: (value: string | null | undefined, { data }: { data?: { detail?: string } }) => {
        if (data?.detail !== 'page') return true
        if (!value) return 'Vul een adres in of vul eerst een titel in.'
        return (
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ||
          'Gebruik kleine letters, cijfers en koppeltekens.'
        )
      },
    },
    {
      name: 'detailUrl',
      type: 'text',
      label: 'Externe infopagina',
      admin: { condition: (_, siblingData) => siblingData?.detail === 'external' },
      validate: (value: string | null | undefined, { data }: { data?: { detail?: string } }) => {
        if (data?.detail !== 'external') return true
        return (
          Boolean(value && /^https:\/\//.test(value)) ||
          'Gebruik een volledige veilige URL die met https:// begint.'
        )
      },
    },
    {
      name: 'registrationMode',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Geen inschrijving', value: 'none' },
        { label: 'Inschrijving via deze website', value: 'internal' },
        { label: 'Externe inschrijfpagina', value: 'external' },
      ],
    },
    {
      name: 'registrationUrl',
      type: 'text',
      admin: { condition: (_, siblingData) => siblingData?.registrationMode === 'external' },
      validate: (
        value: string | null | undefined,
        { siblingData }: { siblingData?: { registrationMode?: string } },
      ) => {
        if (siblingData?.registrationMode !== 'external') return true
        return (
          Boolean(value && /^https:\/\//.test(value)) ||
          'Gebruik een volledige veilige URL die met https:// begint.'
        )
      },
    },
    {
      name: 'capacity',
      type: 'number',
      min: 1,
      validate: (value: number | null | undefined) =>
        value == null ||
        (Number.isInteger(value) && value >= 1) ||
        'Capaciteit moet een geheel getal van minstens 1 zijn.',
      admin: {
        condition: (_, siblingData) => siblingData?.registrationMode === 'internal',
        description: 'Laat leeg voor onbeperkte plaatsen.',
      },
    },
    {
      name: 'waitlistEnabled',
      type: 'checkbox',
      defaultValue: true,
      admin: { condition: (_, siblingData) => siblingData?.registrationMode === 'internal' },
    },
    {
      name: 'registrationOpensAt',
      type: 'date',
      admin: {
        condition: (_, siblingData) => siblingData?.registrationMode === 'internal',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'registrationDeadline',
      type: 'date',
      admin: {
        condition: (_, siblingData) => siblingData?.registrationMode === 'internal',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'registrationClosedMessage',
      type: 'text',
      localized: true,
      admin: { condition: (_, siblingData) => siblingData?.registrationMode === 'internal' },
    },
    {
      name: 'registrationManagement',
      type: 'ui',
      admin: {
        condition: (_, siblingData) => siblingData?.registrationMode === 'internal',
        components: { Field: '@/components/admin/RegistrationManagement' },
      },
    },
    {
      name: 'confirmRegistrationClosure',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.registrationMode !== 'internal',
        description:
          'Bevestig dat actieve inschrijvingen en wachtlijstplaatsen op de achtergrond worden geannuleerd.',
      },
    },
    {
      name: 'registrationClosurePendingAt',
      type: 'date',
      index: true,
      admin: { hidden: true },
      access: { create: () => false, update: () => false },
    },
    {
      name: 'registrationClosureReason',
      type: 'select',
      admin: { hidden: true },
      access: { create: () => false, update: () => false },
      options: [
        { label: 'Niet meer gepubliceerd', value: 'unpublished' },
        { label: 'Inschrijfmodus gewijzigd', value: 'modeChanged' },
        { label: 'Geannuleerd door agendabron', value: 'upstreamCancelled' },
      ],
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Payload', value: 'manual' },
        { label: 'Google Calendar', value: 'google' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'externalId',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'externalUrl', type: 'text', admin: { position: 'sidebar', readOnly: true } },
    { name: 'lastSyncedAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
  ],
  versions: { drafts: true, maxPerDoc: 10 },
}
