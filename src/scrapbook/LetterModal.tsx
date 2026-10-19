import { motion } from 'motion/react'
import { content } from '../content'

// Lined writing paper with a red margin, drawn in CSS.
const PAPER = {
  backgroundColor: '#FBF7EE',
  backgroundImage:
    'linear-gradient(90deg, transparent 2.6rem, rgb(220 38 38 / 0.35) 2.6rem, rgb(220 38 38 / 0.35) calc(2.6rem + 1px), transparent calc(2.6rem + 1px)), repeating-linear-gradient(transparent 0 calc(2.25rem - 1px), rgb(148 163 184 / 0.45) calc(2.25rem - 1px) 2.25rem)',
  backgroundPositionY: '1.4rem',
}

// When each paragraph starts and how long it takes to "write" (longer text writes for longer).
const TIMINGS = content.letter.reduce<{ start: number; duration: number }[]>((acc, paragraph) => {
  const prev = acc.at(-1)
  const start = prev ? prev.start + prev.duration + 0.15 : 0.5
  acc.push({ start, duration: Math.min(4, 0.6 + paragraph.length * 0.035) })
  return acc
}, [])
const SIGN_AT = (TIMINGS.at(-1)?.start ?? 0) + (TIMINGS.at(-1)?.duration ?? 0) + 0.35

// The letter opened full screen: each paragraph writes itself left to right.
export function LetterModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Thư"
    >
      <motion.div
        className="relative max-h-[88svh] w-full max-w-md overflow-y-auto rounded-sm shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={PAPER}
        initial={{ scale: 0.6, rotate: -8, y: 60 }}
        animate={{ scale: 1, rotate: -1, y: 0 }}
        exit={{ scale: 0.7, rotate: 6, y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-2 right-3 z-10 cursor-pointer p-1 text-2xl leading-none text-stone-500 hover:text-stone-800"
        >
          ×
        </button>

        {content.letterImage ? (
          <motion.img
            src={content.letterImage}
            alt={content.letter.join(' ')}
            className="block w-full"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: 3.5, ease: 'easeInOut', delay: 0.4 }}
          />
        ) : (
          <div className="font-hand py-6 pr-6 pl-14 text-[1.35rem] leading-[2.25rem] text-[#2b1414]">
            {content.letter.map((paragraph, i) => (
              <motion.p
                key={i}
                className={i === 0 ? 'text-[1.7rem]' : ''}
                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: TIMINGS[i].duration, delay: TIMINGS[i].start, ease: 'linear' }}
              >
                {paragraph}
              </motion.p>
            ))}
            <motion.p
              className="mt-2 text-right text-[1.6rem]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: SIGN_AT, duration: 0.8 }}
            >
              — {content.from}
            </motion.p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
