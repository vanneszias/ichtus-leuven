import type { CollectionBeforeChangeHook } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { Events } from '../../src/collections/Events'

const save = Events.hooks?.beforeChange?.[0] as CollectionBeforeChangeHook

function update(data: Record<string, unknown>, totalDocs = 0) {
  const count = vi.fn().mockResolvedValue({ totalDocs })
  const result = save({
    context: {},
    data,
    originalDoc: {
      id: 42,
      _status: 'published',
      capacity: 20,
      registrationMode: 'internal',
    },
    req: { payload: { count } },
  } as unknown as Parameters<CollectionBeforeChangeHook>[0])
  return { count, result }
}

describe('saving event registration settings', () => {
  it.each(['none', 'external'])('allows switching to %s without active signups', async (mode) => {
    const { count, result } = update({ registrationMode: mode })
    await expect(result).resolves.toMatchObject({
      registrationMode: mode,
      confirmRegistrationClosure: false,
      registrationClosurePendingAt: expect.any(String),
      registrationClosureReason: 'modeChanged',
    })
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [{ event: { equals: 42 } }, { status: { in: ['confirmed', 'waitlisted'] } }],
        },
      }),
    )
  })

  it.each(['none', 'external'])(
    'requires explicit cancellation for active signups: %s',
    async (mode) => {
      const { result } = update({ registrationMode: mode }, 1)
      await expect(result).rejects.toMatchObject({
        status: 400,
        data: { errors: [{ path: 'confirmRegistrationClosure', message: expect.any(String) }] },
      })
    },
  )

  it('queues confirmed cancellations and resets the checkbox', async () => {
    const { result } = update({ registrationMode: 'none', confirmRegistrationClosure: true }, 1)
    await expect(result).resolves.toMatchObject({
      confirmRegistrationClosure: false,
      registrationClosurePendingAt: expect.any(String),
      registrationClosureReason: 'modeChanged',
    })
  })

  it('does not require cancellation for an unrelated edit', async () => {
    const { count, result } = update({ title: 'Startersactiviteit' }, 1)
    await expect(result).resolves.not.toHaveProperty('registrationClosurePendingAt')
    expect(count).not.toHaveBeenCalled()
  })

  it('points to capacity when reducing it below the confirmed signup count', async () => {
    const { result } = update({ capacity: 1 }, 2)
    await expect(result).rejects.toMatchObject({
      status: 400,
      data: { errors: [{ path: 'capacity', message: expect.any(String) }] },
    })
  })
})
