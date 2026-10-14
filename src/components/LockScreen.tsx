import { motion, useAnimationControls } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { content } from '../content'
import { Envelope } from './Envelope'
import { Starfield } from './Starfield'

const DELETE = 'del'
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', DELETE]

type Status = 'idle' | 'error' | 'success'

export type Point = { x: number; y: number }

export function LockScreen({ onUnlock }: { onUnlock: (envelopeCenter: Point) => void }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  // Mirrors of the state above, so rapid presses before a re-render don't read stale values.
  const codeRef = useRef('')
  const statusRef = useRef<Status>('idle')
  const shake = useAnimationControls()
  const envelopeRef = useRef<HTMLDivElement>(null)
  const length = content.passcode.length

  const update = (nextCode: string, nextStatus: Status = statusRef.current) => {
    codeRef.current = nextCode
    statusRef.current = nextStatus
    setCode(nextCode)
    setStatus(nextStatus)
  }

  const press = (key: string) => {
    const current = codeRef.current
    if (statusRef.current !== 'idle') return
    if (key === DELETE) return update(current.slice(0, -1))
    if (current.length >= length) return

    const next = current + key
    if (next.length < length) return update(next)

    if (next === content.passcode) {
      update(next, 'success')
      setTimeout(() => {
        const box = envelopeRef.current?.getBoundingClientRect()
        onUnlock(box ? { x: box.left + box.width / 2, y: box.top + box.height * 0.4 } : { x: innerWidth / 2, y: innerHeight / 3 })
      }, 1500)
    } else {
      update(next, 'error')
      navigator.vibrate?.(200)
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
      transition={{ duration: 1.4, ease: 'easeInOut' }}
    >
      <Starfield />

      <motion.div
        ref={envelopeRef}
        className="relative mt-10 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={status === 'success' ? { opacity: 1, y: 0, scale: [1, 1.08, 1] } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Envelope open={status === 'success'} className="w-60 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" />
      </motion.div>

      <h1 className="font-display glow-text relative text-center text-3xl text-white italic sm:text-4xl">{content.lockTitle}</h1>
      {content.lockHint && <p className="relative mt-2 text-center text-sm font-light text-slate-400">{content.lockHint}</p>}

      {/* Passcode dots */}
      <motion.div animate={shake} className="relative my-8 flex gap-5">
        {Array.from({ length }, (_, i) => {
          const filled = i < code.length
          const color =
            status === 'error'
              ? 'border-red-400 bg-red-400'
              : status === 'success'
                ? 'border-sky-300 bg-sky-300 shadow-[0_0_12px_#7dd3fc]'
                : filled
                  ? 'border-white bg-white shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                  : 'border-slate-500 bg-transparent'
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
                  ? 'flex size-18 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors active:text-white'
                  : 'flex size-18 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-3xl font-light text-white backdrop-blur-sm transition-colors hover:border-sky-300/40 active:bg-sky-300/20'
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
