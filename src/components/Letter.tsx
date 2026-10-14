import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { content } from '../content'
import { Bouquet } from './flowers'

// Postage-stamp edge: semicircle "holes" punched along every side.
const perforated = (r: number): CSSProperties => {
  const tile = r * 2.4
  const mask = `radial-gradient(circle at center, transparent ${r}px, #000 ${r + 0.5}px) ${-tile / 2}px ${-tile / 2}px / ${tile}px ${tile}px round, linear-gradient(#000 0 0) ${tile / 2}px ${tile / 2}px / calc(100% - ${tile}px) calc(100% - ${tile}px) no-repeat`
  return { WebkitMask: mask, mask }
}

function Paperclip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 40" className={className} fill="none" aria-hidden>
      <path d="M7 34V8a5 5 0 0 1 10 0v24a3 3 0 0 1-6 0V11" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 34V8a5 5 0 0 1 10 0" stroke="#fff" strokeWidth=".6" strokeLinecap="round" opacity=".8" transform="translate(-.6 0)" />
    </svg>
  )
}

function PhotoStrip() {
  const photos = Array.from({ length: 3 }, (_, i) => content.photos[i])
  return (
    <div className="flex flex-col gap-1.5 bg-white p-1.5 pb-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      {photos.map((src, i) =>
        src ? (
          <img key={i} src={src} alt="" className="aspect-square w-full object-cover grayscale" />
        ) : (
          <div
            key={i}
            className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-[9px] tracking-widest text-slate-400"
          >
            ẢNH {i + 1}
          </div>
        ),
      )}
    </div>
  )
}

function Stamp() {
  return (
    <div className="bg-[#14213D] p-1.5" style={perforated(3)}>
      <div className="flex flex-col items-center gap-0.5 border border-sky-200/40 px-2 pt-2 pb-1">
        <svg viewBox="0 0 40 40" className="size-8" fill="none" stroke="#DBEAFE" strokeWidth="1.2" aria-hidden>
          <path d="M24 8a13 13 0 1 0 8 20A11 11 0 1 1 24 8Z" />
          <path d="M30 10l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" fill="#DBEAFE" stroke="none" />
          <circle cx="12" cy="9" r=".8" fill="#DBEAFE" stroke="none" />
        </svg>
        <span className="font-display text-[9px] tracking-[0.2em] text-sky-100">20·10</span>
      </div>
    </div>
  )
}

// Faint line-art flowers and vines behind the letter, like an engraved wallpaper.
function LineArt() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 800" aria-hidden>
      <g fill="none" stroke="#E2E8F0" strokeWidth=".8" opacity=".09">
        <g transform="translate(330 150)">
          <circle r="34" />
          <circle r="22" />
          {petals.map((deg) => (
            <ellipse key={deg} cx="0" cy="-62" rx="14" ry="28" transform={`rotate(${deg})`} />
          ))}
          {petals.map((deg) => (
            <path key={`r${deg}`} d="M0 -98V-120" transform={`rotate(${deg + 15})`} />
          ))}
        </g>
        <path d="M-10 760C60 700 40 620 110 580C170 546 150 470 210 440" />
        {[
          [40, 700, -40], [78, 640, -120], [100, 590, -30], [150, 520, -110], [180, 470, -20],
        ].map(([x, y, r]) => (
          <path key={`${x}-${y}`} d="M0 0C10 -14 30 -14 44 0C30 14 10 14 0 0Z" transform={`translate(${x} ${y}) rotate(${r})`} />
        ))}
        <g transform="translate(70 300)">
          {petals.slice(0, 8).map((deg) => (
            <ellipse key={deg} cx="0" cy="-20" rx="8" ry="16" transform={`rotate(${deg * 1.5})`} />
          ))}
          <circle r="7" />
        </g>
      </g>
    </svg>
  )
}

export function LetterScene() {
  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-24">
      <LineArt />

      <motion.p
        className="relative mb-3 text-center text-xs font-light tracking-[0.35em] text-balance text-sky-300/80 uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
      >
        {content.greeting}
      </motion.p>
      <motion.h1
        className="font-display glow-text relative mb-14 text-center text-6xl text-white italic sm:text-7xl"
        initial={{ opacity: 0, filter: 'blur(12px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ delay: 1.8, duration: 1.4 }}
      >
        {content.name}
      </motion.h1>

      <div className="relative w-full max-w-md">
        {/* Bouquet */}
        <motion.div
          className="absolute -top-20 -right-3 z-20 w-24 sm:-right-10 sm:w-28"
          initial={{ opacity: 0, scale: 0.4, rotate: 40 }}
          animate={{ opacity: 1, scale: 1, rotate: 14 }}
          transition={{ delay: 0.9, type: 'spring', bounce: 0.4 }}
        >
          <div className="sway" style={{ '--amp': '3deg', transformOrigin: '50% 100%', animationDuration: '3.2s' } as CSSProperties}>
            <Bouquet className="w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
          </div>
        </motion.div>

        {/* Photo strip with paperclip */}
        <motion.div
          className="absolute top-8 -left-4 z-20 w-[4.5rem] sm:-left-10 sm:w-20"
          initial={{ x: '-120vw', rotate: -30 }}
          animate={{ x: 0, rotate: -6 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 60, damping: 14 }}
        >
          <Paperclip className="absolute -top-5 left-1/2 z-10 w-4 -translate-x-1/2" />
          <PhotoStrip />
        </motion.div>

        {/* Letter */}
        <motion.div
          initial={{ x: '-120vw', rotate: -14 }}
          animate={{ x: 0, rotate: -1.5 }}
          transition={{ type: 'spring', stiffness: 50, damping: 13 }}
        >
          <div className="bg-[#F8FAFC] shadow-[0_20px_50px_rgba(0,0,0,0.55)]" style={perforated(5)}>
            <div className="min-h-[22rem] pt-10 pr-7 pb-24 pl-16 text-[#1E293B] sm:pl-14">
              {content.letter.map((paragraph, i) => (
                <p key={i} className={i === 0 ? 'font-hand mb-4 text-3xl' : 'font-hand mb-3 text-xl leading-relaxed'}>
                  {paragraph}
                </p>
              ))}
              <p className="font-hand mt-6 text-right text-2xl">— {content.from}</p>
            </div>
          </div>
        </motion.div>

        {/* Stamp */}
        <motion.div
          className="absolute right-4 bottom-4 z-10 w-16 rotate-6"
          initial={{ opacity: 0, scale: 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.35, ease: 'easeIn' }}
        >
          <Stamp />
        </motion.div>
      </div>

      <motion.span
        className="absolute bottom-8 h-10 w-px bg-gradient-to-b from-sky-300/80 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 1, 0.3], y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 2.5 }}
      />
    </section>
  )
}
