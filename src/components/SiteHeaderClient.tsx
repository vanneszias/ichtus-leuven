'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

export function SiteHeaderClient({
  closeLabel,
  logo,
  navigation,
  navigationLabel,
}: {
  closeLabel: string
  logo: ReactNode
  navigation: ReactNode
  navigationLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const focusWithinRef = useRef(false)
  const openRef = useRef(open)

  const setMenuOpen = (nextOpen: boolean) => {
    openRef.current = nextOpen
    setOpen(nextOpen)
    if (nextOpen) setHidden(false)
  }

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false)
    if (restoreFocus) window.requestAnimationFrame(() => menuButtonRef.current?.focus())
  }

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      headerRef.current?.querySelector<HTMLElement>('.nav a')?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    const siblings = Array.from(document.querySelectorAll<HTMLElement>('main, footer'))
    siblings.forEach((element) => {
      element.inert = true
    })
    return () =>
      siblings.forEach((element) => {
        element.inert = false
      })
  }, [open])

  useEffect(() => {
    let anchorY = window.scrollY
    let frame = 0
    const updateHeader = () => {
      const currentY = window.scrollY
      if (currentY <= 16 || openRef.current || focusWithinRef.current) {
        setHidden(false)
        anchorY = currentY
      } else if (Math.abs(currentY - anchorY) >= 10) {
        setHidden(currentY > anchorY)
        anchorY = currentY
      }
      frame = 0
    }
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHeader)
    }
    frame = window.requestAnimationFrame(updateHeader)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    // The handlers here are focus management for the mobile menu (reveal the
    // header on focus, Escape to close, Tab to cycle inside it), not a
    // pointer-only affordance, so no role is warranted.
    // biome-ignore lint/a11y/noStaticElementInteractions: focus management, see above
    <header
      className={`site-header${hidden ? ' site-header--hidden' : ''}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) focusWithinRef.current = false
      }}
      onFocus={() => {
        focusWithinRef.current = true
        setHidden(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && openRef.current) {
          event.preventDefault()
          closeMenu(true)
          return
        }
        if (event.key !== 'Tab' || !openRef.current || !headerRef.current) return
        const focusable = Array.from(
          headerRef.current.querySelectorAll<HTMLElement>('a, button:not([tabindex="-1"])'),
        ).filter((element) => getComputedStyle(element).visibility !== 'hidden')
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      ref={headerRef}
    >
      {logo}
      <button
        aria-controls="site-navigation"
        aria-expanded={open}
        className="menu-button"
        onClick={() => setMenuOpen(!open)}
        ref={menuButtonRef}
        type="button"
      >
        <span>{open ? closeLabel : 'menu'}</span>
        <span aria-hidden="true" className={`menu-icon${open ? ' menu-icon--open' : ''}`} />
      </button>
      {open && (
        <button
          aria-label={closeLabel}
          className="menu-scrim"
          onClick={() => closeMenu(true)}
          tabIndex={-1}
          type="button"
        />
      )}
      {/* Closing on click covers the keyboard too: activating one of the child
          links with Enter dispatches a click that bubbles to this handler. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: child links dispatch click on Enter, see above */}
      <nav
        aria-label={navigationLabel}
        className={`nav${open ? ' nav--open' : ''}`}
        id="site-navigation"
        onClick={() => setMenuOpen(false)}
      >
        {navigation}
      </nav>
    </header>
  )
}
