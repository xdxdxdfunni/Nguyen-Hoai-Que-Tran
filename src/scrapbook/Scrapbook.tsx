import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { content } from '../content'
import { haptics } from '../haptics'
import { sfx, voice } from '../sound'
import { DESIGN, PARTS, WINDOWS, type PartName } from './layout'
import { CdPlayer } from './CdPlayer'
import { LetterModal } from './LetterModal'
import { LoveListModal } from './LoveListModal'
import { Photo } from './Photo'
import { ScratchPhoto } from './ScratchPhoto'

const PART_URL = (name: string) => `/scrapbook/parts/${name}.webp`
const MASK_URL = (file: string) => `/scrapbook/parts/${file}`
const CONFETTI = ['#B91C1C', '#7F1D1D', '#111111', '#F5E6D3', '#E8B04A']

// Design px → % of the 1080×2340 canvas, so everything scales with the page.
type Rect = readonly [number, number, number, number]
const place = ([x, y, w, h]: Rect): CSSProperties => ({
  left: `${(x / DESIGN.width) * 100}%`,
  top: `${(y / DESIGN.height) * 100}%`,
  width: `${(w / DESIGN.width) * 100}%`,
  height: `${(h / DESIGN.height) * 100}%`,
})
// Design px → container width units (the page is a size container)
const u = (px: number) => `${(px / DESIGN.width) * 100}cqw`
const rectOf = (r: { x: number; y: number; w: number; h: number }): Rect => [r.x, r.y, r.w, r.h]

// Stable pseudo-random numbers per name, so ambient timings differ but never change between renders.
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) / 4294967296

type Ambient = 'float' | 'twinkle' | 'wiggle' | 'rock' | 'spin' | 'flap' | { sway: number; origin: string } | { heart: { amp: number; dx: number; speed: number; delay: number } }
type Piece = { name: PartName; paper?: boolean; ambient?: Ambient; z: number }

// Papers land first, in this order; stickers pop on afterwards from top to bottom.
const PAPERS: Piece[] = [
  { name: 'script-scrap', paper: true, z: 1 },
  { name: 'notepad', paper: true, z: 2 },
  { name: 'polaroids', paper: true, z: 6 },
  { name: 'letter-paper', paper: true, z: 2 },
  { name: 'grid-paper', paper: true, z: 2 },
  { name: 'camera', paper: true, z: 6 },
  { name: 'clip-paper', paper: true, z: 2 },
  { name: 'newspaper', paper: true, z: 1 },
]
const STICKERS: Piece[] = (
  [
    { name: 'fish', ambient: 'wiggle', z: 8 },
    { name: 'rose-strip', ambient: { sway: 1.5, origin: '50% 50%' }, z: 7 },
    { name: 'cat', ambient: 'wiggle', z: 8 },
    { name: 'zap-1', ambient: 'twinkle', z: 8 },
    { name: 'zap-2', ambient: 'twinkle', z: 8 },
    { name: 'zap-3', ambient: 'twinkle', z: 8 },
    { name: 'red-stars', ambient: 'twinkle', z: 8 },
    { name: 'heart-1', ambient: { heart: { amp: 12, dx: 8, speed: 2.6, delay: 0 } }, z: 8 },
    { name: 'heart-2', ambient: { heart: { amp: -9, dx: -11, speed: 3.5, delay: 1.1 } }, z: 8 },
    { name: 'heart-3', ambient: { heart: { amp: 16, dx: 5, speed: 2.1, delay: 0.5 } }, z: 8 },
    { name: 'star-sticker', ambient: 'rock', z: 8 },
    { name: 'bouquet', ambient: { sway: 3, origin: '50% 100%' }, z: 8 },
    { name: 'flower-stem', ambient: { sway: 4, origin: '50% 100%' }, z: 8 },
    { name: 'sparkle-1', ambient: 'twinkle', z: 8 },
    { name: 'sparkle-2', ambient: 'twinkle', z: 8 },
    { name: 'gray-flower-1', ambient: 'spin', z: 8 },
    { name: 'gray-flower-2', ambient: 'spin', z: 8 },
    { name: 'gray-flower-3', ambient: 'spin', z: 8 },
    { name: 'yellow-mark-1', ambient: 'twinkle', z: 8 },
    { name: 'yellow-mark-2', ambient: 'twinkle', z: 8 },
    { name: 'dog', ambient: 'wiggle', z: 8 },
    { name: 'sparkle-3', ambient: 'twinkle', z: 8 },
    { name: 'sparkle-4', ambient: 'twinkle', z: 8 },
  ] satisfies Piece[]
).sort((a, b) => PARTS[a.name][1] - PARTS[b.name][1])

