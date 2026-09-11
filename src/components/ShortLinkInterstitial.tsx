'use client'

import { useOpenPanel } from '@openpanel/nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Container, Section } from '@/components/ui/Section'
import type { Locale } from '@/lib/content'
import { shortLinkDestinationLabel } from '@/lib/shortLinks'

const COUNTDOWN_SECONDS = 5

const content = {
  en: {
    body: 'This short link takes you to:',
    continue: 'Yes, continue',
    countdown: (seconds: number) =>
      `You will be sent there automatically in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`,
    heading: 'Do you want to go to this page?',
    home: 'No, go to the homepage',
    stop: 'Stop the countdown',
    stopped: 'The countdown has stopped. Use the buttons above to choose.',
  },
  nl: {
    body: 'Deze korte link brengt je naar:',
    continue: 'Ja, ga verder',
    countdown: (seconds: number) =>
      `Je wordt over ${seconds} ${seconds === 1 ? 'seconde' : 'seconden'} automatisch doorgestuurd.`,
    heading: 'Wil je naar deze pagina gaan?',
    home: 'Nee, naar de homepagina',
    stop: 'Stop het aftellen',
    stopped: 'Het aftellen is gestopt. Kies hierboven wat je wil doen.',
  },
} as const

export function ShortLinkInterstitial({
  code,
  destination,
  locale,
}: {
  code: string
  destination: string
  locale: Locale
}) {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS)
  const [stopped, setStopped] = useState(false)
  const { track } = useOpenPanel()
  const text = content[locale]

  // `useOpenPanel` hands back a fresh closure on every render, so the event is
  // fired from an effect keyed on the link rather than on the function.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    track('shortlink_click', { code, destination })
  }, [code, destination])

  useEffect(() => {
    if (stopped) return
    if (remaining <= 0) {
      window.location.replace(destination)
      return
    }
    const timer = window.setTimeout(() => setRemaining((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [destination, remaining, stopped])

  return (
    <main className="recovery-page short-link" id="main-content" tabIndex={-1}>
      <Section as="div" className="recovery-page__section" spacing="spacious" theme="white">
        <Container className="recovery-page__content" width="narrow">
          <h1>{text.heading}</h1>
          <p className="lead">{text.body}</p>
          <p className="short-link__destination">{shortLinkDestinationLabel(destination)}</p>
          <div className="button-row">
            <a className="button button--primary" href={destination}>
              {text.continue}
            </a>
            <Link className="button button--secondary" href={`/${locale}`}>
              {text.home}
            </Link>
          </div>
          <p className="short-link__countdown">
            {stopped ? (
              text.stopped
            ) : (
              <>
                {text.countdown(remaining)}{' '}
                <button className="short-link__stop" onClick={() => setStopped(true)} type="button">
                  {text.stop}
                </button>
              </>
            )}
          </p>
        </Container>
      </Section>
    </main>
  )
}
