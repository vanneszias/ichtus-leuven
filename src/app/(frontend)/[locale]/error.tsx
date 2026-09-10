'use client'

import { useEffect } from 'react'

import { LocalizedRecoveryPage } from '@/components/LocalizedRecoveryPage'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    document.getElementById('recovery-heading')?.focus()
  }, [])

  return <LocalizedRecoveryPage kind="error" retry={reset} />
}
