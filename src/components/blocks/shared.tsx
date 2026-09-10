import Image from 'next/image'

import { ButtonLink } from '@/components/ui/SmartLink'
import type { Locale } from '@/lib/content'
import type { SiteLink } from '@/lib/links'
import type { Media } from '@/payload-types'

export const lines = (value?: string | null) => (value || '').split('\n')

export function DisplayText({
  highlight,
  text,
}: {
  highlight?: string | null
  text?: string | null
}) {
  const textLines = lines(text)
  // Editors fill the highlight field with the words they want accented, which
  // is usually a phrase inside the heading rather than a whole line of it.
  const accent = highlight?.trim()
  return textLines.map((line, index) => {
    const start = accent ? line.indexOf(accent) : -1
    return (
      // The list is a static split of one string: it is never reordered or
      // mutated, and identical lines are legal, so the index belongs in the key.
      // biome-ignore lint/suspicious/noArrayIndexKey: static, non-reordered lines, see above
      <span key={`${line}-${index}`}>
        {accent && start >= 0 ? (
          <>
            {line.slice(0, start)}
            <span className="highlight">{accent}</span>
            {line.slice(start + accent.length)}
          </>
        ) : (
          line
        )}
        {index < textLines.length - 1 && <br />}
      </span>
    )
  })
}

export function ResponsiveMedia({
  className = '',
  media,
  priority = false,
  sizes = '(max-width: 680px) calc(100vw - 28px), (max-width: 1264px) 50vw, 600px',
}: {
  className?: string
  media?: number | Media | null
  priority?: boolean
  sizes?: string
}) {
  if (!media || typeof media === 'number' || !media.url) return null
  const alt = media.isDecorative ? '' : media.alt?.trim()
  if (!media.isDecorative && !alt) return null
  const x = media.focalPosition?.x ?? 50
  const y = media.focalPosition?.y ?? 50
  const width = media.width || 1200
  const height = media.height || 900
  return (
    <Image
      alt={alt || ''}
      className={className}
      // fetchPriority propagates into the hoisted preload link so the LCP
      // image is requested at high priority (Lighthouse lcp-discovery).
      fetchPriority={priority ? 'high' : undefined}
      height={height}
      loading={priority ? undefined : 'lazy'}
      priority={priority}
      sizes={sizes}
      src={media.url}
      // The explicit ratio keeps layouts stable (no CLS) even where CSS
      // sizes one dimension as auto, e.g. the photo showroom.
      style={{ aspectRatio: `${width} / ${height}`, objectPosition: `${x}% ${y}%` }}
      // OpenNext resolves relative optimized URLs through the static-assets
      // binding, while Payload serves these files dynamically from R2.
      unoptimized={media.url.startsWith('/api/media/file/')}
      width={width}
    />
  )
}

export function Buttons({
  locale,
  primary,
  secondary,
  inverse = false,
}: {
  inverse?: boolean
  locale: Locale
  primary?: SiteLink | null
  secondary?: SiteLink | null
}) {
  if (!primary?.label && !secondary?.label) return null
  return (
    <div className="button-row">
      <ButtonLink link={primary} locale={locale} variant={inverse ? 'inverse' : 'primary'} />
      <ButtonLink link={secondary} locale={locale} variant={inverse ? 'inverse' : 'secondary'} />
    </div>
  )
}
