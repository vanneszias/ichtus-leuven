import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../../src/app/(frontend)/styles.css', import.meta.url), 'utf8')

function color(name: string) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))
  if (!match) throw new Error(`Missing --${name} color`)
  return match[1]
}

function luminance(value: string) {
  const channels = [value.slice(1, 3), value.slice(3, 5), value.slice(5, 7)].map((channel) => {
    const normalized = Number.parseInt(channel, 16) / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe('Visual accessibility tokens', () => {
  it('keeps approved foreground and background combinations at WCAG AA contrast', () => {
    const blue = color('blue')
    for (const background of ['white', 'yellow', 'pink', 'green']) {
      expect(contrast(blue, color(background)), `blue on ${background}`).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrast(color('white'), blue), 'white on blue').toBeGreaterThanOrEqual(4.5)
  })

  it('defines contrast-safe focus rings for every approved surface family', () => {
    const blue = color('blue')
    for (const background of ['white', 'yellow', 'pink', 'green']) {
      expect(contrast(blue, color(background)), `focus on ${background}`).toBeGreaterThanOrEqual(3)
    }
    expect(contrast(color('white'), blue), 'focus on blue').toBeGreaterThanOrEqual(3)
    expect(css).toContain('.section--blue {\n  --focus-ring: var(--white);')
    expect(css).toContain('.statement.section--pink {\n  --focus-ring: var(--white);')
    expect(css).toContain('.values.section--pink {\n  --focus-ring: var(--white);')
  })

  it('keeps small metadata legible and practical mobile targets at 44px', () => {
    expect(css).not.toMatch(/font-size:\s*11px/)
    expect(css).toContain('.about-nav a {\n    min-height: 44px;')
    expect(css).toContain('.photo-showroom__autoplay {\n    height: 44px;')
  })
})
