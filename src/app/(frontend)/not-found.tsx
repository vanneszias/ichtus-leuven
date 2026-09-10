import { headers } from 'next/headers'

import { RecoveryPage } from '@/components/RecoveryPage'

export default async function NotFound() {
  const locale = (await headers()).get('x-site-locale') === 'en' ? 'en' : 'nl'

  return <RecoveryPage kind="notFound" locale={locale} />
}
