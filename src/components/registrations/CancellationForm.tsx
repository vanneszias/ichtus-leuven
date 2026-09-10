'use client'

import { useEffect, useRef, useState } from 'react'

import type { Locale } from '@/lib/content'

export function CancellationForm({
  date,
  locale,
  status,
  title,
  token,
}: {
  date: string
  locale: Locale
  status: 'confirmed' | 'waitlisted'
  title: string
  token: string
}) {
  const [state, setState] = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const feedbackRef = useRef<HTMLParagraphElement>(null)
  const nl = locale === 'nl'

  // The cancel button unmounts on success, so focus moves to the
  // confirmation to keep keyboard and screen-reader users anchored.
  useEffect(() => {
    if (state === 'done') feedbackRef.current?.focus()
  }, [state])

  async function cancel() {
    setState('pending')
    try {
      const response = await fetch('/api/activity-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      setState(response.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div aria-busy={state === 'pending'} className="cancellation-form">
      <h2>{title}</h2>
      <p>
        <strong>{date}</strong>
      </p>
      {state !== 'done' && (
        <>
          <p>
            {status === 'confirmed'
              ? nl
                ? 'Je hebt momenteel een bevestigde plaats. Als je annuleert, geef je die plaats vrij. De eerstvolgende persoon op de wachtlijst kan automatisch bericht krijgen.'
                : 'You currently have a confirmed place. Cancelling releases that place. The next person on the waitlist may be notified automatically.'
              : nl
                ? 'Je staat momenteel op de wachtlijst. Als je annuleert, word je van de wachtlijst verwijderd.'
                : 'You are currently on the waitlist. Cancelling removes you from the waitlist.'}
          </p>
          <button
            className="button button--primary"
            disabled={state === 'pending'}
            onClick={cancel}
            type="button"
          >
            {state === 'pending'
              ? nl
                ? 'Annulering verwerken…'
                : 'Cancelling registration…'
              : nl
                ? 'Annuleer mijn inschrijving'
                : 'Cancel my registration'}
          </button>
        </>
      )}
      {/* This live region stays mounted for the whole lifecycle so screen
          readers reliably announce both error and success feedback. */}
      <div aria-live="polite">
        {state === 'error' && (
          <p className="form-feedback form-feedback--error" role="alert">
            {nl
              ? 'We konden de annulering niet verwerken. Vernieuw de pagina en probeer opnieuw.'
              : 'We could not process the cancellation. Refresh the page and try again.'}
          </p>
        )}
        {state === 'done' && (
          <p
            className="form-feedback form-feedback--confirmed"
            ref={feedbackRef}
            role="status"
            tabIndex={-1}
          >
            {nl ? 'Je inschrijving is geannuleerd.' : 'Your registration has been cancelled.'}
          </p>
        )}
      </div>
    </div>
  )
}
