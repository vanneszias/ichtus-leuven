import qrcode from 'qrcode-generator'
import { describe, expect, it } from 'vitest'

import { QR_MARGIN, qrArtwork, qrSVG } from '../../src/lib/qrCode'
import { wordmark } from '../../src/lib/wordmark'

const url = 'https://ichtusleuven.be/weekend'

/** The module coordinates the data path paints, quiet zone removed. */
function paintedModules(dataPath: string) {
  return [...dataPath.matchAll(/M(\d+) (\d+)h1v1h-1z/g)].map((match) => ({
    column: Number(match[1]) - QR_MARGIN,
    row: Number(match[2]) - QR_MARGIN,
  }))
}

function reference(text: string) {
  const code = qrcode(0, 'H')
  code.addData(text)
  code.make()
  return code
}

describe('branded QR geometry', () => {
  const artwork = qrArtwork(url)
  const code = reference(url)
  const count = code.getModuleCount()

  it('surrounds the code with the quiet zone the specification asks for', () => {
    expect(artwork.size).toBe(count + QR_MARGIN * 2)
  })

  it('paints only modules the encoder marked dark', () => {
    for (const { column, row } of paintedModules(artwork.dataPath))
      expect(code.isDark(row, column)).toBe(true)
  })

  it('leaves the finder patterns to the rounded eyes', () => {
    const inFinder = (row: number, column: number) =>
      (row < 7 && column < 7) ||
      (row < 7 && column >= count - 7) ||
      (row >= count - 7 && column < 7)
    for (const { column, row } of paintedModules(artwork.dataPath))
      expect(inFinder(row, column)).toBe(false)
    // Three eyes, each an outer ring, its hole and a centre.
    expect(artwork.eyesPath.match(/M/g)?.length).toBe(9)
  })

  it('clears a centred rectangle for the wordmark and nothing more', () => {
    const painted = paintedModules(artwork.dataPath)
    const { scale, x, y } = artwork.wordmark
    const box = {
      bottom: y - QR_MARGIN + wordmark.height * scale,
      left: x - QR_MARGIN,
      right: x - QR_MARGIN + wordmark.width * scale,
      top: y - QR_MARGIN,
    }
    for (const { column, row } of painted) {
      const overlaps =
        column + 1 > box.left && column < box.right && row + 1 > box.top && row < box.bottom
      expect(overlaps).toBe(false)
    }
    // Centred on both axes, and small enough for level H to restore.
    expect(box.left + box.right).toBeCloseTo(count, 5)
    expect(box.top + box.bottom).toBeCloseTo(count, 5)
    const covered = ((box.right - box.left) * (box.bottom - box.top)) / count ** 2
    expect(covered).toBeLessThan(0.12)
  })

  it('grows with a longer code rather than crowding the wordmark', () => {
    const longer = qrArtwork('https://ichtusleuven.be/inschrijving-weekend-2027-vroegboek')
    expect(longer.size).toBeGreaterThan(artwork.size)
    expect(longer.wordmark.scale).toBeGreaterThan(artwork.wordmark.scale)
  })
})

describe('QR downloads', () => {
  const svg = qrSVG(qrArtwork(url))

  it('carries the wordmark as outlines so no font has to be installed', () => {
    expect(svg).toContain(wordmark.path)
    expect(svg).not.toContain('font-family')
    expect(svg).not.toContain('<text')
  })

  it('references nothing outside itself', () => {
    expect(svg).not.toMatch(/https?:\/\/(?!www\.w3\.org)/)
  })
})
