import { payloadSecret, siteURL } from '@/lib/runtimeConfig'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function deliveryKey() {
  const configured = process.env.REGISTRATION_DELIVERY_KEY
  if (configured && /^[a-f0-9]{64}$/i.test(configured)) {
    return crypto.subtle.importKey(
      'raw',
      Uint8Array.from(configured.match(/../g), (byte) => Number.parseInt(byte, 16)),
      'AES-GCM',
      false,
      ['encrypt', 'decrypt'],
    )
  }
  if (process.env.NODE_ENV === 'production')
    throw new Error('REGISTRATION_DELIVERY_KEY must contain 64 hexadecimal characters')
  const fallback = payloadSecret()
  const digest = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`registration-delivery:${fallback}`),
  )
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export async function hashToken(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createCancellationToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function encryptDeliveryPayload(value: { token?: string }) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await deliveryKey(),
    encoder.encode(JSON.stringify(value)),
  )
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`
}

export async function decryptDeliveryPayload(value: string | null | undefined) {
  if (!value) return {} as { token?: string }
  const [encodedIV, encodedPayload] = value.split('.')
  if (!encodedIV || !encodedPayload) throw new Error('Invalid registration delivery payload')
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(encodedIV) },
    await deliveryKey(),
    base64ToBytes(encodedPayload),
  )
  return JSON.parse(decoder.decode(decrypted)) as { token?: string }
}

export async function validateTurnstile(token: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return process.env.NODE_ENV !== 'production'
  if (!token || token.length > 2048) return false

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(8000),
    })
    const result = (await response.json()) as { success?: boolean }
    return result.success === true
  } catch {
    return false
  }
}

export function isAllowedOrigin(request: { headers: Headers }) {
  const origin = request.headers.get('origin')
  if (!origin) return process.env.NODE_ENV !== 'production'
  if (process.env.NODE_ENV === 'production') return origin === siteURL()
  try {
    return ['localhost', '127.0.0.1'].includes(new URL(origin).hostname)
  } catch {
    return false
  }
}
