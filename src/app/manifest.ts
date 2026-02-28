
import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zipp Super App',
    short_name: 'Zipp App',
    description: 'Your modular web super-app.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#688cc0',
    theme_color: '#688cc0',
    icons: [
        {
            "src": "/favicon.ico",
            "sizes": "64x64 32x32 24x24 16x16",
            "type": "image/x-icon"
        },
        {
            "src": "/icons/icon-72.png",
            "type": "image/png",
            "sizes": "72x72"
        },
        {
            "src": "/icons/icon-96.png",
            "type": "image/png",
            "sizes": "96x96"
        },
        {
            "src": "/icons/icon-128.png",
            "type": "image/png",
            "sizes": "128x128"
        },
        {
            "src": "/icons/icon-144.png",
            "type": "image/png",
            "sizes": "144x144"
        },
        {
            "src": "/icons/icon-152.png",
            "type": "image/png",
            "sizes": "152x152"
        },
        {
            "src": "/icons/icon-192.png",
            "type": "image/png",
            "sizes": "192x192"
        },
        {
            "src": "/icons/icon-384.png",
            "type": "image/png",
            "sizes": "384x384"
        },
        {
            "src": "/icons/icon-512.png",
            "type": "image/png",
            "sizes": "512x512"
        },
        {
            "src": "/icons/icon-192.png",
            "type": "image/png",
            "sizes": "192x192",
            "purpose": "any maskable"
        },
        {
            "src": "/icons/icon-512.png",
            "type": "image/png",
            "sizes": "512x512",
            "purpose": "any maskable"
        }
    ],
  }
}
