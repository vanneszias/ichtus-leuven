import type { Field } from 'payload'

const backgroundOptions = [
  { label: 'Standaard voor dit blok', value: 'default' },
  { label: 'Wit', value: 'white' },
  { label: 'Blauw', value: 'blue' },
  { label: 'Geel', value: 'yellow' },
  { label: 'Roze', value: 'pink' },
  { label: 'Groen', value: 'green' },
]

export const appearanceFields = (defaultBackground = 'default'): Field => ({
  name: 'appearance',
  type: 'group',
  label: 'Vormgeving',
  admin: {
    description: 'Beperkte varianten binnen het vaste pagina-ontwerp.',
  },
  fields: [
    {
      name: 'background',
      type: 'select',
      defaultValue: defaultBackground,
      options: backgroundOptions,
    },
    {
      name: 'spacing',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: 'Compact', value: 'compact' },
        { label: 'Normaal', value: 'normal' },
        { label: 'Ruim', value: 'spacious' },
      ],
    },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Smal', value: 'narrow' },
        { label: 'Standaard', value: 'standard' },
        { label: 'Breed', value: 'wide' },
      ],
    },
    {
      name: 'alignment',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Links', value: 'left' },
        { label: 'Centraal', value: 'center' },
      ],
      admin: { hidden: true },
    },
    {
      name: 'headingSize',
      type: 'select',
      defaultValue: 'large',
      options: [
        { label: 'Klein', value: 'small' },
        { label: 'Middelgroot', value: 'medium' },
        { label: 'Groot', value: 'large' },
      ],
      admin: { hidden: true },
    },
    {
      name: 'anchor',
      type: 'text',
      admin: { description: 'Optioneel anker voor navigatielinks, bijvoorbeeld “agenda”.' },
      validate: (value: string | null | undefined) =>
        !value ||
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ||
        'Gebruik kleine letters, cijfers en koppeltekens.',
    },
  ],
})
