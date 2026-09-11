import { RichText } from '@payloadcms/richtext-lexical/react'
import { type ComponentProps, cloneElement, isValidElement, type ReactNode } from 'react'

import { NewWindowAnnouncement } from '@/components/ui/SmartLink'
import type { Locale } from '@/lib/content'

/** Lexical state as the collections and blocks store it. */
export type RichContentData = ComponentProps<typeof RichText>['data']

/**
 * Editor-authored prose, rendered the same way wherever it appears. A link an
 * editor set to open in a new window has to announce that to a screen reader,
 * which the default converters do not do, so both link node types are wrapped.
 */
export function RichContent({ data, locale }: { data?: RichContentData | null; locale: Locale }) {
  if (!data) return null

  return (
    <RichText
      converters={({ defaultConverters }) => {
        const appendAnnouncement = (converted: ReactNode, newTab?: boolean | null) => {
          if (!newTab || !isValidElement<{ children?: ReactNode }>(converted)) return converted
          return cloneElement(
            converted,
            undefined,
            converted.props.children,
            <NewWindowAnnouncement locale={locale} />,
          )
        }

        return {
          ...defaultConverters,
          autolink: (args) => {
            const converter = defaultConverters.autolink
            const converted = typeof converter === 'function' ? converter(args) : converter
            return appendAnnouncement(converted, args.node.fields?.newTab)
          },
          link: (args) => {
            const converter = defaultConverters.link
            const converted = typeof converter === 'function' ? converter(args) : converter
            return appendAnnouncement(converted, args.node.fields?.newTab)
          },
        }
      }}
      data={data}
    />
  )
}
