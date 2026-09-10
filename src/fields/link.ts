import type { Field } from 'payload'

export const linkFields = (name = 'link', required = false): Field => ({
  name,
  type: 'group',
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      required,
    },
    {
      name: 'type',
      type: 'radio',
      defaultValue: 'internal',
      options: [
        { label: 'Interne pagina', value: 'internal' },
        { label: 'Externe URL', value: 'external' },
      ],
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: { condition: (_, siblingData) => siblingData?.type === 'internal' },
      validate: (
        value: unknown,
        { siblingData }: { siblingData?: { label?: string; type?: string } },
      ) =>
        !siblingData?.label ||
        siblingData.type !== 'internal' ||
        Boolean(value) ||
        'Kies een interne pagina.',
    },
    {
      name: 'url',
      type: 'text',
      localized: true,
      admin: { condition: (_, siblingData) => siblingData?.type === 'external' },
      validate: (
        value: string | null | undefined,
        { siblingData }: { siblingData?: { label?: string; type?: string } },
      ) => {
        if (!siblingData?.label || siblingData.type !== 'external') return true
        if (!value) return 'Vul een URL in.'
        return (
          /^(?:https?:\/\/|mailto:|tel:|#|\/)/.test(value) ||
          'Gebruik een volledige URL, e-mailadres, telefoonnummer of anker.'
        )
      },
    },
    {
      name: 'newTab',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
})
