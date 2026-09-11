'use client'

import { useFormFields } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'

import { QR_BACKGROUND, QR_COLOUR, type QrArtwork, qrArtwork, qrSVG } from '@/lib/qrCode'
import { wordmark } from '@/lib/wordmark'

const PREVIEW_PIXELS = 220
const PNG_PIXELS = 1024

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.download = filename
  anchor.href = url
  anchor.click()
  URL.revokeObjectURL(url)
}

function savePNG(artwork: QrArtwork, filename: string) {
  const canvas = document.createElement('canvas')
  canvas.height = PNG_PIXELS
  canvas.width = PNG_PIXELS
  const context = canvas.getContext('2d')
  if (!context) return
  context.fillStyle = QR_BACKGROUND
  context.fillRect(0, 0, PNG_PIXELS, PNG_PIXELS)
  // The paths are in module units, so one scale puts the whole drawing — the
  // same one the SVG carries — into pixels.
  context.scale(PNG_PIXELS / artwork.size, PNG_PIXELS / artwork.size)
  context.fillStyle = QR_COLOUR
  context.fill(new Path2D(artwork.dataPath))
  context.fill(new Path2D(artwork.eyesPath), 'evenodd')
  context.translate(artwork.wordmark.x, artwork.wordmark.y)
  context.scale(artwork.wordmark.scale, artwork.wordmark.scale)
  context.fill(new Path2D(wordmark.path))
  canvas.toBlob((blob) => blob && save(blob, filename))
}

export default function ShortLinkQR() {
  const code = useFormFields(([fields]) => {
    const value = fields?.code?.value
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
  })
  // The admin is served from the same origin as the public site, so the
  // browser already knows the base of every short link. Read after mount so
  // the server-rendered markup and the first client render agree.
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])

  const url = code && origin ? `${origin}/${code}` : ''
  const artwork = useMemo(() => (url ? qrArtwork(url) : null), [url])

  if (!artwork)
    return (
      <div style={{ background: 'var(--theme-elevation-50)', borderRadius: 4, padding: 16 }}>
        Vul een code in om de QR-code te zien.
      </div>
    )

  return (
    <div style={{ background: 'var(--theme-elevation-50)', borderRadius: 4, padding: 16 }}>
      <svg
        aria-label={`QR-code voor ${url}`}
        height={PREVIEW_PIXELS}
        role="img"
        style={{ background: QR_BACKGROUND, borderRadius: 4, display: 'block' }}
        viewBox={`0 0 ${artwork.size} ${artwork.size}`}
        width={PREVIEW_PIXELS}
      >
        <path d={artwork.dataPath} fill={QR_COLOUR} shapeRendering="crispEdges" />
        <path d={artwork.eyesPath} fill={QR_COLOUR} fillRule="evenodd" />
        <g
          transform={`translate(${artwork.wordmark.x} ${artwork.wordmark.y}) scale(${artwork.wordmark.scale})`}
        >
          <path d={wordmark.path} fill={QR_COLOUR} />
        </g>
      </svg>
      <p style={{ margin: '12px 0', wordBreak: 'break-all' }}>
        <code>{url}</code>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn--style-secondary btn--size-small"
          onClick={() =>
            save(new Blob([qrSVG(artwork)], { type: 'image/svg+xml' }), `${code}-qr.svg`)
          }
          type="button"
        >
          Download SVG
        </button>
        <button
          className="btn btn--style-secondary btn--size-small"
          onClick={() => savePNG(artwork, `${code}-qr.png`)}
          type="button"
        >
          Download PNG
        </button>
      </div>
    </div>
  )
}
