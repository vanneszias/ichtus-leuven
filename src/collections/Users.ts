import type { CollectionConfig } from 'payload'

import { admins, adminsField, adminsOrFirstUser } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  access: {
    create: adminsOrFirstUser,
    delete: admins,
    read: admins,
    update: ({ id, req }) => Boolean(req.user && (req.user.id === id || req.user.role === 'admin')),
  },
  auth: true,
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      access: { create: adminsField, update: adminsField },
      options: [
        { label: 'Beheerder', value: 'admin' },
        { label: 'Contentredacteur', value: 'editor' },
        { label: 'Inschrijvingsbeheerder', value: 'registrationManager' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
