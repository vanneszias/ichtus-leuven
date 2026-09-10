'use client'

import { useParams } from 'next/navigation'

import { type RecoveryKind, RecoveryPage } from '@/components/RecoveryPage'

export function LocalizedRecoveryPage({ kind, retry }: { kind: RecoveryKind; retry?: () => void }) {
  const params = useParams<{ locale?: string }>()
  const locale = params?.locale === 'en' ? 'en' : 'nl'

  return <RecoveryPage kind={kind} locale={locale} retry={retry} />
}
