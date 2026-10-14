import { motion } from 'motion/react'
import { useEffect, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Flower, type FlowerType } from './flowers'
import type { Point } from './LockScreen'

const TYPES: FlowerType[] = ['blueRose', 'blackRose', 'blueLeaves', 'blackLeaves', 'blueBud', 'blackBud']

// Timing (seconds)
const RING_GAP = 0.18 // delay between one ring and the next
const SWEEP = 0.3 // each ring fills around the circle over this long
const TRAVEL = 1.7 // flight time of a single rose
const HOLD = 1.1 // pause on the full bloom before fading out

// Random colour (a little more blue than black) and the odd leafy rose or bud.
// Size varies from small to large; fillers stay a bit fuller so the gaps stay closed.
const randomScale = (min: number, max: number) => min + Math.random() * (max - min)
const randomColor = () => (Math.random() < 0.55 ? 'blue' : 'black')
const randomVariant = (allowBud: boolean) => {
  const n = Math.random()
  return n < 0.18 ? 'Leaves' : allowBud && n < 0.26 ? 'Bud' : 'Rose'
}

type Rose = { id: string; type: FlowerType; ring: number; angle: number; radius: number; size: number; spin: number; delay: number }

// Swaying like a field in the wind: roses further right start later, so a wave rolls across the
// screen, with a little randomness so it never looks mechanical.
function swayStyle(r: Rose, origin: Point, width: number) {
  const x = origin.x + r.radius * Math.cos((r.angle * Math.PI) / 180)
  const duration = 2.4 + Math.random() * 1.2
  return {
    '--amp': `${4 + Math.random() * 5}deg`,
    animationDuration: `${duration}s`,
    animationDelay: `${-(1 - x / width) * 1.8 - Math.random() * 0.4}s`,
  } as CSSProperties
}

// Concentric rings of roses, from the envelope outward until the screen is covered.
function layout(origin: Point, width: number, height: number) {
  const base = Math.min(width, height) * 0.26
  const spacing = base * 0.72
  const reach = Math.max(
    ...[[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)),
  )
  const rings = Math.ceil((reach + base / 2) / spacing)
  const roses: Rose[] = []
  const fillers: Rose[] = []

  for (let ring = 0; ring <= rings; ring++) {
    const radius = ring * spacing
    const count = ring === 0 ? 1 : Math.ceil((2 * Math.PI * radius) / (base * 0.72))
    const twist = ring * 17 // offset each ring so the roses don't line up in spokes
    for (let i = 0; i < count; i++) {
      roses.push({
        id: `${ring}-${i}`,
        type: `${randomColor()}${ring === 0 ? 'Leaves' : randomVariant(ring > 2)}` as FlowerType,
        ring,
        angle: (i * 360) / count + twist,
        radius,
        size: base * Math.min(1.35, 0.8 + ring * 0.07) * randomScale(0.65, 1.35),
        spin: Math.random() * 360 - 180,
        delay: 0.15 + ring * RING_GAP + (i / count) * SWEEP,
      })
    }

    // Filler roses underneath, halfway between this ring and the previous one and half a step
    // round, so they sit exactly in the gaps. They bloom in place as the ring above arrives.
    if (ring === 0) continue
    const fillRadius = (ring - 0.5) * spacing
    const fillCount = Math.ceil((2 * Math.PI * fillRadius) / (base * 0.62))
    for (let i = 0; i < fillCount; i++) {
      fillers.push({
        id: `f${ring}-${i}`,
        type: `${randomColor()}${randomVariant(false)}` as FlowerType,
        ring,
        angle: ((i + 0.5) * 360) / fillCount + twist,
        radius: fillRadius,
        size: base * Math.min(1.3, 0.85 + ring * 0.06) * randomScale(0.85, 1.3),
        spin: Math.random() * 360 - 180,
        delay: 0.15 + ring * RING_GAP + (i / fillCount) * SWEEP + TRAVEL * 0.35,
      })
    }
  }
  return { roses, fillers, rings, spacing, base, duration: 0.15 + rings * RING_GAP + SWEEP + TRAVEL }
}

