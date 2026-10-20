import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { content } from '../content'
import { isMuted, music, onMutedChange } from '../sound'

// Lined writing paper with a red margin, drawn in CSS.
const PAPER = {
  backgroundColor: '#FBF7EE',
  backgroundImage:
    'linear-gradient(90deg, transparent 2.6rem, rgb(220 38 38 / 0.35) 2.6rem, rgb(220 38 38 / 0.35) calc(2.6rem + 1px), transparent calc(2.6rem + 1px)), repeating-linear-gradient(transparent 0 calc(2.25rem - 1px), rgb(148 163 184 / 0.45) calc(2.25rem - 1px) 2.25rem)',
  backgroundPositionY: '1.4rem',
}

// The letter is "written" word by word: each word fades in a moment after the one before,
// with a short pause between paragraphs. With his recording, the pace follows the recording's length.
const WORDS = content.letter.map((paragraph) => paragraph.split(' '))
const WORD_COUNT = WORDS.reduce((n, w) => n + w.length, 0)
const DEFAULT_PER_WORD = 0.05
const PARAGRAPH_PAUSE = 0.35
const LEAD_IN = 0.5
const VOICE = content.letterVoice

// Seconds per word so the writing finishes as the recording does
const paceFor = (duration: number) => {
  const usable = duration - LEAD_IN - PARAGRAPH_PAUSE * (WORDS.length - 1) - 0.6
  return Math.min(0.6, Math.max(0.03, usable / WORD_COUNT))
}

function timings(perWord: number) {
  const starts = WORDS.reduce<number[]>((acc, _w, i) => {
    acc.push(i === 0 ? LEAD_IN : acc[i - 1] + WORDS[i - 1].length * perWord + PARAGRAPH_PAUSE)
    return acc
  }, [])
  const signAt = (starts.at(-1) ?? 0) + (WORDS.at(-1)?.length ?? 0) * perWord + 0.4
  return { starts, signAt }
}

