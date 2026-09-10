import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { pagePatterns } from '../../src/blocks'
import { RecoveryPage, recoveryContent } from '../../src/components/RecoveryPage'
import { SmartLink } from '../../src/components/ui/SmartLink'
import { aboutLayout } from '../../src/seed/about'

describe('Accessible links and recovery UI', () => {
  it('announces new windows without changing the visible link label', () => {
    const html = renderToStaticMarkup(
      createElement(
        SmartLink,
        {
          link: {
            label: 'Instagram',
            newTab: true,
            type: 'external',
            url: 'https://www.instagram.com/ichtusleuven/',
          },
          locale: 'en',
        },
        'Instagram',
      ),
    )

    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Instagram<span class="sr-only"> (opens in a new window)</span>')
  })

  it('keeps network logos decorative and localizes the new-window announcement', async () => {
    const output = await pagePatterns.networkLinks.render({
      block: pagePatterns.networkLinks.fixture.block,
      locale: 'nl',
    })
    const html = renderToStaticMarkup(output)

    expect(html).toContain('alt=""')
    expect(html).not.toContain('alt="IFES logo"')
    expect(html).toContain(
      'IFES<span aria-hidden="true">↗</span><span class="sr-only"> (opent in een nieuw venster)</span>',
    )
  })

  it('announces rich-text links that open a new window', async () => {
    const block = aboutLayout('en').find(
      (item) => item.blockType === 'content' && item.appearance?.anchor === 'basis-of-faith',
    )
    if (block?.blockType !== 'content') throw new Error('Missing basis-of-faith content')

    const output = await pagePatterns.content.render({ block, locale: 'en' })
    const html = renderToStaticMarkup(output)

    expect(html).toContain(
      'IFES International<span class="sr-only"> (opens in a new window)</span>',
    )
  })

  it.each(['nl', 'en'] as const)('renders localized recovery content for %s', (locale) => {
    for (const kind of ['notFound', 'error'] as const) {
      const html = renderToStaticMarkup(
        createElement(RecoveryPage, {
          kind,
          locale,
          retry: kind === 'error' ? () => undefined : undefined,
        }),
      )

      expect(html).toContain(recoveryContent[locale][kind].heading)
      expect(html).toContain(recoveryContent[locale][kind].body)
    }
  })
})
