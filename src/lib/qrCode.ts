import qrcode from 'qrcode-generator'

import { wordmark } from '@/lib/wordmark'

/** Quiet zone in modules. Four is the specification minimum for a scan. */
export const QR_MARGIN = 4
export const QR_COLOUR = '#293667'
export const QR_BACKGROUND = '#ffffff'

/** How wide the wordmark sits across the code, and its clear space, in modules. */
const WORDMARK_WIDTH_RATIO = 0.3
const WORDMARK_CLEARANCE = 1

const FINDER_SIZE = 7

export type QrArtwork = {
  /** Every dark module except the finder patterns and the wordmark's clear space. */
  dataPath: string
  /** The three finder patterns, as rings and centres. Fill with `evenodd`. */
  eyesPath: string
  /** Side of the whole drawing, quiet zone included, in modules. */
  size: number
  /** Places `wordmark.path` inside the cleared centre. */
  wordmark: { scale: number; x: number; y: number }
}

function roundedSquare(x: number, y: number, side: number, radius: number) {
  const r = Math.min(radius, side / 2)
  const straight = side - r * 2
  return [
    `M${x + r} ${y}`,
    `h${straight}`,
    `a${r} ${r} 0 0 1 ${r} ${r}`,
    `v${straight}`,
    `a${r} ${r} 0 0 1 ${-r} ${r}`,
    `h${-straight}`,
    `a${r} ${r} 0 0 1 ${-r} ${-r}`,
    `v${-straight}`,
    `a${r} ${r} 0 0 1 ${r} ${-r}`,
    'z',
  ].join('')
}

/**
 * One finder pattern: a rounded ring and a rounded centre. Drawn as three
 * nested subpaths so an `evenodd` fill punches the ring open and leaves the
 * centre solid, which keeps all three corners in a single path.
 */
function eye(x: number, y: number) {
  return (
    roundedSquare(x, y, FINDER_SIZE, 2) +
    roundedSquare(x + 1, y + 1, FINDER_SIZE - 2, 1.4) +
    roundedSquare(x + 2, y + 2, FINDER_SIZE - 4, 0.95)
  )
}

/**
 * The geometry of one branded QR code, in module units with the quiet zone
 * already applied. Every renderer — the admin preview, the SVG download and
 * the PNG download — draws these same paths, so none of them can drift.
 *
 * Correction level H is not a nicety here: the wordmark blanks out part of the
 * payload, and only H restores that much.
 */
export function qrArtwork(text: string): QrArtwork {
  const code = qrcode(0, 'H')
  code.addData(text)
  code.make()
  const count = code.getModuleCount()

  const wordmarkWidth = count * WORDMARK_WIDTH_RATIO
  const wordmarkHeight = (wordmarkWidth * wordmark.height) / wordmark.width
  const centre = count / 2
  // Clear whole modules so the cleared area reads as a crisp rectangle rather
  // than as modules clipped halfway.
  const clear = {
    bottom: Math.ceil(centre + wordmarkHeight / 2 + WORDMARK_CLEARANCE),
    left: Math.floor(centre - wordmarkWidth / 2 - WORDMARK_CLEARANCE),
    right: Math.ceil(centre + wordmarkWidth / 2 + WORDMARK_CLEARANCE),
    top: Math.floor(centre - wordmarkHeight / 2 - WORDMARK_CLEARANCE),
  }

  const inFinder = (row: number, column: number) =>
    (row < FINDER_SIZE && column < FINDER_SIZE) ||
    (row < FINDER_SIZE && column >= count - FINDER_SIZE) ||
    (row >= count - FINDER_SIZE && column < FINDER_SIZE)

  let dataPath = ''
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!code.isDark(row, column) || inFinder(row, column)) continue
      if (row >= clear.top && row < clear.bottom && column >= clear.left && column < clear.right)
        continue
      dataPath += `M${column + QR_MARGIN} ${row + QR_MARGIN}h1v1h-1z`
    }
  }

  const eyesPath =
    eye(QR_MARGIN, QR_MARGIN) +
    eye(count - FINDER_SIZE + QR_MARGIN, QR_MARGIN) +
    eye(QR_MARGIN, count - FINDER_SIZE + QR_MARGIN)

  return {
    dataPath,
    eyesPath,
    size: count + QR_MARGIN * 2,
    wordmark: {
      scale: wordmarkWidth / wordmark.width,
      x: centre - wordmarkWidth / 2 + QR_MARGIN,
      y: centre - wordmarkHeight / 2 + QR_MARGIN,
    },
  }
}

/** A standalone SVG document, with the wordmark as outlines so no font is needed. */
export function qrSVG(artwork: QrArtwork, pixels = 1024) {
  const { size, wordmark: place } = artwork
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${pixels}" height="${pixels}">`,
    `<rect width="${size}" height="${size}" fill="${QR_BACKGROUND}"/>`,
    `<path d="${artwork.dataPath}" fill="${QR_COLOUR}" shape-rendering="crispEdges"/>`,
    `<path d="${artwork.eyesPath}" fill="${QR_COLOUR}" fill-rule="evenodd"/>`,
    `<g transform="translate(${place.x} ${place.y}) scale(${place.scale})">`,
    `<path d="${wordmark.path}" fill="${QR_COLOUR}"/>`,
    '</g>',
    '</svg>',
  ].join('')
}
