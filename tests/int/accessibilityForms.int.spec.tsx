/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CancellationForm } from '../../src/components/registrations/CancellationForm'
import { RegistrationForm } from '../../src/components/registrations/RegistrationForm'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('accessible registration task states', () => {
  it('links localized validation errors and focuses the first invalid field', async () => {
    render(<RegistrationForm eventID={1} locale="nl" />)

    fireEvent.submit(screen.getByRole('button', { name: 'Schrijf me in' }).closest('form'))

    const name = screen.getByLabelText('Je naam')
    const email = screen.getByLabelText('E-mailadres')
    await waitFor(() => expect(document.activeElement).toBe(name))
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(name.getAttribute('aria-describedby')).toBe('registration-name-error')
    expect(document.querySelector('#registration-name-error')?.textContent).toBe('Vul je naam in.')
    expect(email.getAttribute('aria-invalid')).toBe('true')
    expect(document.querySelector('#registration-email-error')?.textContent).toBe(
      'Vul je e-mailadres in.',
    )
  })

  it('focuses a live service error after a valid signup submission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unable to register' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }),
      ),
    )
    render(<RegistrationForm eventID={1} locale="en" />)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Test Student' } })
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    })

    fireEvent.submit(screen.getByRole('button', { name: 'Register' }).closest('form'))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('We could not confirm your registration.')
    await waitFor(() => expect(document.activeElement).toBe(alert))
  })

  it('gives cancellation progress a descriptive name and busy state', async () => {
    let resolveRequest: ((response: Response) => void) | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve
          }),
      ),
    )
    render(
      <CancellationForm
        date="30 augustus 2026"
        locale="nl"
        status="waitlisted"
        title="Testactiviteit"
        token={'c'.repeat(64)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Annuleer mijn inschrijving' }))

    const pendingButton = await screen.findByRole('button', { name: 'Annulering verwerken…' })
    expect((pendingButton as HTMLButtonElement).disabled).toBe(true)
    expect(pendingButton.closest('.cancellation-form')?.getAttribute('aria-busy')).toBe('true')

    if (!resolveRequest) throw new Error('Cancellation request did not start')
    await act(async () =>
      resolveRequest(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    )
    expect((await screen.findByRole('status')).textContent).toBe('Je inschrijving is geannuleerd.')
  })
})
