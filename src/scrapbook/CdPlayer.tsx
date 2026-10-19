import { motion } from 'motion/react'
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { content } from '../content'
import { music } from '../sound'

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

// The disc: iridescent foil with fine grooves, a red printed label and the centre hole.
function Disc({ spinning }: { spinning: boolean }) {
  return (
    <div className="relative size-full rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'repeating-radial-gradient(circle, rgb(0 0 0 / 0.06) 0 1px, transparent 1px 3px), conic-gradient(from 20deg, #d9d6df, #f6f0ff, #c9e8ef, #f2d2e6, #ece3c6, #d3d7ea, #f6f0ff, #d9d6df)',
          animation: 'cd-spin 3.2s linear infinite',
          animationPlayState: spinning ? 'running' : 'paused',
        }}
      >
        {/* Printed label */}
        <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-[radial-gradient(circle,#a3222b,#6e0f16)] text-center text-[#F5E6D3] shadow-[inset_0_0_0_2px_rgb(245_230_211/0.35)]">
          <span className="font-hand leading-none" style={{ fontSize: '4.2cqw' }}>
            for {content.name}
          </span>
          <span className="font-display mt-[1cqw] italic" style={{ fontSize: '2.6cqw' }}>
            20 · 10
          </span>
        </div>
        {/* Centre hole */}
        <div className="absolute inset-[45%] rounded-full bg-[#0a0304] shadow-[0_0_0_3px_rgb(255_255_255/0.5)]" />
      </div>
      {/* A fixed glint that doesn't spin with the disc */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(120deg,transparent_30%,rgb(255_255_255/0.55)_45%,transparent_58%)] mix-blend-screen" />
    </div>
  )
}

function Equalizer() {
  return (
    <span className="flex items-end gap-[0.6cqw]" style={{ height: '4cqw' }} aria-hidden>
      {[0, 0.2, 0.4].map((d) => (
        <motion.span
          key={d}
          className="w-[0.9cqw] rounded-full bg-[#F5E6D3]"
          animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
          transition={{ repeat: Infinity, duration: 1.1, delay: d }}
        />
      ))}
    </span>
  )
}

// A CD sliding out of a handwritten sleeve; it spins while the song plays.
export function CdPlayer() {
  const playing = useSyncExternalStore(music.subscribe, music.isPlaying)
  const [time, setTime] = useState(music.time)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setTime(music.time()), 250)
    return () => window.clearInterval(id)
  }, [playing])

  const progress = time.duration ? time.current / time.duration : 0
  const sleeve: CSSProperties = {
    backgroundColor: '#F3EBDD',
    backgroundImage: 'radial-gradient(rgb(120 90 60 / 0.08) 1px, transparent 1px)',
    backgroundSize: '1.6cqw 1.6cqw',
  }

  return (
    <section className="relative flex min-h-svh w-[min(100vw,calc(100svh*1080/2340))] flex-col justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,#3a0b0e,#0a0304_75%)] [container-type:inline-size]" style={{ padding: '12cqw 7cqw 16cqw' }}>
      <motion.h2
        className="font-hand glow-text text-center text-[#F5E6D3]"
        style={{ fontSize: '9cqw' }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8 }}
      >
        Bài hát dành cho em
      </motion.h2>

      {/* Sleeve + disc */}
      <div className="relative w-full" style={{ height: '62cqw', marginTop: '8cqw' }}>
        <motion.button
          type="button"
          onClick={music.toggle}
          aria-label={playing ? 'Tạm dừng' : 'Phát nhạc'}
          className="absolute top-[3cqw] cursor-pointer rounded-full"
          style={{ width: '56cqw', height: '56cqw', zIndex: 1 }}
          initial={false}
          animate={{ left: playing ? '30cqw' : '12cqw', rotate: playing ? 0 : -12 }}
          transition={{ type: 'spring', stiffness: 70, damping: 14 }}
        >
          <Disc spinning={playing} />
        </motion.button>

        <div className="absolute top-0 left-0 shadow-[0_14px_30px_rgba(0,0,0,0.5)]" style={{ ...sleeve, width: '58cqw', height: '62cqw', rotate: '-4deg', zIndex: 2 }}>
          {/* washi tape */}
          <div className="absolute -top-[2cqw] left-[18cqw] h-[5cqw] w-[20cqw] rotate-[-6deg] bg-[#b91c1c]/55" />
          <div className="flex h-full flex-col text-[#3b1414]" style={{ padding: '8cqw 6cqw' }}>
            <span className="font-display tracking-[0.3em] uppercase" style={{ fontSize: '2.6cqw' }}>
              Side A
            </span>
            <span className="font-hand mt-[2cqw] leading-tight" style={{ fontSize: '6.2cqw' }}>
              {content.song.title}
            </span>
            <span className="font-display mt-[1.5cqw] italic text-[#7a1f1f]" style={{ fontSize: '3.4cqw' }}>
              {content.song.artist}
            </span>
            <svg viewBox="0 0 24 24" className="mt-auto fill-[#b91c1c]" style={{ width: '7cqw' }} aria-hidden>
              <path d="M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3.5-3 7-10 13Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-[8cqw] flex items-center" style={{ gap: '4cqw' }}>
        <motion.button
          type="button"
          onClick={music.toggle}
          whileTap={{ scale: 0.9 }}
          aria-label={playing ? 'Tạm dừng' : 'Phát nhạc'}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#b91c1c] text-[#F5E6D3] shadow-[0_0_24px_rgba(220,38,38,0.45)]"
          style={{ width: '15cqw', height: '15cqw' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '6cqw' }}>
            {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
          </svg>
        </motion.button>

        <div className="min-w-0 flex-1 text-[#F5E6D3]">
          <div className="flex items-center justify-between" style={{ gap: '2cqw' }}>
            <p className="font-display truncate italic" style={{ fontSize: '4.4cqw' }}>
              {content.song.title}
            </p>
            {playing && <Equalizer />}
          </div>
          <p className="text-stone-400" style={{ fontSize: '3cqw' }}>
            {content.song.artist}
          </p>
          {music.hasSong() && (
            <>
              <div
                className="relative mt-[2.5cqw] h-[1cqw] cursor-pointer rounded-full bg-white/15"
                onClick={(e) => {
                  const box = e.currentTarget.getBoundingClientRect()
                  music.seek((e.clientX - box.left) / box.width)
                  setTime(music.time())
                }}
              >
                <div className="absolute inset-y-0 left-0 rounded-full bg-[#ef4444]" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="mt-[1cqw] flex justify-between text-stone-400" style={{ fontSize: '2.8cqw' }}>
                <span>{fmt(time.current)}</span>
                <span>{fmt(time.duration)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
