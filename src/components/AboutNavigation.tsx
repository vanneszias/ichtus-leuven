import Link from 'next/link'

import type { SectionNavigation } from '@/lib/content'

export function AboutNavigation({
  currentPath,
  navigation,
}: {
  currentPath: string
  navigation: SectionNavigation
}) {
  return (
    <nav aria-labelledby="about-nav-label" className="about-nav">
      <div className="container about-nav__inner">
        <span className="about-nav__label" id="about-nav-label">
          {navigation.title}
        </span>
        <ul>
          {navigation.items.map((item) => {
            const active = item.href === currentPath
            return (
              <li key={item.href}>
                <Link aria-current={active ? 'page' : undefined} href={item.href}>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