const PAPER_START = 0.3
const PAPER_GAP = 0.28
const STICKER_START = PAPER_START + PAPERS.length * PAPER_GAP + 0.2
const STICKER_GAP = 0.07
const delayOf = new Map<PartName, number>([
  ...PAPERS.map((p, i) => [p.name, PAPER_START + i * PAPER_GAP] as const),
  ...STICKERS.map((p, i) => [p.name, STICKER_START + i * STICKER_GAP] as const),
])
const ALL_IN = STICKER_START + STICKERS.length * STICKER_GAP + 0.6

function ambientProps(name: string, ambient?: Ambient): { className: string; style: CSSProperties } {
  const r = hash(name)
  if (!ambient) return { className: '', style: {} }
  if (typeof ambient === 'object' && 'heart' in ambient) {
    const { amp, dx, speed, delay } = ambient.heart
    return {
      className: 'amb-heart',
      style: { '--amp': `${amp}deg`, '--dx': `${dx}%`, animationDuration: `${speed}s`, animationDelay: `${-delay}s` } as CSSProperties,
    }
  }
  if (typeof ambient === 'object')
    return {
      className: 'sway',
      style: { '--amp': `${ambient.sway}deg`, transformOrigin: ambient.origin, animationDuration: `${2.8 + r * 1.4}s`, animationDelay: `${-r * 3}s` } as CSSProperties,
    }
  return { className: `amb-${ambient}`, style: { animationDelay: `${-r * 4}s`, animationDuration: ambient === 'spin' ? `${30 + r * 30}s` : undefined } }
}

function PieceImage({ piece }: { piece: Piece }) {
  const { name, paper, ambient, z } = piece
  const delay = delayOf.get(name) ?? 0
  const r = hash(name)
  const amb = ambientProps(name, ambient)
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ ...place(PARTS[name]), zIndex: z }}
      initial={paper ? { opacity: 0, y: '-12%', rotate: (r - 0.5) * 16, scale: 1.12 } : { opacity: 0, scale: 0.2, rotate: -25 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={
        paper
          ? { delay, type: 'spring', stiffness: 110, damping: 15, opacity: { delay, duration: 0.25 } }
          : { delay, type: 'spring', stiffness: 380, damping: 14, opacity: { delay, duration: 0.15 } }
      }
    >
      <img src={PART_URL(name)} alt="" draggable={false} className={`size-full select-none ${amb.className}`} style={amb.style} />
    </motion.div>
  )
}

