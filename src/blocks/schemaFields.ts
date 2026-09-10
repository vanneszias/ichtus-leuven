import { HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

export const accentOptions = [
  { label: 'Geel', value: 'yellow' },
  { label: 'Roze', value: 'pink' },
  { label: 'Groen', value: 'green' },
  { label: 'Blauw', value: 'blue' },
]

export const pageRichTextHeadingLevels = ['h3', 'h4'] as const

export const pageRichTextEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((feature) => feature.key !== 'heading'),
    HeadingFeature({ enabledHeadingSizes: [...pageRichTextHeadingLevels] }),
  ],
})

export function validatePageRichTextHeadings(value: unknown): true | string {
  let invalidHeading: string | null = null

  const visit = (node: unknown) => {
    if (invalidHeading || node == null) return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (typeof node !== 'object') return

    const record = node as Record<string, unknown>
    if (
      record.type === 'heading' &&
      typeof record.tag === 'string' &&
      !pageRichTextHeadingLevels.includes(record.tag as (typeof pageRichTextHeadingLevels)[number])
    ) {
      invalidHeading = record.tag
      return
    }
    Object.values(record).forEach(visit)
  }

  visit(value)
  return invalidHeading
    ? 'Gebruik binnen tekstsecties alleen kopniveau 3 of 4; de pagina en sectie gebruiken niveau 1 en 2.'
    : true
}
