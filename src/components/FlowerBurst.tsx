import { motion } from 'motion/react'
import { useEffect, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { haptics } from '../haptics'
import { sfx } from '../sound'
import { Flower, type FlowerType } from './flowers'
import type { Point } from './LockScreen'

// Ripple bloom: a ring of light ripples out from the envelope, and roses open in place as it passes.

const TYPES: FlowerType[] = (['red', 'black', 'white'] as const).flatMap((c) => [`${c}Rose`, `${c}Leaves`, `${c}Bud`] as const)

// Timing (seconds)
const START = 0.25 // first ripple leaves the envelope
const WAVE = 2.3 // time for the ripple to reach the farthest corner
const BLOOM = 0.9 // how long one rose takes to open
const HOLD = 1.3 // pause on the full bloom before fading out
const FADE_WAVE = 1.1 // the fade-out ripples outward over this long
const FADE = 0.8 // how long one rose takes to fall away

// Phones that report few cores or little memory get fewer, larger roses
const nav = navigator as Navigator & { deviceMemory?: number }
const LITE = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 3

const randomScale = (min: number, max: number) => min + Math.random() * (max - min)
// Mostly red, then black, some white; the odd leafy rose or bud
const randomColor = () => {
  const n = Math.random()
  return n < 0.45 ? 'red' : n < 0.78 ? 'black' : 'white'
}
const randomVariant = () => {
  const n = Math.random()
  return n < 0.16 ? 'Leaves' : n < 0.22 ? 'Bud' : 'Rose'
}

type Rose = { id: number; type: FlowerType; x: number; y: number; size: number; spin: number; delay: number; fade: number; z: number; sway: CSSProperties }

// A jittered honeycomb of roses covering the screen; each opens when the ripple reaches it.
function layout(origin: Point, width: number, height: number) {
  const base = Math.min(width, height) * (LITE ? 0.32 : 0.26)
  const gap = base * 0.58
  const reach = Math.max(...[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)))
  const speed = reach / WAVE
  const rows = Math.ceil(height / (gap * 0.87)) + 1
  const cols = Math.ceil(width / gap) + 1
  const roses: Rose[] = []
  for (let r = -1; r <= rows; r++) {
    for (let c = -1; c <= cols; c++) {
      const x = (c + (r % 2 ? 0.5 : 0)) * gap + (Math.random() - 0.5) * gap * 0.36
      const y = r * gap * 0.87 + (Math.random() - 0.5) * gap * 0.36
      const d = Math.hypot(x - origin.x, y - origin.y)
      roses.push({
        id: roses.length,
        type: `${randomColor()}${randomVariant()}` as FlowerType,
        x,
        y,
        size: base * randomScale(0.85, 1.35),
        spin: Math.random() * 360,
        delay: START + d / speed + Math.random() * 0.12,
        fade: (d / reach) * FADE_WAVE + Math.random() * 0.15,
        z: Math.floor(Math.random() * 100),
        // Swaying like a field in the wind: a wave rolls left to right
        sway: {
          '--amp': `${4 + Math.random() * 4}deg`,
          animationDuration: `${2.4 + Math.random() * 1.2}s`,
          animationDelay: `${-(1 - x / width) * 1.8 - Math.random() * 0.4}s`,
        } as CSSProperties,
      })
    }
  }
  return { roses, reach, duration: START + WAVE + BLOOM }
}

// Each rose drawing becomes an image once at startup, so the roses animate as cheap bitmaps.
function toImage(type: FlowerType) {
  const el = document.createElement('div')
  const root = createRoot(el)
  flushSync(() => root.render(<Flower type={type} />))
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(el.innerHTML)}`
  root.unmount()
  return url
}

const IMAGES = Object.fromEntries(TYPES.map((t) => [t, toImage(t)])) as Record<FlowerType, string>

export function FlowerBurst({ origin, onDone }: { origin: Point; onDone: () => void }) {
  const [{ roses, reach, duration }] = useState(() => layout(origin, innerWidth, innerHeight))

  useEffect(() => {
    sfx.bloom()
    haptics.ripple()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      sfx.petals()
      onDone()
    }, (duration + HOLD) * 1000)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  const at = { left: origin.x, top: origin.y }
  const ring = reach * 2.1

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      // The roses fall away in a ripple (see each rose's exit); the layer itself just clears at the end
      exit={{ opacity: 0, transition: { delay: FADE_WAVE + FADE - 0.1, duration: 0.3 } }}
      aria-hidden
    >
      {/* Soft light from the envelope */}
      <motion.div
        className="absolute size-[60vmin] rounded-full bg-[radial-gradient(circle,rgba(254,226,226,0.9)_0%,rgba(220,38,38,0.4)_35%,transparent_70%)]"
        style={{ ...at, x: '-50%', y: '-50%' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 2], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />

      {/* The ripples: the first one opens the roses as it passes; two softer echoes follow */}
      {[0, 0.45, 0.9].map((lag, i) => (
        <motion.div
          key={lag}
          className="absolute rounded-full border-2 border-rose-100/80 shadow-[0_0_24px_6px_rgba(252,165,165,0.45),inset_0_0_24px_6px_rgba(252,165,165,0.3)]"
          style={{ ...at, width: ring, height: ring, marginLeft: -ring / 2, marginTop: -ring / 2, zIndex: 300 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, i === 0 ? 0.95 : 0.5, 0.4, 0] }}
          transition={{ delay: START + lag, duration: WAVE * 1.05, ease: 'linear' }}
        />
      ))}

      {/* Roses open in place as the ripple reaches them */}
      {roses.map((r) => (
        <motion.div
          key={r.id}
          className="absolute will-change-transform"
          style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size, zIndex: r.z }}
          initial={{ scale: 0, opacity: 0, rotate: r.spin - 75 }}
          animate={{ scale: [0, 1.14, 1], opacity: 1, rotate: r.spin }}
          exit={{ scale: 0.4, opacity: 0, rotate: r.spin + 50, y: 30, transition: { delay: r.fade, duration: FADE, ease: 'easeIn' } }}
          transition={{ delay: r.delay, duration: BLOOM, ease: 'easeOut', times: [0, 0.65, 1], opacity: { delay: r.delay, duration: 0.25 } }}
        >
          <img src={IMAGES[r.type]} alt="" draggable={false} className="sway size-full max-w-none" style={r.sway} />
        </motion.div>
      ))}

      {/* Sparkles riding the wave front */}
      {Array.from({ length: LITE ? 14 : 24 }, (_, i) => {
        const a = (i * 137.5 * Math.PI) / 180
        const dist = reach * (0.45 + (i % 5) * 0.12)
        return (
          <motion.span
            key={`spark-${i}`}
            className="absolute size-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(254,205,211,0.9)]"
            style={{ ...at, zIndex: 400 }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: Math.cos(a) * dist, y: Math.sin(a) * dist, opacity: [0, 1, 0] }}
            transition={{ delay: START, duration: (dist / reach) * WAVE, ease: 'linear' }}
          />
        )
      })}
    </motion.div>
  )
}
