import confetti from 'canvas-confetti'
import { motion } from 'motion/react'
import { useEffect, type CSSProperties } from 'react'
import { content } from '../content'
import { haptics } from '../haptics'
import { sfx } from '../sound'

const ITEM_START = 0.7 // first item appears
const ITEM_GAP = 0.75 // then one every…

function Heart({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <path d="M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3.5-3 7-10 13Z" />
    </svg>
  )
}

// "Things I love about you": a clipped card where each item appears one by one with a heart.
export function LoveListModal({ onClose }: { onClose: () => void }) {
  const { title, items } = content.loveList

  useEffect(() => {
    const timers = items.map((_, i) =>
      window.setTimeout(() => {
        sfx.pop()
        haptics.soft()
      }, (ITEM_START + i * ITEM_GAP) * 1000),
    )
    timers.push(
      window.setTimeout(() => {
        sfx.sparkle()
        const heart = confetti.shapeFromPath({ path: 'M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3.5-3 7-10 13Z' })
        confetti({ particleCount: 70, spread: 90, startVelocity: 28, origin: { y: 0.55 }, colors: ['#B91C1C', '#7F1D1D', '#F5E6D3', '#E8B04A'], shapes: [heart, 'circle'], zIndex: 60 })
      }, (ITEM_START + items.length * ITEM_GAP) * 1000),
    )
    return () => timers.forEach(clearTimeout)
  }, [items])

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        className="relative w-full max-w-sm rounded-sm bg-[#F7F6F2] px-6 pt-12 pb-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{ backgroundImage: 'linear-gradient(rgb(244 63 94 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(244 63 94 / 0.08) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
        initial={{ scale: 0.6, rotate: 8, y: 60 }}
        animate={{ scale: 1, rotate: -1.5, y: 0 }}
        exit={{ scale: 0.7, rotate: -6, y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pink binder clip holding the card */}
        <svg viewBox="0 0 60 44" className="absolute -top-6 left-1/2 w-16 -translate-x-1/2" aria-hidden>
          <path d="M14 22 L22 4 M46 22 L38 4" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" fill="none" />
          <rect x="6" y="20" width="48" height="22" rx="4" fill="#f9a8c4" stroke="#db7a9d" strokeWidth="1.5" />
          <rect x="10" y="24" width="40" height="5" rx="2" fill="#fff" opacity=".35" />
        </svg>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-2 right-3 cursor-pointer p-1 text-2xl leading-none text-stone-400 hover:text-stone-700"
        >
          ×
        </button>

        <motion.h2
          className="font-hand text-center text-[2rem] leading-tight text-[#9b1c24]"
          initial={{ clipPath: 'inset(-20% 100% -20% 0)' }}
          animate={{ clipPath: 'inset(-20% 0% -20% 0)' }}
          transition={{ delay: 0.15, duration: 0.8, ease: 'linear' }}
        >
          {title}
        </motion.h2>

        <ol className="mt-6 space-y-4">
          {items.map((item, i) => (
            <motion.li
              key={item}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ITEM_START + i * ITEM_GAP, type: 'spring', stiffness: 220, damping: 18 }}
            >
              <motion.span
                className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.35, 1] }}
                transition={{ delay: ITEM_START + i * ITEM_GAP, duration: 0.5 }}
              >
                <Heart className="absolute inset-0 fill-[#dc2626]" />
                <span className="font-note relative -mt-0.5 text-sm text-white">{i + 1}</span>
              </motion.span>
              <span className="font-note text-[1.3rem] leading-snug text-[#2b1414]">{item}</span>
            </motion.li>
          ))}
        </ol>

        <motion.p
          className="font-hand mt-6 text-right text-2xl text-[#9b1c24]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: ITEM_START + items.length * ITEM_GAP, duration: 0.8 }}
        >
          — {content.from}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
