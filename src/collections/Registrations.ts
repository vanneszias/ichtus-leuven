import type { CollectionConfig } from 'payload'

import { registrationManagers } from '@/access'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  labels: { singular: 'Inschrijving', plural: 'Inschrijvingen' },
  admin: {
    defaultColumns: ['event', 'name', 'email', 'status', 'createdAt'],
    group: 'Activiteiten',
    useAsTitle: 'name',
    description:
      'Persoonsgegevens worden twaalf maanden na de activiteit automatisch geanonimiseerd.',
  },
  access: {
    create: () => false,
    delete: () => false,
    read: registrationManagers,
    update: () => false,
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, index: true },
    { name: 'name', type: 'text', required: true, maxLength: 120 },
    { name: 'email', type: 'email', required: true, index: true },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: [
        { label: 'Nederlands', value: 'nl' },
        { label: 'English', value: 'en' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'confirmed',
      index: true,
      options: [
        { label: 'Bevestigd', value: 'confirmed' },
        { label: 'Wachtlijst', value: 'waitlisted' },
        { label: 'Geannuleerd', value: 'cancelled' },
        { label: 'Geanonimiseerd', value: 'anonymized' },
      ],
    },
    { name: 'cancelledAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'adminNotes', type: 'textarea', maxLength: 1000 },
    {
      name: 'activeKey',
      type: 'text',
      unique: true,
      index: true,
      admin: { hidden: true },
      access: { read: () => false },
    },
    {
      name: 'cancellationTokenHash',
      type: 'text',
      unique: true,
      index: true,
      admin: { hidden: true },
      access: { read: () => false },
    },
    {
      name: 'lifecycleTransitionId',
      type: 'text',
      index: true,
      admin: { hidden: true },
      access: { read: () => false },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.email) data.email = String(data.email).trim().toLowerCase()
        if (data?.name) data.name = String(data.name).trim()
        return data
      },
    ],
  },
}
