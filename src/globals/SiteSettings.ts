import type { GlobalConfig } from 'payload'

import { anyone, contentManagers } from '@/access'
import { linkFields } from '@/fields/link'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Website-instellingen',
  access: { read: anyone, update: contentManagers },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Merk',
          fields: [
            { name: 'siteName', type: 'text', defaultValue: 'Ichtus Leuven', required: true },
            { name: 'logo', type: 'upload', relationTo: 'media' },
            { name: 'footerLogo', type: 'upload', relationTo: 'media' },
            { name: 'logoAlt', type: 'text', localized: true, defaultValue: 'Ichtus Leuven' },
          ],
        },
        {
          label: 'Navigatie',
          fields: [
            {
              name: 'navigation',
              type: 'array',
              maxRows: 8,
              fields: [linkFields('link', true)],
            },
            { name: 'dutchLabel', type: 'text', defaultValue: 'nl' },
            { name: 'englishLabel', type: 'text', defaultValue: 'en' },
            { name: 'footerLine', type: 'text', localized: true },
            {
              name: 'footerLinks',
              type: 'array',
              maxRows: 8,
              fields: [linkFields('link', true)],
            },
          ],
        },
        {
          label: 'Contact & sociale media',
          fields: [
            { name: 'email', type: 'email' },
            { name: 'instagramUrl', type: 'text' },
            { name: 'whatsappUrl', type: 'text' },
            { name: 'facebookUrl', type: 'text' },
            { name: 'contactFormUrl', type: 'text' },
          ],
        },
        {
          label: 'Agenda',
          fields: [
            { name: 'calendarUrl', type: 'text' },
            {
              name: 'syncHelp',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/CalendarHelp',
                },
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'defaultDescription', type: 'textarea', localized: true },
            { name: 'defaultImage', type: 'upload', relationTo: 'media' },
          ],
        },
      ],
    },
  ],
}
