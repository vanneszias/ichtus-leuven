import type { Block as PayloadBlock } from 'payload'
import type { ReactNode } from 'react'

import type { Locale } from '@/lib/content'
import type { Page } from '@/payload-types'

export type PageBlock = Page['layout'][number]
export type PagePatternSlug = PageBlock['blockType']
export type PatternBlock<Slug extends PagePatternSlug> = Extract<PageBlock, { blockType: Slug }>

export type PagePatternRenderProps<Slug extends PagePatternSlug = PagePatternSlug> = {
  block: PatternBlock<Slug>
  imagePriority?: boolean
  locale: Locale
}

export type PagePattern<Slug extends PagePatternSlug> = {
  fixture: {
    block: PatternBlock<Slug>
    expectedText: string
  }
  render: (props: PagePatternRenderProps<Slug>) => ReactNode | Promise<ReactNode>
  schema: PayloadBlock & { slug: Slug }
}

export type PagePatternRegistry = {
  [Slug in PagePatternSlug]: PagePattern<Slug>
}

export function definePagePattern<Slug extends PagePatternSlug>(
  pattern: PagePattern<Slug>,
): PagePattern<Slug> {
  return pattern
}

export type Theme = 'white' | 'blue' | 'yellow' | 'pink' | 'green'

export function theme(block: PageBlock, fallback: Theme): Theme {
  const selected = block.appearance?.background
  return !selected || selected === 'default' ? fallback : selected
}
