import type { ComponentType } from 'react'

import { type PageBlock, type PagePatternRenderProps, pagePatterns } from '@/blocks'
import type { Locale } from '@/lib/content'
import type { Page } from '@/payload-types'

function RenderBlock(props: PagePatternRenderProps) {
  const Pattern = pagePatterns[props.block.blockType]
    .render as ComponentType<PagePatternRenderProps>
  return <Pattern {...props} />
}

export function BlockRenderer({
  blocks,
  locale,
  pageTitle,
}: {
  blocks: Page['layout']
  locale: Locale
  pageTitle: string
}) {
  return (
    <>
      <h1 className="sr-only">{pageTitle}</h1>
      {blocks.map((block: PageBlock, index) => (
        <RenderBlock
          block={block}
          imagePriority={index === 0 && block.blockType === 'hero'}
          key={block.id || `${block.blockType}-${index}`}
          locale={locale}
        />
      ))}
    </>
  )
}
