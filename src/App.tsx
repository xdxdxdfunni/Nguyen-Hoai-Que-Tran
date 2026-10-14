import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { FlowerBurst } from './components/FlowerBurst'
import { LetterScene } from './components/Letter'
import { LockScreen, type Point } from './components/LockScreen'
import { Starfield } from './components/Starfield'
import { content } from './content'

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.8, ease: 'easeOut' },
} as const

const CONFETTI_COLORS = ['#ffffff', '#e0f2fe', '#7dd3fc', '#3b82f6', '#1e3a8a']

// locked → (envelope opens) → burst of flowers → open (letter + rest of the gift)
type Stage = 'locked' | 'burst' | 'open'

function App() {
  const [stage, setStage] = useState<Stage>('locked')
  const [origin, setOrigin] = useState<Point>({ x: 0, y: 0 })
  const finishBurst = useCallback(() => setStage('open'), [])

  const unlock = (envelopeCenter: Point) => {
    setOrigin(envelopeCenter)
    setStage('burst')
  }

  return (
    <>
      <Starfield />
      <AnimatePresence>{stage === 'locked' && <LockScreen key="lock" onUnlock={unlock} />}</AnimatePresence>
      <AnimatePresence>{stage === 'burst' && <FlowerBurst key="burst" origin={origin} onDone={finishBurst} />}</AnimatePresence>
      {stage === 'open' && <Gift />}
    </>
  )
}

function Gift() {
  const [revealed, setRevealed] = useState(false)

  const celebrate = () => {
    setRevealed(true)
    confetti({ particleCount: 140, spread: 110, origin: { y: 0.7 }, colors: CONFETTI_COLORS, shapes: ['star', 'circle'] })
    setTimeout(() => confetti({ particleCount: 60, spread: 160, startVelocity: 25, origin: { y: 0.5 }, colors: CONFETTI_COLORS, shapes: ['star'], scalar: 1.4 }), 250)
  }

  return (
    <main className="relative overflow-hidden">
      <LetterScene />

      {/* Reasons */}
      <section className="relative mx-auto max-w-4xl px-6 py-16">
        <motion.h2 {...fadeUp} className="font-display glow-text mb-12 text-center text-5xl text-white italic">
          {content.reasonsTitle}
        </motion.h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {content.reasons.map((reason, i) => (
            <motion.div
              key={reason}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-sky-300/40 hover:bg-sky-300/[0.05]"
            >
              <div className="font-display mb-3 text-3xl text-sky-300/80 italic transition-colors group-hover:text-sky-200">
                {String(i + 1).padStart(2, '0')}
              </div>
              <p className="font-light text-slate-200">{reason}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Surprise */}
      <section className="relative flex min-h-[70svh] flex-col items-center justify-center px-6 py-24 text-center">
        {!revealed ? (
          <motion.button
            {...fadeUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={celebrate}
            className="cursor-pointer rounded-full border border-sky-300/40 bg-sky-400/10 px-10 py-4 text-sm tracking-[0.25em] text-sky-100 uppercase shadow-[0_0_40px_rgba(56,189,248,0.25)] transition-shadow hover:shadow-[0_0_60px_rgba(56,189,248,0.45)]"
          >
            {content.surpriseButton}
          </motion.button>
        ) : (
          <motion.p
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2 }}
            className="font-display glow-text text-5xl text-white italic sm:text-7xl"
          >
            {content.surpriseMessage}
          </motion.p>
        )}
      </section>

      <footer className="pb-10 text-center text-xs tracking-[0.3em] text-slate-500">20 · 10 · 2026</footer>
    </main>
  )
}

export default App
