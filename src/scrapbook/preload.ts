import { content } from '../content'
import { PARTS, WINDOWS } from './layout'

// Download the scrapbook's images while she's typing the passcode, so nothing pops in late.
export function preloadScrapbook() {
  const urls = [
    '/scrapbook/parts/background.jpg',
    ...Object.keys(PARTS).map((name) => `/scrapbook/parts/${name}.webp`),
    ...WINDOWS.polaroids.map((w) => `/scrapbook/parts/${w.mask}`),
    `/scrapbook/parts/${WINDOWS.camera.mask}`,
    ...content.photos.scratch,
    content.photos.heartFrame,
    ...content.photos.camera,
    content.letterImage,
  ].filter(Boolean)

  const load = () => {
    for (const url of new Set(urls)) {
      const img = new Image()
      img.decoding = 'async'
      img.src = url
    }
  }
  // Wait until the lock screen has painted, then fetch in the background
  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 1500 })
  else setTimeout(load, 600)
}
