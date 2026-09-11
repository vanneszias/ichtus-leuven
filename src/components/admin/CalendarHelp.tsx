'use client'

export default function CalendarHelp() {
  return (
    <div style={{ background: 'var(--theme-elevation-50)', borderRadius: 4, padding: 16 }}>
      Google Calendar synchronisatie gebruikt <code>GOOGLE_CALENDAR_ID</code>,{' '}
      <code>GOOGLE_CALENDAR_API_KEY</code> en <code>CALENDAR_SYNC_SECRET</code> uit de Worker
      secrets. Laat Cloudflare Cron een POST-verzoek naar <code>/api/calendar/sync</code> sturen.
      Wil je niet op de volgende run wachten, gebruik dan “Synchroniseer nu” boven de lijst met
      Activiteiten.
    </div>
  )
}
