'use client'

import { useFormFields } from '@payloadcms/ui'
import qrcode from 'qrcode-generator'
import { useEffect, useMemo, useState } from 'react'

/** Quiet zone in modules. Four is the specification minimum for a scan. */
const MARGIN = 4
const PNG_TARGET_PIXELS = 1024

function buildCode(url: string) {
  // Type 0 picks the smallest version that fits; correction level M keeps the
  // code readable when a poster gets a fold or a scuff across it.
  const code = qrcode(0, 'M')
  code.addData(url)
  code.make()
  const count = code.getModuleCount()
  const modules = Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, column) => code.isDark(row, column)),
  )
  const path = modules
    .flatMap((cells, row) => cells.map((dark, column) => (dark ? `M${column} ${row}h1v1h-1z` : '')))
    .join('')
  return { count, modules, path, size: count + MARGIN * 2 }
}

function svgMarkup(path: string, size: number) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * 8}" height="${size * 8}" shape-rendering="crispEdges">`,
    `<rect width="${size}" height="${size}" fill="#ffffff"/>`,
    `<path transform="translate(${MARGIN} ${MARGIN})" d="${path}" fill="#000000"/>`,
    '</svg>',
  ].join('')
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.download = filename
  anchor.href = url
  anchor.click()
  URL.revokeObjectURL(url)
}

function savePNG(modules: boolean[][], size: number, filename: string) {
  const scale = Math.max(1, Math.round(PNG_TARGET_PIXELS / size))
  const canvas = document.createElement('canvas')
  canvas.height = size * scale
  canvas.width = size * scale
  const context = canvas.getContext('2d')
  if (!context) return
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#000000'
  for (const [row, cells] of modules.entries())
    for (const [column, dark] of cells.entries())
      if (dark) context.fillRect((column + MARGIN) * scale, (row + MARGIN) * scale, scale, scale)
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
  const qr = useMemo(() => (url ? buildCode(url) : null), [url])

  if (!qr)
    return (
      <div style={{ background: 'var(--theme-elevation-50)', borderRadius: 4, padding: 16 }}>
        Vul een code in om de QR-code te zien.
      </div>
    )

  return (
    <div style={{ background: 'var(--theme-elevation-50)', borderRadius: 4, padding: 16 }}>
      <svg
        aria-label={`QR-code voor ${url}`}
        role="img"
        shapeRendering="crispEdges"
        style={{ background: '#ffffff', display: 'block', height: 200, width: 200 }}
        viewBox={`0 0 ${qr.size} ${qr.size}`}
      >
        <path d={qr.path} fill="#000000" transform={`translate(${MARGIN} ${MARGIN})`} />
      </svg>
      <p style={{ margin: '12px 0', wordBreak: 'break-all' }}>
        <code>{url}</code>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn--style-secondary btn--size-small"
          onClick={() =>
            save(
              new Blob([svgMarkup(qr.path, qr.size)], { type: 'image/svg+xml' }),
              `${code}-qr.svg`,
            )
          }
          type="button"
        >
          Download SVG
        </button>
        <button
          className="btn btn--style-secondary btn--size-small"
          onClick={() => savePNG(qr.modules, qr.size, `${code}-qr.png`)}
          type="button"
        >
          Download PNG
        </button>
      </div>
    </div>
  )
}
