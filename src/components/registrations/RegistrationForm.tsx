'use client'

import Link from 'next/link'
import Script from 'next/script'
import { type FormEvent, useEffect, useRef, useState } from 'react'

import type { Locale } from '@/lib/content'
import {
  type RegistrationFieldError,
  type RegistrationFieldErrors,
  validateRegistrationFields,
} from '@/lib/registrationValidation'

const messages = {
  en: {
    email: 'Email address',
    emailInvalid: 'Enter a valid email address.',
    emailRequired: 'Enter your email address.',
    emailTooLong: 'Use 254 characters or fewer for your email address.',
    error:
      'We could not confirm your registration. Check your inbox first, then try again with the same email address; an existing registration will remain active.',
    full: 'This activity is full and does not have an available waitlist place.',
    closed:
      'Registration is closed. Return to the activity page for the latest timing information.',
    fields: 'Some details could not be read. Check your name and email address and try again.',
    notFound:
      'This activity is no longer available for registration. Return to the activities overview to choose another activity.',
    request: 'We could not submit the form securely. Refresh the page and try again.',
    verification: 'The security check was not accepted. Complete the new check and try again.',
    verificationError: 'The security check could not load. Check your connection and try again.',
    verificationExpired: 'The security check expired. Try the check again.',
    verificationLoading: 'Loading the security check…',
    verificationReady: 'Security check complete.',
    verificationRetry: 'Try the security check again',
    name: 'Your name',
    nameRequired: 'Enter your name.',
    nameTooLong: 'Use 120 characters or fewer for your name.',
    privacy:
      'We only use these details to manage this activity. They are anonymized after twelve months.',
    submit: 'Register',
    submitting: 'Registering…',
    confirmed: 'Your place is confirmed. Check your inbox for the details.',
    waitlisted: 'You are on the waitlist. We will email you if a place opens up.',
    received: 'If this address is already registered, the existing registration remains active.',
  },
  nl: {
    email: 'E-mailadres',
    emailInvalid: 'Vul een geldig e-mailadres in.',
    emailRequired: 'Vul je e-mailadres in.',
    emailTooLong: 'Gebruik maximaal 254 tekens voor je e-mailadres.',
    error:
      'We konden je inschrijving niet bevestigen. Controleer eerst je inbox en probeer daarna opnieuw met hetzelfde e-mailadres; een bestaande inschrijving blijft actief.',
    full: 'Deze activiteit is vol en heeft geen beschikbare wachtlijstplaats.',
    closed:
      'De inschrijvingen zijn gesloten. Bekijk de activiteitspagina voor de meest recente timing.',
    fields:
      'Sommige gegevens konden niet worden gelezen. Controleer je naam en e-mailadres en probeer opnieuw.',
    notFound:
      'Deze activiteit is niet meer beschikbaar voor inschrijving. Kies een andere activiteit in het activiteitenoverzicht.',
    request:
      'We konden het formulier niet veilig versturen. Vernieuw de pagina en probeer opnieuw.',
    verification:
      'De beveiligingscontrole werd niet aanvaard. Voltooi de nieuwe controle en probeer opnieuw.',
    verificationError:
      'De beveiligingscontrole kon niet laden. Controleer je verbinding en probeer opnieuw.',
    verificationExpired: 'De beveiligingscontrole is verlopen. Probeer de controle opnieuw.',
    verificationLoading: 'De beveiligingscontrole wordt geladen…',
    verificationReady: 'De beveiligingscontrole is voltooid.',
    verificationRetry: 'Probeer de beveiligingscontrole opnieuw',
    name: 'Je naam',
    nameRequired: 'Vul je naam in.',
    nameTooLong: 'Gebruik maximaal 120 tekens voor je naam.',
    privacy:
      'We gebruiken deze gegevens alleen voor deze activiteit. Na twaalf maanden worden ze geanonimiseerd.',
    submit: 'Schrijf me in',
    submitting: 'Bezig met inschrijven…',
    confirmed: 'Je plaats is bevestigd. Bekijk je inbox voor de details.',
    waitlisted: 'Je staat op de wachtlijst. We mailen je als er een plaats vrijkomt.',
    received: 'Als dit adres al ingeschreven is, blijft de bestaande inschrijving actief.',
  },
}

