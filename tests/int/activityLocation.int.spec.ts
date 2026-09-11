import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { ActivityLocation } from '../../src/components/activities/ActivityLocation'

const KEY = 'NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY'

function render(locale: 'nl' | 'en', location: string) {
  return renderToStaticMarkup(createElement(ActivityLocation, { locale, location }))
}

afterEach(() => {
  delete process.env[KEY]
})

describe('where an activity is', () => {
  it('pins the address on a map once an embed key is configured', () => {
    process.env[KEY] = 'test-embed-key'
    const html = render('nl', 'Naamsestraat 22, Leuven')

    expect(html).toContain('https://www.google.com/maps/embed/v1/place')
    expect(html).toContain('q=Naamsestraat%2022%2C%20Leuven')
    // The frame is the only thing naming the place, so its title has to carry
    // the address for anyone who never sees the tiles.
    expect(html).toContain(
      'title="Kaart met de locatie van deze activiteit: Naamsestraat 22, Leuven"',
    )
    expect(html).toContain('loading="lazy"')
  })

  it('writes the address out instead when no key is configured', () => {
    const html = render('nl', 'Naamsestraat 22, Leuven')

    expect(html).not.toContain('<iframe')
    expect(html).toContain('Naamsestraat 22, Leuven')
    expect(html).toContain(
      'https://www.google.com/maps/search/?api=1&amp;query=Naamsestraat%2022%2C%20Leuven',
    )
    expect(html).toContain('Route')
  })

  it('speaks the visitor’s language either way', () => {
    expect(render('en', 'Leuven')).toContain('Directions')
    process.env[KEY] = 'test-embed-key'
    expect(render('en', 'Leuven')).toContain(
      'title="Map showing the location of this activity: Leuven"',
    )
  })
})
