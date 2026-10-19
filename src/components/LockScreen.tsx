import { motion, useAnimationControls } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { content } from '../content'
import { haptics } from '../haptics'
import { sfx, unlockAudio } from '../sound'
import { Starfield } from './Starfield'

const DELETE = 'del'
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', DELETE]

type Status = 'idle' | 'error' | 'success'

export type Point = { x: number; y: number }

// A padlock whose shackle lifts free once the right code is entered.
function Padlock({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 64 80" className="w-16 overflow-visible drop-shadow-[0_0_24px_rgba(239,68,68,0.35)]" aria-hidden>
      <defs>
        <linearGradient id="lock-body" x1="0" y1="0" x2=".4" y2="1">
          <stop offset="0" stopColor="#B32631" />
          <stop offset="1" stopColor="#5A0C13" />
        </linearGradient>
      </defs>
      <motion.path
        d="M19 38V25a13 13 0 0 1 26 0v13"
        fill="none"
        stroke="#E7D3C1"
        strokeWidth="5"
        strokeLinecap="round"
        initial={false}
        animate={open ? { y: -10, rotate: -18, stroke: '#FCA5A5' } : { y: 0, rotate: 0, stroke: '#E7D3C1' }}
        style={{ transformBox: 'fill-box', originX: 0, originY: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      />
      <rect x="8" y="36" width="48" height="40" rx="9" fill="url(#lock-body)" stroke={open ? '#FCA5A5' : '#E7D3C1'} strokeWidth="1.2" style={{ transition: 'stroke 0.3s' }} />
      <circle cx="32" cy="53" r="5" fill={open ? '#FCA5A5' : '#F5E6D3'} style={{ transition: 'fill 0.3s' }} />
      <rect x="30" y="55" width="4" height="10" rx="2" fill={open ? '#FCA5A5' : '#F5E6D3'} style={{ transition: 'fill 0.3s' }} />
    </svg>
  )
}

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [misses, setMisses] = useState(0)
  // Mirrors of the state above, so rapid presses before a re-render don't read stale values.
  const codeRef = useRef('')
  const statusRef = useRef<Status>('idle')
  const shake = useAnimationControls()
  const length = content.passcode.length

  const update = (nextCode: string, nextStatus: Status = statusRef.current) => {
    codeRef.current = nextCode
    statusRef.current = nextStatus
    setCode(nextCode)
    setStatus(nextStatus)
  }

  const press = (key: string) => {
    unlockAudio()
    const current = codeRef.current
    if (statusRef.current !== 'idle') return
    if (key === DELETE) {
      sfx.key()
    haptics.tap()
      haptics.tap()
      return update(current.slice(0, -1))
    }
    if (current.length >= length) return

    const next = current + key
    sfx.key()
    if (next.length < length) return update(next)

    if (next === content.passcode) {
      update(next, 'success')
      sfx.unlock()
      haptics.success()
      setTimeout(onUnlock, 1100)
    } else {
      update(next, 'error')
      sfx.error()
      haptics.error()
      setMisses((m) => m + 1)
      shake
        .start({ x: [0, -14, 14, -10, 10, -4, 4, 0], transition: { duration: 0.45 } })
        .then(() => update('', 'idle'))
    }
  }

  // Allow typing the code on a physical keyboard too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press(DELETE)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <motion.div
      className="night-sky fixed inset-0 z-10 flex flex-col items-center justify-center px-6"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeInOut' }}
    >
      <Starfield />

      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={status === 'success' ? { opacity: 1, y: 0, scale: [1, 1.12, 1] } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Padlock open={status === 'success'} />
      </motion.div>

      <h1 className="font-display glow-text relative text-center text-3xl text-white italic sm:text-4xl">{content.lockTitle}</h1>
      {content.lockHint && (
        <motion.p
          key={misses >= 3 ? 'strong' : 'soft'}
          className={`relative mt-2 text-center text-sm font-light ${misses >= 3 ? 'text-rose-200' : 'text-stone-400'}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {misses >= 3 ? content.lockHintStrong : content.lockHint}
        </motion.p>
      )}

      {/* Passcode dots */}
      <motion.div animate={shake} className="relative my-8 flex gap-5">
        {Array.from({ length }, (_, i) => {
          const filled = i < code.length
          const color =
            status === 'error'
              ? 'border-red-400 bg-red-400'
              : status === 'success'
                ? 'border-rose-300 bg-rose-300 shadow-[0_0_12px_#fda4af]'
                : filled
                  ? 'border-white bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                  : 'border-stone-500 bg-transparent'
          return (
            <motion.span
              key={i}
              className={`size-3.5 rounded-full border transition-colors ${color}`}
              animate={{ scale: filled ? [1, 1.35, 1] : 1 }}
              transition={{ duration: 0.2 }}
            />
          )
        })}
      </motion.div>

      {/* Numpad */}
      <div className="relative grid grid-cols-3 gap-x-6 gap-y-4">
        {KEYS.map((key, i) =>
          key === '' ? (
            <span key={i} />
          ) : (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={() => press(key)}
              aria-label={key === DELETE ? 'Xóa' : key}
              className={
                key === DELETE
                  ? 'flex size-18 cursor-pointer items-center justify-center rounded-full text-stone-400 transition-colors active:text-white'
                  : 'flex size-18 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-3xl font-light text-white backdrop-blur-sm transition-colors hover:border-rose-300/40 active:bg-rose-300/20'
              }
            >
              {key === DELETE ? (
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
                  <path d="m17 9-6 6M11 9l6 6" />
                </svg>
              ) : (
                key
              )}
            </motion.button>
          ),
        )}
      </div>
    </motion.div>
  )
}