// Fades an overlay in once the paper underneath has landed.
function After({ part, extra = 0.45, z, rect, children, className = '', style }: { part: PartName; extra?: number; z: number; rect: Rect; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ ...place(rect), zIndex: z, ...style }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: (delayOf.get(part) ?? 0) + extra, duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

// Handwriting that writes itself left to right.
function Written({ children, delay, duration = 1.2, font = 'font-hand', className = '', style }: { children: ReactNode; delay: number; duration?: number; font?: 'font-hand' | 'font-note'; className?: string; style?: CSSProperties }) {
  return (
    <motion.div
      className={`${font} ${className}`}
      style={style}
      initial={{ clipPath: 'inset(-20% 100% -20% 0)' }}
      animate={{ clipPath: 'inset(-20% 0% -20% 0)' }}
      transition={{ delay, duration, ease: 'linear' }}
    >
      {children}
    </motion.div>
  )
}

function burstAt(el: Element | null, opts: confetti.Options = {}) {
  const box = el?.getBoundingClientRect()
  const origin = box ? { x: (box.left + box.width / 2) / innerWidth, y: (box.top + box.height / 2) / innerHeight } : { x: 0.5, y: 0.5 }
  const heart = confetti.shapeFromPath({ path: 'M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3.5-3 7-10 13Z' })
  confetti({ particleCount: 40, spread: 70, startVelocity: 22, scalar: 1.1, origin, colors: CONFETTI, shapes: [heart, 'circle'], ...opts })
}

type FloatingHeart = { id: number; x: number; drift: number; size: number }

export function Scrapbook() {
  const [letterOpen, setLetterOpen] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [print, setPrint] = useState(-1)
  const [flash, setFlash] = useState(0)
  const [loveOpen, setLoveOpen] = useState(false)
  const [hearts, setHearts] = useState<FloatingHeart[]>([])
  const [butterflyHop, setButterflyHop] = useState(0)
  const heartFrameRef = useRef<HTMLDivElement>(null)
  const scratchRefs = useRef<(HTMLDivElement | null)[]>([])

  // Sounds for the scrapbook being put together
  useEffect(() => {
    const timers = [...PAPERS, ...STICKERS].map((p) => window.setTimeout(p.paper ? sfx.paper : sfx.pop, (delayOf.get(p.name) ?? 0) * 1000 + 120))
    return () => timers.forEach(clearTimeout)
  }, [])

  const cameraPhotos = content.photos.camera.length ? content.photos.camera : ['', '', '']
  const takePhoto = () => {
    sfx.shutter()
    haptics.shutter()
    setFlash((f) => f + 1)
    setPrint((p) => (p + 1) % cameraPhotos.length)
  }

  const heartPop = () => {
    sfx.hearts()
    haptics.soft()
    const id = Date.now()
    setHearts((h) => [
      ...h.slice(-12),
      ...Array.from({ length: 6 }, (_, i) => ({ id: id + i, x: 15 + ((i * 37) % 70), drift: ((i * 53) % 40) - 20, size: 5 + (i % 3) * 2 })),
    ])
  }

  const openLoveList = () => {
    sfx.flip()
    haptics.flip()
    setLoveOpen(true)
  }

  const openLetter = () => {
    sfx.paper()
    haptics.flip()
    voice.start() // must happen inside the tap for iPhones
    setLetterOpen(true)
  }

  const letterRect: Rect = [432, 930, 372, 310]
  const letterHintRect: Rect = [440, 1305, 360, 80]
  const notepadRect: Rect = [236, 205, 346, 290]
  const noteRect: Rect = [40, 1895, 420, 300]
  const cameraButton: Rect = [PARTS.camera[0], PARTS.camera[1], PARTS.camera[2], 205]
  const hf = WINDOWS.heartFrame
  const heartRect: Rect = [hf.x + 4, hf.y + 4, hf.w - 8, hf.h - 8]

  return (
    <main className="flex min-h-svh flex-col items-center bg-[#0a0304]">
      {/* Full screen: the design is scaled to fit and centred; whatever space the phone's shape leaves
          around it is filled with the same red paper, and pieces at the edges carry on into it. */}
      <div className="relative flex h-svh w-full items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/scrapbook/parts/background.jpg)' }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <div
          className="relative w-[min(100vw,calc(100svh*1080/2340))] [container-type:inline-size]"
          style={{ aspectRatio: `${DESIGN.width} / ${DESIGN.height}` }}
        >

          {PAPERS.map((p) => (
            <PieceImage key={p.name} piece={p} />
          ))}

          {/* Notepad: her full name, the gingham heart, then his name and the date */}
          <After part="notepad" z={3} rect={notepadRect} extra={0.5} className="flex flex-col items-center justify-between text-center">
            <Written delay={(delayOf.get('notepad') ?? 0) + 0.7} duration={1.3} className="font-bold whitespace-nowrap text-[#9b1c24]" style={{ fontSize: u(40), lineHeight: 1.2 }}>
              {content.fullName}
            </Written>
            <motion.img
              src="/scrapbook/parts/gingham-heart.webp"
              alt=""
              draggable={false}
              style={{ width: u(104) }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [0, 1.2, 1, 1.1, 1, 1.08, 1], rotate: [-20, 0, -6, 0, 0, 0, 0] }}
              transition={{
                delay: (delayOf.get('notepad') ?? 0) + 1.6,
                duration: 3,
                times: [0, 0.12, 0.25, 0.6, 0.68, 0.76, 1],
                repeat: Infinity,
                repeatDelay: 0.8,
              }}
            />
            <div>
              <Written delay={(delayOf.get('notepad') ?? 0) + 2.2} duration={1.1} className="font-bold whitespace-nowrap text-[#3b1414]" style={{ fontSize: u(36), lineHeight: 1.2 }}>
                {content.fromFullName}
              </Written>
              <Written delay={(delayOf.get('notepad') ?? 0) + 3.1} duration={0.7} font="font-note" className="text-[#9b1c24]" style={{ fontSize: u(32), lineHeight: 1.3 }}>
                {content.date}
              </Written>
            </div>
          </After>

          {/* Polaroids: scratch to reveal (photos sit under the frames, cut to each window's shape) */}
          {WINDOWS.polaroids.map((w, i) => (
            <After key={w.mask} part="polaroids" z={5} rect={rectOf(w)} extra={0.3}>
              <div
                ref={(el) => {
                  scratchRefs.current[i] = el
                }}
                className="size-full"
                style={{ maskImage: `url(${MASK_URL(w.mask)})`, maskSize: '100% 100%', WebkitMaskImage: `url(${MASK_URL(w.mask)})`, WebkitMaskSize: '100% 100%' }}
              >
                <ScratchPhoto
                  src={content.photos.scratch[i] ?? ''}
                  label={`ảnh ${i + 1}`}
                  coating="cào nhẹ nè"
                  onReveal={() => {
                    sfx.sparkle()
                    haptics.reveal()
                    burstAt(scratchRefs.current[i])
                  }}
                  onOpen={() => setLightbox(content.photos.scratch[i] || `placeholder:ảnh ${i + 1}`)}
                />
              </div>
            </After>
          ))}

          {/* Letter teaser on the lined paper; tap to open the full letter */}
          <After part="letter-paper" z={3} rect={letterRect} extra={0.6}>
            <button type="button" onClick={openLetter} className="block size-full cursor-pointer overflow-hidden text-left" aria-label="Đọc thư">
              <Written delay={(delayOf.get('letter-paper') ?? 0) + 0.9} className="font-bold text-[#9b1c24]" style={{ fontSize: u(40), lineHeight: 1.25 }}>
                {content.letter[0]}
              </Written>
              {/* The start of the letter, fading out — the full letter opens on tap */}
              <Written
                delay={(delayOf.get('letter-paper') ?? 0) + 1.6}
                duration={1.6}
                font="font-note"
                className="text-[#2b1414] [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]"
                style={{ fontSize: u(31), lineHeight: 1.42, marginTop: u(8) }}
              >
                {content.letter[1]}
              </Written>
            </button>
          </After>
          <After part="letter-paper" z={3} rect={letterHintRect} extra={0.6}>
            <button
              type="button"
              onClick={openLetter}
              className="flex size-full cursor-pointer items-center"
              aria-label="Đọc thư"
            >
              <motion.span
                className="font-hand rounded-full bg-[#7a1f1f] text-[#FBF7EE] shadow-md"
                style={{ fontSize: u(34), padding: `${u(8)} ${u(26)}` }}
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, delay: ALL_IN }}
              >
                Chạm để đọc thư
              </motion.span>
            </button>
          </After>

          {/* Pink heart frame photo with a passing shine; tap for floating hearts */}
          <After part="grid-paper" z={3} rect={heartRect} extra={0.5}>
            <div ref={heartFrameRef} className="amb-shine relative size-full cursor-pointer overflow-hidden" onClick={heartPop}>
              <Photo src={content.photos.heartFrame} label="ảnh của hai đứa" />
              {hearts.map((h) => (
                <motion.svg
                  key={h.id}
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute bottom-0 fill-[#e11d48]"
                  style={{ left: `${h.x}%`, width: `${h.size * 3}%` }}
                  initial={{ y: 0, x: 0, opacity: 1, scale: 0.6 }}
                  animate={{ y: '-900%', x: `${h.drift * 6}%`, opacity: 0, scale: 1.2 }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  onAnimationComplete={() => setHearts((all) => all.filter((x) => x.id !== h.id))}
                >
                  <path d="M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3.5-3 7-10 13Z" />
                </motion.svg>
              ))}
            </div>
          </After>

          {/* Camera print: slides down into the frame and develops */}
          <After part="camera" z={5} rect={rectOf(WINDOWS.camera)} extra={0.3}>
            <div
              className="size-full overflow-hidden"
              style={{ maskImage: `url(${MASK_URL(WINDOWS.camera.mask)})`, maskSize: '100% 100%', WebkitMaskImage: `url(${MASK_URL(WINDOWS.camera.mask)})`, WebkitMaskSize: '100% 100%' }}
            >
              <AnimatePresence>
                {print >= 0 && (
                  <motion.button
                    key={print}
                    type="button"
                    className="absolute inset-0 cursor-zoom-in"
                    onClick={() => setLightbox(cameraPhotos[print] || `placeholder:ảnh ${print + 1}`)}
                    initial={{ y: '-100%', filter: 'brightness(1.8) contrast(0.5) sepia(0.6) blur(3px)' }}
                    animate={{ y: '0%', filter: 'brightness(1) contrast(1) sepia(0) blur(0px)' }}
                    exit={{ opacity: 0 }}
                    transition={{ y: { duration: 1.1, ease: 'easeOut', delay: 0.25 }, filter: { duration: 2.6, delay: 0.6 } }}
                    aria-label="Xem ảnh"
                  >
                    <Photo src={cameraPhotos[print]} label={`ảnh ${print + 1}`} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </After>
          <After part="camera" z={9} rect={cameraButton} extra={0.3}>
            <button type="button" onClick={takePhoto} aria-label="Chụp ảnh" className="relative size-full cursor-pointer">
              {print < 0 && <span className="hint-pulse pointer-events-none absolute inset-[18%] rounded-full border-2 border-[#FBF7EE]/80" style={{ animationDelay: `${ALL_IN}s` }} />}
            </button>
          </After>

          {/* Clipped note: "Things I love about you" — tap to open the list */}
          <After part="clip-paper" z={3} rect={noteRect} extra={0.5}>
            <button
              type="button"
              onClick={openLoveList}
              aria-label={content.loveList.title}
              className="flex size-full cursor-pointer flex-col items-center justify-center"
              style={{ rotate: '-3deg' }}
            >
              <Written delay={(delayOf.get('clip-paper') ?? 0) + 0.8} duration={1.2} className="font-bold text-[#9b1c24]" style={{ fontSize: u(50), lineHeight: 1.15 }}>
                {content.loveList.title}
              </Written>
              <motion.svg
                viewBox="0 0 24 24"
                className="fill-[#dc2626]"
                style={{ width: u(52), marginTop: u(14) }}
                animate={{ scale: [1, 1.18, 1, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 0.6 }}
              >
                <path d="M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3.5-3 7-10 13Z" />
              </motion.svg>
              <span className="font-note text-[#7a1f1f]/80" style={{ fontSize: u(30), marginTop: u(8) }}>
                {content.loveList.hint}
              </span>
            </button>
          </After>

          {STICKERS.map((p) => (
            <PieceImage key={p.name} piece={p} />
          ))}

          {/* Butterfly: flaps and drifts; tap to make it flutter off and come back */}
          <motion.button
            type="button"
            aria-label="Bướm"
            className="absolute cursor-pointer"
            style={{ ...place(PARTS.butterfly), zIndex: 10 }}
            initial={{ opacity: 0, x: '160%', y: '-120%' }}
            animate={
              butterflyHop
                ? { opacity: 1, x: ['0%', '-180%', '-60%', '0%'], y: ['0%', '-220%', '-120%', '0%'], rotate: [0, -20, 10, 0] }
                : { opacity: 1, x: ['0%', '-6%', '4%', '0%'], y: ['0%', '-8%', '-3%', '0%'] }
            }
            transition={
              butterflyHop
                ? { duration: 2.4, ease: 'easeInOut' }
                : { delay: ALL_IN - 0.6, duration: 6, repeat: Infinity, ease: 'easeInOut', opacity: { delay: ALL_IN - 0.6 } }
            }
            onClick={() => {
              sfx.flutter()
              haptics.soft()
              setButterflyHop((n) => n + 1)
            }}
            onAnimationComplete={() => {
              if (butterflyHop) setButterflyHop(0)
            }}
          >
            <img src={PART_URL('butterfly')} alt="" draggable={false} className="amb-flap size-full select-none" />
          </motion.button>

          {/* "Scroll down" cue: there's a song waiting below */}
          <motion.div
            className="pointer-events-none absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center text-[#F5E6D3]"
            style={{ bottom: u(30) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.6, 1], y: [0, 0, 8, 0, 8] }}
            transition={{ delay: ALL_IN + 1, duration: 2.4, repeat: Infinity, repeatType: 'reverse' }}
          >
            <span className="font-hand drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" style={{ fontSize: u(40) }}>
              kéo xuống nè
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: u(52) }} className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.div>

          {/* Camera flash */}
          <AnimatePresence>
            {flash > 0 && (
              <motion.div
                key={flash}
                className="pointer-events-none fixed inset-0 z-30 bg-white"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <CdPlayer />

      <AnimatePresence>{letterOpen && <LetterModal onClose={() => setLetterOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{loveOpen && <LoveListModal onClose={() => setLoveOpen(false)} />}</AnimatePresence>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              className="w-full max-w-sm bg-white p-3 pb-12 shadow-2xl [container-type:inline-size]"
              initial={{ scale: 0.6, rotate: -6 }}
              animate={{ scale: 1, rotate: -2 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 16 }}
            >
              <div className="aspect-square w-full">
                <Photo src={lightbox.startsWith('placeholder:') ? '' : lightbox} label={lightbox.replace('placeholder:', '')} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