type Result =
  | 'closed'
  | 'confirmed'
  | 'error'
  | 'fields'
  | 'full'
  | 'notFound'
  | 'received'
  | 'request'
  | 'verification'
  | 'waitlisted'

function errorResult(error?: string): Result {
  if (error === 'closed' || error === 'full' || error === 'notFound') return error
  if (error === 'Check the form fields') return 'fields'
  if (error === 'Verification failed') return 'verification'
  if (error === 'Invalid request') return 'request'
  return 'error'
}

type FieldMessages = Partial<Record<'email' | 'name', string>>

type TurnstileAPI = {
  remove(widgetID: string): void
  render(
    container: HTMLElement,
    options: {
      'error-callback': () => void
      'expired-callback': () => void
      callback: (token: string) => void
      sitekey: string
      size: 'flexible'
      theme: 'light'
    },
  ): string
  reset(widgetID: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI
  }
}

function localizeFieldErrors(
  errors: RegistrationFieldErrors,
  copy: (typeof messages)['en'],
): FieldMessages {
  return {
    email: errors.email ? copy[errors.email] : undefined,
    name: errors.name ? copy[errors.name] : undefined,
  }
}

export function RegistrationForm({
  eventID,
  locale,
  turnstileSiteKey,
}: {
  eventID: number
  locale: Locale
  turnstileSiteKey?: string
}) {
  const copy = messages[locale]
  const emailRef = useRef<HTMLInputElement>(null)
  const feedbackRef = useRef<HTMLParagraphElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetRef = useRef<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldMessages>({})
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [scriptAttempt, setScriptAttempt] = useState(0)
  const [turnstileState, setTurnstileState] = useState<'error' | 'expired' | 'loading' | 'ready'>(
    turnstileSiteKey ? 'loading' : 'ready',
  )
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    if (fieldErrors.name) nameRef.current?.focus()
    else if (fieldErrors.email) emailRef.current?.focus()
    else if (result) feedbackRef.current?.focus()
  }, [fieldErrors, result])

  useEffect(
    () => () => {
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetRef.current)
      }
    },
    [],
  )

  function renderTurnstile() {
    if (
      !turnstileSiteKey ||
      !turnstileContainerRef.current ||
      !window.turnstile ||
      turnstileWidgetRef.current
    )
      return
    turnstileWidgetRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      size: 'flexible',
      theme: 'light',
      callback: (token) => {
        setTurnstileToken(token)
        setTurnstileState('ready')
      },
      'error-callback': () => {
        setTurnstileToken('')
        setTurnstileState('error')
      },
      'expired-callback': () => {
        setTurnstileToken('')
        setTurnstileState('expired')
      },
    })
  }

  function resetTurnstile() {
    if (!turnstileSiteKey) return
    setTurnstileToken('')
    setTurnstileState('loading')
    if (turnstileWidgetRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetRef.current)
    } else {
      turnstileWidgetRef.current = null
      turnstileContainerRef.current?.replaceChildren()
      setScriptAttempt((attempt) => attempt + 1)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setResult(null)
    const form = new FormData(formElement)
    const email = String(form.get('email') || '')
    const name = String(form.get('name') || '')
    const validationErrors = validateRegistrationFields({ email, name })
    if (Object.keys(validationErrors).length) {
      setFieldErrors(localizeFieldErrors(validationErrors, copy))
      setResult('fields')
      return
    }

    setFieldErrors({})
    setPending(true)
    try {
      const response = await fetch('/api/activity-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventID,
          locale,
          name,
          email,
          website: form.get('website'),
          turnstileToken: turnstileToken || undefined,
        }),
      })
      const data = (await response.json()) as {
        error?: string
        fieldErrors?: Partial<Record<'email' | 'name', RegistrationFieldError>>
        status?: string
      }
      if (!response.ok) {
        if (data.fieldErrors && Object.keys(data.fieldErrors).length) {
          setFieldErrors(localizeFieldErrors(data.fieldErrors, copy))
          setResult('fields')
        } else setResult(errorResult(data.error))
      } else
        setResult(
          data.status === 'confirmed' || data.status === 'waitlisted' ? data.status : 'received',
        )
      if (response.ok) formElement.reset()
    } catch {
      setResult('error')
    } finally {
      resetTurnstile()
      setPending(false)
    }
  }

  const feedback = result ? copy[result] : null
  return (
    <>
      {turnstileSiteKey && (
        <Script
          id={`turnstile-script-${scriptAttempt}`}
          key={scriptAttempt}
          onError={() => {
            setTurnstileToken('')
            setTurnstileState('error')
          }}
          onReady={renderTurnstile}
          src={`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit${scriptAttempt ? `&retry=${scriptAttempt}` : ''}`}
          strategy="afterInteractive"
        />
      )}
      <form aria-busy={pending} className="registration-form" noValidate onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="registration-name">{copy.name}</label>
          <input
            aria-describedby={fieldErrors.name ? 'registration-name-error' : undefined}
            aria-invalid={fieldErrors.name ? true : undefined}
            autoComplete="name"
            id="registration-name"
            maxLength={120}
            name="name"
            ref={nameRef}
            required
            type="text"
          />
          {fieldErrors.name && (
            <p className="form-field__error" id="registration-name-error">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="registration-email">{copy.email}</label>
          <input
            aria-describedby={fieldErrors.email ? 'registration-email-error' : undefined}
            aria-invalid={fieldErrors.email ? true : undefined}
            autoComplete="email"
            id="registration-email"
            maxLength={254}
            name="email"
            ref={emailRef}
            required
            type="email"
          />
          {fieldErrors.email && (
            <p className="form-field__error" id="registration-email-error">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div aria-hidden="true" className="form-honeypot">
          <label htmlFor="registration-website">Website</label>
          <input autoComplete="off" id="registration-website" name="website" tabIndex={-1} />
        </div>
        {turnstileSiteKey && (
          <div className="turnstile-field">
            <div className="turnstile-widget" ref={turnstileContainerRef} />
            <p
              className={`turnstile-status turnstile-status--${turnstileState}`}
              role={turnstileState === 'error' || turnstileState === 'expired' ? 'alert' : 'status'}
            >
              {turnstileState === 'loading'
                ? copy.verificationLoading
                : turnstileState === 'ready'
                  ? copy.verificationReady
                  : turnstileState === 'expired'
                    ? copy.verificationExpired
                    : copy.verificationError}
            </p>
            {(turnstileState === 'error' || turnstileState === 'expired') && (
              <button className="turnstile-retry" onClick={resetTurnstile} type="button">
                {copy.verificationRetry}
              </button>
            )}
          </div>
        )}
        <p className="form-privacy">
          {copy.privacy}{' '}
          <Link href={`/${locale}/privacy`}>
            {locale === 'nl' ? 'Lees ons privacybeleid.' : 'Read our privacy policy.'}
          </Link>
        </p>
        <button
          className="button button--primary"
          disabled={pending || Boolean(turnstileSiteKey && !turnstileToken)}
          type="submit"
        >
          {pending ? copy.submitting : copy.submit}
        </button>
        <div>
          {feedback && (
            <p
              className={`form-feedback form-feedback--${result}`}
              ref={feedbackRef}
              role={
                result === 'confirmed' || result === 'waitlisted' || result === 'received'
                  ? 'status'
                  : 'alert'
              }
              tabIndex={-1}
            >
              {feedback}
            </p>
          )}
        </div>
      </form>
    </>
  )
}