function SpeakerIcon({ speaking }: { speaking: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" fillOpacity=".2" />
      {speaking ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" /> : <path d="M16 12h5M18.5 9.5v5" />}
    </svg>
  )
}

// The letter opened full screen, written in word by word — read aloud in his voice if there's a recording.
export function LetterModal({ onClose }: { onClose: () => void }) {
  // 0 = still waiting to learn the recording's length
  const [perWord, setPerWord] = useState(VOICE ? 0 : DEFAULT_PER_WORD)
  const [run, setRun] = useState(0) // bumped to replay the writing
  const [speaking, setSpeaking] = useState(false)
  const voice = useRef<HTMLAudioElement | null>(null)
  const sheet = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!VOICE) return
    const a = new Audio(VOICE)
    a.preload = 'auto'
    a.muted = isMuted()
    voice.current = a
    const onMeta = () => setPerWord(paceFor(a.duration))
    const onPlay = () => {
      setSpeaking(true)
      music.duck(true)
    }
    const onStop = () => {
      setSpeaking(false)
      music.duck(false)
    }
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onStop)
    a.addEventListener('ended', onStop)
    // If the length can't be read quickly, write at the normal pace rather than wait
    const fallback = window.setTimeout(() => setPerWord((p) => p || DEFAULT_PER_WORD), 2500)
    void a.play().catch(onStop)
    const offMuted = onMutedChange((m) => {
      a.muted = m
    })
    return () => {
      window.clearTimeout(fallback)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onStop)
      a.removeEventListener('ended', onStop)
      a.pause()
      offMuted()
      music.duck(false)
    }
  }, [])

  const toggleVoice = () => {
    const a = voice.current
    if (!a) return
    if (speaking) {
      a.pause()
    } else {
      if (a.ended || a.currentTime === 0) {
        a.currentTime = 0
        setRun((r) => r + 1) // write it again from the start, in time with the voice
      }
      void a.play().catch(() => {})
    }
  }

  const { starts, signAt } = timings(perWord || DEFAULT_PER_WORD)

  // On small screens the letter is taller than the card: scroll down gently as it's written,
  // and stop as soon as she scrolls or touches it herself.
  useEffect(() => {
    const el = sheet.current
    if (!el || !perWord) return
    const t0 = performance.now()
    let stopped = false
    const stop = () => {
      stopped = true
    }
    el.addEventListener('wheel', stop, { passive: true })
    el.addEventListener('touchstart', stop, { passive: true })
    const id = window.setInterval(() => {
      const room = el.scrollHeight - el.clientHeight
      const progress = Math.min(1, (performance.now() - t0) / 1000 / (signAt + 0.5))
      if (stopped || room <= 0 || progress >= 1) {
        if (progress >= 1 && !stopped && room > 0) el.scrollTo({ top: room, behavior: 'smooth' })
        if (progress >= 1 || stopped) window.clearInterval(id)
        return
      }
      // keep the line being written roughly in the lower middle of the card
      el.scrollTo({ top: Math.max(0, progress * el.scrollHeight - el.clientHeight * 0.6), behavior: 'smooth' })
    }, 400)
    return () => {
      window.clearInterval(id)
      el.removeEventListener('wheel', stop)
      el.removeEventListener('touchstart', stop)
    }
  }, [perWord, signAt, run])

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
        ref={sheet}
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

        {VOICE && (
          <button
            type="button"
            onClick={toggleVoice}
            className="font-note absolute top-2.5 left-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-full bg-[#9b1c24] py-1 pr-3 pl-2 text-sm text-[#FBF7EE] shadow"
          >
            <SpeakerIcon speaking={speaking} />
            {speaking ? 'Anh đang đọc…' : 'Nghe anh đọc'}
            {speaking && (
              <span className="ml-0.5 flex h-3 items-end gap-[2px]" aria-hidden>
                {[0, 0.15, 0.3].map((d) => (
                  <motion.span
                    key={d}
                    className="w-[3px] rounded-full bg-[#FBF7EE]"
                    animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: d }}
                  />
                ))}
              </span>
            )}
          </button>
        )}

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
          <div key={run} className={`font-note pr-6 pb-6 pl-14 text-[1.22rem] leading-[2.25rem] text-[#2b1414] ${VOICE ? 'pt-12' : 'pt-6'}`}>
            {perWord > 0 &&
              WORDS.map((words, i) => (
                <p key={i} className={i === 0 ? 'font-hand mb-1 text-[1.6rem] font-bold text-[#9b1c24]' : 'mb-2 indent-6'}>
                  {words.map((word, w) => (
                    <motion.span
                      key={w}
                      className="inline-block indent-0"
                      initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: starts[i] + w * perWord, duration: 0.35 }}
                    >
                      {word}&nbsp;
                    </motion.span>
                  ))}
                </p>
              ))}
            {perWord > 0 && (
              <motion.div
                className="mt-2 flex items-center justify-end gap-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: signAt, duration: 0.8 }}
              >
                <span className="font-hand text-[1.7rem] font-bold text-[#1d4ed8]">— {content.from}</span>
                {/* the blue fish (him) */}
                <motion.svg
                  viewBox="0 0 40 24"
                  className="w-10"
                  aria-hidden
                  animate={{ rotate: [0, -8, 0, 8, 0], x: [0, 2, 0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 2.4, delay: signAt + 0.8 }}
                >
                  <path d="M4 12C9 4 22 3 29 12C22 21 9 20 4 12Z" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1.4" />
                  <path d="M29 12L37 5V19Z" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="1.4" strokeLinejoin="round" />
                  <circle cx="10" cy="10.5" r="1.4" fill="#1e3a8a" />
                  <path d="M15 8C17 10 17 14 15 16M20 7.5C22 10 22 14 20 16.5" fill="none" stroke="#1d4ed8" strokeWidth="1" />
                </motion.svg>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
