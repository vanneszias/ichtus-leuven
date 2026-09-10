import { formatEventDisplay } from '@/lib/eventDisplay'
import { emailConfig, siteURL } from '@/lib/runtimeConfig'
import type { Event, Registration } from '@/payload-types'

type EmailBinding = {
  send(message: {
    from: { email: string; name: string }
    headers?: Record<string, string>
    html: string
    replyTo?: string
    subject: string
    text: string
    to: string
  }): Promise<{ messageId: string }>
}

export type RegistrationEmailKind =
  | 'confirmed'
  | 'waitlisted'
  | 'cancelled'
  | 'promoted'
  | 'eventCancelled'
  | 'registrationClosed'
  | 'registrationChanged'

const copy = {
  en: {
    confirmed: ['You are registered', 'Your place is confirmed.'],
    waitlisted: [
      'You are on the waitlist',
      'The activity is full for now. We will email you automatically if a place opens up.',
    ],
    cancelled: ['Your registration was cancelled', 'Your place has been released.'],
    promoted: ['A place opened up', 'Good news: your registration is now confirmed.'],
    eventCancelled: [
      'The activity was cancelled',
      'Unfortunately, this activity will not take place. All registrations and waitlist entries have been cancelled automatically; you do not need to do anything.',
    ],
    registrationClosed: [
      'Registration was closed',
      'This activity is no longer published. Your registration on this website has been cancelled.',
    ],
    registrationChanged: [
      'Registration method changed',
      'Registration now happens another way. Your registration on this website has been cancelled; check the activity page for current details.',
    ],
    details: 'Activity details',
    cancel: 'Cancel registration',
  },
  nl: {
    confirmed: ['Je bent ingeschreven', 'Je plaats is bevestigd.'],
    waitlisted: [
      'Je staat op de wachtlijst',
      'De activiteit is momenteel vol. We mailen je automatisch als er een plaats vrijkomt.',
    ],
    cancelled: ['Je inschrijving is geannuleerd', 'Je plaats is opnieuw vrijgegeven.'],
    promoted: ['Er is een plaats vrijgekomen', 'Goed nieuws: je inschrijving is nu bevestigd.'],
    eventCancelled: [
      'De activiteit is geannuleerd',
      'Deze activiteit kan helaas niet doorgaan. Alle inschrijvingen en wachtlijstplaatsen zijn automatisch geannuleerd; je hoeft niets te doen.',
    ],
    registrationClosed: [
      'Inschrijving gesloten',
      'Deze activiteit is niet meer gepubliceerd. Je inschrijving via deze website is geannuleerd.',
    ],
    registrationChanged: [
      'Inschrijfmethode gewijzigd',
      'Inschrijven gebeurt nu op een andere manier. Je inschrijving via deze website is geannuleerd; bekijk de activiteitspagina voor de actuele informatie.',
    ],
    details: 'Details van de activiteit',
    cancel: 'Inschrijving annuleren',
  },
} as const

function escapeHTML(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character],
  )
}

export async function sendRegistrationEmail({
  event,
  kind,
  messageIdentity,
  registration,
  token,
}: {
  event: Event
  kind: RegistrationEmailKind
  messageIdentity: string
  registration: Registration
  token?: string
}) {
  const language = registration.locale === 'en' ? 'en' : 'nl'
  const messages = copy[language]
  const [subject, message] = messages[kind]
  const cancelURL = token ? `${siteURL()}/${language}/registration/cancel/${token}` : null
  const date = formatEventDisplay(event, language).detail
  const details = [date, event.location].filter(Boolean).join(' · ')
  const text = [
    `${subject}: ${event.title}`,
    message,
    `${messages.details}: ${details}`,
    cancelURL ? `${messages.cancel}: ${cancelURL}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  const html = `<div style="font-family:Arial,sans-serif;color:#1537b8;max-width:600px"><p style="font-size:12px;text-transform:uppercase">Ichtus Leuven</p><h1>${escapeHTML(subject)}</h1><h2>${escapeHTML(event.title)}</h2><p>${escapeHTML(message)}</p><p><strong>${escapeHTML(messages.details)}</strong><br>${escapeHTML(details)}</p>${cancelURL ? `<p><a href="${cancelURL}" style="background:#1537b8;color:white;padding:12px 18px;border-radius:99px;text-decoration:none">${escapeHTML(messages.cancel)}</a></p>` : ''}</div>`

  const context = await (
    globalThis as typeof globalThis & {
      __ichtusCloudflareContext?: Promise<{ env: { EMAIL?: EmailBinding } }>
    }
  ).__ichtusCloudflareContext
  const email = context?.env.EMAIL
  if (!email) throw new Error('Cloudflare Email Service is not configured')
  const sender = emailConfig()
  const messageID = `<${messageIdentity.replace(/[^a-zA-Z0-9._-]/g, '-')}@ichtus-leuven>`

  // Cloudflare accepts Message-ID for correlation but does not guarantee provider-side deduplication.
  return email.send({
    to: registration.email,
    from: { email: sender.fromAddress, name: sender.fromName },
    replyTo: sender.replyTo,
    headers: { 'Message-ID': messageID, 'X-Ichtus-Delivery-ID': messageIdentity },
    subject: `${subject} · ${event.title}`,
    text,
    html,
  })
}
