export type RegistrationFieldError =
  | 'emailInvalid'
  | 'emailRequired'
  | 'emailTooLong'
  | 'nameRequired'
  | 'nameTooLong'

export type RegistrationFieldErrors = Partial<Record<'email' | 'name', RegistrationFieldError>>

export function validateRegistrationFields(input: {
  email?: unknown
  name?: unknown
}): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {}

  if (typeof input.name !== 'string' || !input.name.trim()) errors.name = 'nameRequired'
  else if (input.name.trim().length > 120) errors.name = 'nameTooLong'

  if (typeof input.email !== 'string' || !input.email.trim()) errors.email = 'emailRequired'
  else if (input.email.length > 254) errors.email = 'emailTooLong'
  else if (!/^\S+@\S+\.\S+$/.test(input.email)) errors.email = 'emailInvalid'

  return errors
}
