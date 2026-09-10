import type { CollectionConfig } from 'payload'

import { registrationManagers } from '@/access'

export const RegistrationDeliveries: CollectionConfig = {
  slug: 'registration-deliveries',
  labels: { singular: 'E-mailbezorging', plural: 'E-mailbezorgingen' },
  admin: {
    defaultColumns: ['registration', 'kind', 'status', 'attempts', 'nextAttemptAt', 'updatedAt'],
    description:
      'Duurzame e-mailwachtrij. Mislukte berichten worden automatisch opnieuw geprobeerd.',
    group: 'Activiteiten',
    useAsTitle: 'idempotencyKey',
  },
  access: {
    create: () => false,
    delete: () => false,
    read: registrationManagers,
    update: () => false,
  },
  fields: [
    {
      name: 'registration',
      type: 'relationship',
      relationTo: 'registrations',
      required: true,
      index: true,
    },
    { name: 'event', type: 'relationship', relationTo: 'events', required: true, index: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Bevestiging', value: 'confirmed' },
        { label: 'Wachtlijst', value: 'waitlisted' },
        { label: 'Promotie', value: 'promoted' },
        { label: 'Annulering', value: 'cancelled' },
        { label: 'Activiteit geannuleerd', value: 'eventCancelled' },
        { label: 'Inschrijving gesloten', value: 'registrationClosed' },
        { label: 'Inschrijfmethode gewijzigd', value: 'registrationChanged' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      index: true,
      options: [
        { label: 'In afwachting', value: 'pending' },
        { label: 'Wordt verwerkt', value: 'processing' },
        { label: 'Verzonden', value: 'sent' },
        { label: 'Mislukt', value: 'failed' },
      ],
    },
    {
      name: 'attempts',
      type: 'number',
      defaultValue: 0,
      required: true,
      min: 0,
      admin: { readOnly: true },
    },
    { name: 'nextAttemptAt', type: 'date', index: true, admin: { readOnly: true } },
    { name: 'lockedAt', type: 'date', admin: { readOnly: true } },
    { name: 'lockToken', type: 'text', admin: { hidden: true }, access: { read: () => false } },
    { name: 'sentAt', type: 'date', admin: { readOnly: true } },
    { name: 'providerMessageId', type: 'text', admin: { readOnly: true } },
    { name: 'lastError', type: 'text', maxLength: 300, admin: { readOnly: true } },
    {
      name: 'idempotencyKey',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'encryptedPayload',
      type: 'textarea',
      admin: { hidden: true },
      access: { read: () => false },
    },
  ],
}
