import type { Block } from 'payload'

import { calendarPattern } from './Calendar'
import { callToActionPattern } from './CallToAction'
import { contentPattern } from './Content'
import { eventsListPattern } from './EventsList'
import { faqPattern } from './FAQ'
import { heroPattern } from './Hero'
import { infoCardsPattern } from './InfoCards'
import { mediaGridPattern } from './MediaGrid'
import { networkLinksPattern } from './NetworkLinks'
import { photoStoryPattern } from './PhotoStory'
import { posterPattern } from './Poster'
import { quotePattern } from './Quote'
import { statementPattern } from './Statement'
import type { PagePatternRegistry } from './types'
import { valuesPattern } from './Values'

export const pagePatterns = {
  hero: heroPattern,
  values: valuesPattern,
  content: contentPattern,
  poster: posterPattern,
  eventsList: eventsListPattern,
  calendar: calendarPattern,
  statement: statementPattern,
  quote: quotePattern,
  callToAction: callToActionPattern,
  mediaGrid: mediaGridPattern,
  networkLinks: networkLinksPattern,
  photoStory: photoStoryPattern,
  infoCards: infoCardsPattern,
  faq: faqPattern,
} satisfies PagePatternRegistry

export const pageBlocks: Block[] = Object.values(pagePatterns).map((pattern) => pattern.schema)

export type { PageBlock, PagePatternRenderProps, PagePatternSlug } from './types'
