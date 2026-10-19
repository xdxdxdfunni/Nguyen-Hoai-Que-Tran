import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { EnvelopeScreen } from './components/EnvelopeScreen'
import { FlowerBurst } from './components/FlowerBurst'
import { LockScreen, type Point } from './components/LockScreen'
import { SoundToggle } from './components/SoundToggle'
import { Starfield } from './components/Starfield'
import { preloadScrapbook } from './scrapbook/preload'
import { Scrapbook } from './scrapbook/Scrapbook'

// locked → envelope (tap to open) → burst of roses from the envelope → open (the scrapbook)
type Stage = 'locked' | 'envelope' | 'burst' | 'open'

function App() {
  const [stage, setStage] = useState<Stage>('locked')
  const [origin, setOrigin] = useState<Point>({ x: 0, y: 0 })
  const finishBurst = useCallback(() => setStage('open'), [])

  useEffect(preloadScrapbook, [])

  const openEnvelope = (envelopeCenter: Point) => {
    setOrigin(envelopeCenter)
    setStage('burst')
  }

  return (
    <>
      <Starfield />
      <AnimatePresence>{stage === 'locked' && <LockScreen key="lock" onUnlock={() => setStage('envelope')} />}</AnimatePresence>
      <AnimatePresence>{stage === 'envelope' && <EnvelopeScreen key="envelope" onOpen={openEnvelope} />}</AnimatePresence>
      <AnimatePresence>{stage === 'burst' && <FlowerBurst key="burst" origin={origin} onDone={finishBurst} />}</AnimatePresence>
      {stage === 'open' && <Scrapbook />}
      <SoundToggle />
      {/* Shown only on a phone held sideways */}
      <div className="rotate-hint fixed inset-0 z-[60] flex-col items-center justify-center gap-4 bg-[#0a0304] text-[#F5E6D3]">
        <svg viewBox="0 0 24 24" className="size-14 animate-[rotate-phone_2.4s_ease-in-out_infinite]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
          <path d="M11 18.5h2" />
        </svg>
        <p className="font-hand text-2xl">Xoay dọc điện thoại nhé</p>
      </div>
    </>
  )
}

export default App
