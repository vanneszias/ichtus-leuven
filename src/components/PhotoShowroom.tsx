'use client'

import type { ReactNode } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

type PhotoShowroomProps = {
  children: ReactNode
  label: string
  pauseLabel: string
  playLabel: string
  /** Localized template for the slide announcement, e.g. `Foto {index} van {total}`. */
  statusFormat: string
  total: number
}

export function PhotoShowroom({
  children,
  label,
  pauseLabel,
  playLabel,
  statusFormat,
  total,
}: PhotoShowroomProps) {
  const cursorRef = useRef<HTMLSpanElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [autoplay, setAutoplay] = useState(total > 1)
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [status, setStatus] = useState('')

  const closestSlide = (grid: HTMLElement, slides: HTMLElement[]) =>
    slides.reduce(
      (closest, slide, index) => {
        const distance = Math.abs(slide.offsetLeft - grid.offsetLeft - grid.scrollLeft)
        return distance < closest.distance ? { distance, index } : closest
      },
      { distance: Number.POSITIVE_INFINITY, index: 0 },
    ).index

  const move = (direction: -1 | 1, announce = false) => {
    const grid = gridRef.current
    if (!grid) return
    const slides = Array.from(grid.querySelectorAll<HTMLElement>('figure'))
    if (slides.length < 2) return

    const target = (closestSlide(grid, slides) + direction + slides.length) % slides.length

    // Only user-initiated moves are announced; announcing every autoplay
    // advance would interrupt screen-reader users elsewhere on the page.
    if (announce)
      setStatus(
        statusFormat
          .replace('{index}', String(target + 1))
          .replace('{total}', String(slides.length)),
      )

    grid.scrollTo({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      left: slides[target].offsetLeft - grid.offsetLeft,
    })
  }

  const autoplayNext = useEffectEvent(() => move(1))

  const positionPointerControl = (clientX: number, clientY: number, target: EventTarget | null) => {
    const cursor = cursorRef.current
    const showroom = gridRef.current?.parentElement
    const targetMedia = target instanceof Element ? target.closest('.photo-story__media') : null
    const media =
      targetMedia ||
      Array.from(gridRef.current?.querySelectorAll<HTMLElement>('.photo-story__media') || []).find(
        (item) => {
          const bounds = item.getBoundingClientRect()
          return (
            clientX >= bounds.left &&
            clientX <= bounds.right &&
            clientY >= bounds.top &&
            clientY <= bounds.bottom
          )
        },
      )
    if (!cursor || !showroom || !(media instanceof HTMLElement)) {
      if (cursor) cursor.style.opacity = '0'
      return null
    }

    const mediaBounds = media.getBoundingClientRect()
    const imageBounds = media.querySelector('img')?.getBoundingClientRect() || mediaBounds
    const showroomBounds = showroom.getBoundingClientRect()
    const direction = clientX < imageBounds.left + imageBounds.width / 2 ? -1 : 1
    cursor.dataset.direction = direction === -1 ? 'previous' : 'next'
    cursor.style.opacity = '1'
    cursor.style.transform = `translate3d(${clientX - showroomBounds.left - 36}px, ${clientY - showroomBounds.top - 36}px, 0)`
    return direction as -1 | 1
  }

  useEffect(() => {
    if (!autoplay || focused || hovered) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stopOnReduce = () => {
      if (reducedMotion.matches) setAutoplay(false)
    }
    reducedMotion.addEventListener('change', stopOnReduce)
    if (reducedMotion.matches) {
      return () => reducedMotion.removeEventListener('change', stopOnReduce)
    }

    const interval = window.setInterval(() => {
      if (!document.hidden) autoplayNext()
    }, 6000)
    return () => {
      reducedMotion.removeEventListener('change', stopOnReduce)
      window.clearInterval(interval)
    }
  }, [autoplay, focused, hovered])

  return (
    // Click-to-advance is a pointer-only enhancement: the position of the
    // pointer picks the direction. Keyboard users advance with ArrowLeft and
    // ArrowRight on the focusable region below, so there is no key equivalent
    // to add here.
    // biome-ignore lint/a11y/noStaticElementInteractions: pointer-only enhancement, see above
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled by the region below
    <div
      className="photo-showroom"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      onFocus={() => setFocused(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        if (cursorRef.current) cursorRef.current.style.opacity = '0'
      }}
      onMouseMove={(event) => positionPointerControl(event.clientX, event.clientY, event.target)}
      onClick={(event) => {
        if ((event.target as Element).closest('button')) return
        const direction = positionPointerControl(event.clientX, event.clientY, event.target)
        if (direction) move(direction, true)
      }}
    >
      <section
        aria-label={label}
        className="photo-story__grid"
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
          if (event.target !== event.currentTarget) return
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault()
            move(event.key === 'ArrowLeft' ? -1 : 1, true)
          }
        }}
        ref={gridRef}
        // A horizontally scrollable region must stay focusable so its arrow-key
        // handler is reachable without a pointer (WCAG 2.1.1).
        // biome-ignore lint/a11y/noNoninteractiveTabindex: scroll region must be keyboard focusable
        tabIndex={0}
      >
        {children}
      </section>
      {total > 1 && (
        <button
          aria-label={autoplay ? pauseLabel : playLabel}
          className="photo-showroom__autoplay"
          onClick={() => setAutoplay((playing) => !playing)}
          type="button"
        >
          {autoplay ? (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M8 6v12M16 6v12" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 6 9 6-9 6Z" />
            </svg>
          )}
        </button>
      )}
      <p aria-live="polite" className="sr-only" role="status">
        {status}
      </p>
      <span aria-hidden="true" className="photo-showroom__pointer" ref={cursorRef}>
        <svg aria-hidden="true" viewBox="0 0 32 32">
          <path className="photo-showroom__pointer-previous" d="M19.5 7.5 11 16l8.5 8.5M11 16h13" />
          <path className="photo-showroom__pointer-next" d="m12.5 7.5 8.5 8.5-8.5 8.5M8 16h13" />
        </svg>
      </span>
    </div>
  )
}
