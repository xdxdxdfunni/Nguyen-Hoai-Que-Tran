import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { content } from '../content'
import { haptics } from '../haptics'
import { music, sfx, unlockAudio, voice } from '../sound'
import { Envelope } from './Envelope'
import type { Point } from './LockScreen'
import { Starfield } from './Starfield'

// Where the envelope body's middle sits in its 240×180 viewBox (body spans y 30–170).
const BODY_MIDDLE = 100 / 180

// Shown after the passcode: the envelope floats in the middle of the screen until it is tapped.
export function EnvelopeScreen({ onOpen }: { onOpen: (envelopeCenter: Point) => void }) {
  const [open, setOpen] = useState(false)
  const envelopeRef = useRef<HTMLDivElement>(null)

  const openEnvelope = () => {
    if (open) return
    setOpen(true)
    unlockAudio()
    sfx.envelope()
    haptics.open()
    music.play()
    voice.prime()
    // Let the flap flip and the letter peek out, then burst from the envelope's middle.
    setTimeout(() => {
      const box = envelopeRef.current?.getBoundingClientRect()
      onOpen(box ? { x: box.left + box.width / 2, y: box.top + box.height * BODY_MIDDLE } : { x: innerWidth / 2, y: innerHeight / 2 })
    }, 1100)
  }

  return (
    <motion.div
      className="night-sky fixed inset-0 z-10 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      <Starfield />

      <div className="relative">
        {/* Soft glow behind the envelope */}
        <motion.div
          className="pointer-events-none absolute inset-[-25%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.25)_0%,transparent_65%)]"
          animate={{ opacity: open ? 1 : [0.5, 1, 0.5], scale: open ? 1.3 : 1 }}
          transition={open ? { duration: 0.8 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.button
          type="button"
          onClick={openEnvelope}
          aria-label={content.openMe}
          className="relative block cursor-pointer"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={open ? { opacity: 1, y: 0, scale: [1, 1.08, 1] } : { opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={
            open
              ? { duration: 0.8 }
              : { y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, default: { duration: 0.9, ease: 'easeOut' } }
          }
          whileHover={open ? undefined : { scale: 1.04 }}
          whileTap={open ? undefined : { scale: 0.97 }}
        >
          <div ref={envelopeRef}>
            <Envelope open={open} className="block w-72 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] sm:w-96" />
          </div>
        </motion.button>

        {/* Sits below the envelope so the envelope itself stays dead centre */}
        <motion.p
          className="font-display glow-text pointer-events-none absolute top-full left-1/2 mt-8 -translate-x-1/2 text-3xl whitespace-nowrap text-white italic sm:text-4xl"
          initial={{ opacity: 0 }}
          animate={open ? { opacity: 0, y: 10 } : { opacity: [0.55, 1, 0.55] }}
          transition={open ? { duration: 0.4 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        >
          {content.openMe}
        </motion.p>
      </div>
    </motion.div>
  )
}
