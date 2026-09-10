import { Logo } from '@/components/Logo'
import { SmartLink } from '@/components/ui/SmartLink'
import type { Locale } from '@/lib/content'
import { resolveLink } from '@/lib/links'
import type { SiteSetting } from '@/payload-types'

export function SiteFooter({ locale, settings }: { locale: Locale; settings: SiteSetting }) {
  const utilityLinks = settings.footerLinks?.filter(({ link }) => {
    const { href } = resolveLink(link, locale)

    return !href.includes('instagram.com') && !href.startsWith('mailto:')
  })

  return (
    <footer className="site-footer">
      <div className="footer container">
        <Logo footer locale={locale} settings={settings} small />
        {settings.footerLine && <p>{settings.footerLine}</p>}
        <div className="footer-meta">
          {utilityLinks && utilityLinks.length > 0 && (
            <nav aria-label={locale === 'nl' ? 'Voettekst' : 'Footer'} className="footer-links">
              {utilityLinks.map(({ id, link }) => (
                <SmartLink key={id} link={link} locale={locale} />
              ))}
            </nav>
          )}
          <a className="footer-credit" href="https://zias.be">
            <svg
              aria-hidden="true"
              className="footer-credit__logo"
              viewBox="0 0 30 28.2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0 1.17 6.14M7.44 1.44c7.83 1.81 6.74 3.26 2.8 4.7-4.09 1.65-5.42 5.05-5.27 10.9.67 8.68 7.47 11.22 12.5 11.15 6.2-.15 11.86-3.88 12.53-10.08M10.95 14.22c-.11.7-.12 3.73-.12 3.73m4.63-2.92c-1.38 1.32-.98 2.28-.22 2.92.8.66 1.35 1.08 3.44.52 1.13-1.44.56-2.54-.12-2.98-.65-.72-1.3-.97-1.62-.84l-1.48.38m4.01 0s-.41 3.17-.21 4.22m6.16-4.3c-1.77-.99-2.12.06-2.68 1.06-.19 1.56-.34 1.61 1.55 1.99 1.06 2.46-.22 2.8-2.3 2.01" />
            </svg>
            <span className="sr-only">
              {locale === 'nl' ? 'Website door zias.be' : 'Website by zias.be'}
            </span>
            <span aria-hidden="true" className="footer-credit__text">
              zias.be
            </span>
          </a>
        </div>
      </div>
    </footer>
  )
}
