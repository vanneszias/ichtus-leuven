import { describe, expect, it } from 'vitest'

import { isAllowedOrigin } from '../../src/lib/registrationSecurity'

describe('registration request origin policy', () => {
  it('rejects malformed Origin headers without throwing', () => {
    expect(isAllowedOrigin({ headers: new Headers({ origin: 'not a url' }) })).toBe(false)
  })

  it('accepts local development origins', () => {
    expect(isAllowedOrigin({ headers: new Headers({ origin: 'http://localhost:3000' }) })).toBe(
      true,
    )
  })
})
