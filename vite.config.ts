import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Link previews (Messenger, Zalo…) need an absolute image URL. On Vercel the production domain is
// available at build time; locally it falls back to a relative path.
function siteUrl(): Plugin {
  const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const url = domain ? `https://${domain}` : ''
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl()],
})
