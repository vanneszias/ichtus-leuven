import Link from 'next/link'

import { Container, Section } from '@/components/ui/Section'
import type { Locale } from '@/lib/content'

export type RecoveryKind = 'error' | 'notFound'

export const recoveryContent = {
  en: {
    error: {
      body: 'We could not load this page. Try again, or return to the homepage.',
      heading: 'Something went wrong.',
      retry: 'Try again',
    },
    home: 'Back to the homepage',
    notFound: {
      body: 'The page you are looking for may have moved or no longer exists.',
      heading: 'This page could not be found.',
    },
  },
  nl: {
    error: {
      body: 'We konden deze pagina niet laden. Probeer opnieuw of ga terug naar de homepagina.',
      heading: 'Er ging iets mis.',
      retry: 'Probeer opnieuw',
    },
    home: 'Terug naar de homepagina',
    notFound: {
      body: 'De pagina die je zoekt is misschien verplaatst of bestaat niet meer.',
      heading: 'Deze pagina konden we niet vinden.',
    },
  },
} as const

export function RecoveryPage({
  kind,
  locale,
  retry,
}: {
  kind: RecoveryKind
  locale: Locale
  retry?: () => void
}) {
  const content = recoveryContent[locale]
  const message = content[kind]
  const liveRole = kind === 'error' ? 'alert' : undefined

  return (
    <main className="recovery-page" id="main-content" tabIndex={-1}>
      <Section as="div" className="recovery-page__section" spacing="spacious" theme="white">
        <Container className="recovery-page__content" width="narrow">
          <div role={liveRole}>
            <h1 id="recovery-heading" tabIndex={-1}>
              {message.heading}
            </h1>
            <p className="lead">{message.body}</p>
          </div>
          <div className="button-row">
            {kind === 'error' && retry && (
              <button className="button button--primary" onClick={retry} type="button">
                {content.error.retry}
              </button>
            )}
            <Link className="button button--secondary" href={`/${locale}`}>
              {content.home}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  )
}
