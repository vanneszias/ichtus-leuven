'use client'

import { useDocumentInfo } from '@payloadcms/ui'

export default function RegistrationManagement() {
  const { id } = useDocumentInfo()
  if (!id)
    return (
      <div style={{ background: 'var(--theme-elevation-50)', borderRadius: 4, padding: 16 }}>
        Sla de activiteit eerst op om inschrijvingen te beheren.
      </div>
    )
  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        borderRadius: 4,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: 16,
      }}
    >
      <strong style={{ flexBasis: '100%' }}>Inschrijvingen</strong>
      <a href={`/admin/collections/registrations?where[event][equals]=${id}`}>
        Bekijk en beheer inschrijvingen
      </a>
      <a href={`/api/registration-export?event=${id}`}>Download CSV</a>
    </div>
  )
}
