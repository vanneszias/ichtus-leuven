import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#ffffff',
    description: 'Ichtus Leuven, een christelijke studentengemeenschap in Leuven.',
    display: 'standalone',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    id: '/',
    lang: 'nl',
    name: 'Ichtus Leuven',
    short_name: 'Ichtus Leuven',
    start_url: '/nl',
    theme_color: '#1537b8',
  }
}
