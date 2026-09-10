import type { Access, FieldAccess } from 'payload'

export type UserRole = 'admin' | 'editor' | 'registrationManager'

export const hasRole = (user: unknown, roles: UserRole[]) => {
  const role = (user as { role?: UserRole } | null)?.role
  return Boolean(role && roles.includes(role))
}

export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const admins: Access = ({ req: { user } }) => hasRole(user, ['admin'])

function sameSecret(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

export const adminsOrFirstUser: Access = async ({ data, req }) => {
  if (hasRole(req.user, ['admin'])) return true
  if (req.user) return false
  if (process.env.NODE_ENV === 'production') {
    const expected = process.env.FIRST_USER_SETUP_SECRET?.trim()
    const expectedEmail = process.env.FIRST_USER_SETUP_EMAIL?.trim().toLowerCase()
    const supplied = req.headers.get('x-first-user-setup')
    const suppliedEmail = String(data?.email ?? '')
      .trim()
      .toLowerCase()
    if (
      !expected ||
      expected.length < 32 ||
      !expectedEmail ||
      suppliedEmail !== expectedEmail ||
      !supplied ||
      !sameSecret(supplied, expected)
    )
      return false
  }

  const { totalDocs } = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
    req,
  })

  return totalDocs === 0
}

export const contentManagers: Access = ({ req: { user } }) => hasRole(user, ['admin', 'editor'])

export const activityManagers: Access = ({ req: { user } }) =>
  hasRole(user, ['admin', 'editor', 'registrationManager'])

export const registrationManagers: Access = ({ req: { user } }) =>
  hasRole(user, ['admin', 'registrationManager'])

export const adminsField: FieldAccess = ({ req: { user } }) => hasRole(user, ['admin'])

export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}
