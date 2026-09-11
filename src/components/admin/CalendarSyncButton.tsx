'use client'

import { Button, toast } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type SyncResult = { hasMore?: boolean; error?: string; skipped?: number; synced?: number }

/**
 * Runs the same synchronisation the scheduler performs every hour, for the
 * editor who does not want to wait for the next run. The endpoint accepts the
 * signed-in session here, so no secret is exposed to the browser.
 */
export default function CalendarSyncButton() {
  const [running, setRunning] = useState(false)
  const router = useRouter()

  const synchronize = async () => {
    setRunning(true)
    try {
      const response = await fetch('/api/calendar/sync', {
        credentials: 'same-origin',
        method: 'POST',
      })
      const result = (await response.json()) as SyncResult

      if (!response.ok) {
        toast.error(result.error || 'Synchronisatie mislukt.')
        return
      }

      toast.success(
        `${result.synced ?? 0} activiteiten bijgewerkt, ${result.skipped ?? 0} overgeslagen.${
          result.hasMore ? ' Er wachten nog wijzigingen: synchroniseer opnieuw.' : ''
        }`,
      )
      router.refresh()
    } catch {
      toast.error('Synchronisatie mislukt.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'var(--theme-elevation-50)',
        borderRadius: 4,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
        marginBottom: 16,
        padding: 16,
      }}
    >
      <span>
        Google Calendar synchroniseert elk uur automatisch. Haal wijzigingen nu op als je niet wil
        wachten.
      </span>
      <Button
        buttonStyle="secondary"
        disabled={running}
        margin={false}
        onClick={synchronize}
        size="small"
      >
        {running ? 'Bezig met synchroniseren…' : 'Synchroniseer nu'}
      </Button>
    </div>
  )
}