// Each rose drawing becomes an image once at startup, so ~200 roses animate as cheap bitmaps.
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
  const [{ roses, fillers, rings, spacing, base, duration }] = useState(() => layout(origin, innerWidth, innerHeight))
  const [sway] = useState(() =>
    Object.fromEntries([...roses, ...fillers].map((r) => [r.id, swayStyle(r, origin, innerWidth)])),
  )

  useEffect(() => {
    const timer = setTimeout(onDone, (duration + HOLD) * 1000)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  const at = { left: origin.x, top: origin.y }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      style={{ transformOrigin: `${origin.x}px ${origin.y}px` }}
      exit={{ opacity: 0, scale: 1.12, filter: 'blur(14px)' }}
      transition={{ duration: 1.1 }}
      aria-hidden
    >
      {/* The whole bloom turns slowly around the envelope; rings stay centred on it, so the screen stays covered */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: `${origin.x}px ${origin.y}px` }}
        animate={{ rotate: 8 }}
        transition={{ duration: duration + HOLD, ease: 'easeInOut' }}
      >
      {/* Light blooming out of the envelope */}
      <motion.div
        className="absolute size-[60vmin] rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.9)_0%,rgba(59,130,246,0.35)_35%,transparent_70%)]"
        style={{ ...at, x: '-50%', y: '-50%' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.4, 2.2], opacity: [0, 1, 0] }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      />

      {/* Shockwave rings that lead each wave of roses */}
      {Array.from({ length: Math.ceil(rings / 2) + 1 }, (_, k) => {
        const ring = k * 2
        const d = (ring + 1) * spacing * 2 + base
        return (
          <motion.div
            key={`wave-${ring}`}
            className="absolute rounded-full border border-sky-200/70 shadow-[0_0_20px_rgba(125,211,252,0.5)]"
            style={{ ...at, width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1], opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.6, delay: 0.1 + ring * RING_GAP, ease: 'easeOut' }}
          />
        )
      })}

      {/* Filler roses bloom in place underneath, closing the gaps between the rings */}
      {fillers.map((f) => {
        const a = (f.angle * Math.PI) / 180
        return (
          <motion.div
            key={f.id}
            className="absolute will-change-transform"
            style={{
              width: f.size,
              height: f.size,
              left: origin.x + f.radius * Math.cos(a) - f.size / 2,
              top: origin.y + f.radius * Math.sin(a) - f.size / 2,
              zIndex: 500 - f.ring,
            }}
            initial={{ scale: 0, opacity: 0, rotate: f.spin - 90 }}
            animate={{ scale: 1, opacity: 1, rotate: f.spin }}
            transition={{ duration: 1.1, delay: f.delay, ease: [0.34, 1.3, 0.64, 1], opacity: { duration: 0.3, delay: f.delay } }}
          >
            <img src={IMAGES[f.type]} alt="" draggable={false} className="sway size-full max-w-none" style={sway[f.id]} />
          </motion.div>
        )
      })}

      {/* Roses spiral out along their ring: the wrapper turns while the rose slides outward */}
      {roses.map((r) => (
          <motion.div
            key={r.id}
            className="absolute size-0"
            style={{ ...at, zIndex: 1000 - r.ring }}
            initial={{ rotate: r.angle - 110 }}
            animate={{ rotate: r.angle }}
            transition={{ duration: TRAVEL, delay: r.delay, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute will-change-transform"
              style={{ width: r.size, height: r.size, left: -r.size / 2, top: -r.size / 2 }}
              initial={{ x: 0, scale: 0.15, opacity: 0, rotate: r.spin - 140 }}
              animate={{ x: r.radius, scale: 1, opacity: 1, rotate: r.spin }}
              transition={{
                duration: TRAVEL,
                delay: r.delay,
                ease: [0.22, 1, 0.36, 1],
                opacity: { duration: 0.3, delay: r.delay },
              }}
            >
              <img src={IMAGES[r.type]} alt="" draggable={false} className="sway size-full max-w-none" style={sway[r.id]} />
            </motion.div>
          </motion.div>
        ))}

      {/* Sparkles thrown ahead of the roses */}
      {Array.from({ length: 28 }, (_, i) => {
        const a = (i * 137.5 * Math.PI) / 180
        const dist = spacing * (2 + (i % 6))
        return (
          <motion.span
            key={`spark-${i}`}
            className="absolute size-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(191,219,254,0.9)]"
            style={at}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: Math.cos(a) * dist, y: Math.sin(a) * dist, opacity: [0, 1, 0], scale: [0, 1.4, 0.4] }}
            transition={{ duration: 1.8, delay: 0.2 + (i % 7) * 0.12, ease: 'easeOut' }}
          />
        )
      })}
      </motion.div>
    </motion.div>
  )
}
