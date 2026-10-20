import { motion } from 'motion/react'
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { content } from '../content'
import confetti from 'canvas-confetti'
import { haptics } from '../haptics'
import { music, sfx } from '../sound'

const DISC = 38 // disc size, in % of the section width

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

// The disc: iridescent foil with fine grooves, a red printed label and the centre hole.
function Disc({ spinning, size }: { spinning: boolean; size: number }) {
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
          <span className="font-hand leading-none" style={{ fontSize: `${size * 0.075}cqw` }}>
            for {content.name}
          </span>
          <span className="font-display mt-[1cqw] italic" style={{ fontSize: `${size * 0.046}cqw` }}>
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
    <section className="relative flex min-h-svh w-full justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,#3a0b0e,#0a0304_75%)]">
      <div className="flex w-[min(100vw,calc(100svh*1080/2340))] flex-col justify-center [container-type:inline-size]" style={{ padding: '12cqw 7cqw 16cqw' }}>
      <motion.h2
        className="font-hand glow-text text-center text-[#F5E6D3]"
        style={{ fontSize: '8.4cqw', lineHeight: 1.2 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8 }}
      >
        Bó hoa và bài hát dành cho em
      </motion.h2>

      {/* Her bouquet beside the CD: bouquet in front on the left, sleeve on the right,
          and the disc slides up out of the sleeve while the song plays */}
      <div className="relative w-full" style={{ height: '98cqw', marginTop: '6cqw' }}>
        {/* soft glow so the black roses stand out on the dark background */}
        <div
          className="pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(248,113,113,0.35)_0%,rgba(127,29,29,0.25)_40%,transparent_70%)]"
          style={{ left: '-16cqw', top: '0cqw', width: '86cqw', height: '86cqw' }}
        />

        <motion.button
          type="button"
          onClick={music.toggle}
          aria-label={playing ? 'Tạm dừng' : 'Phát nhạc'}
          className="absolute cursor-pointer rounded-full"
          style={{ left: '49cqw', width: `${DISC}cqw`, height: `${DISC}cqw`, zIndex: 1 }}
          initial={false}
          animate={{ top: playing ? '8cqw' : '44cqw', rotate: playing ? 0 : -10 }}
          transition={{ type: 'spring', stiffness: 70, damping: 14 }}
        >
          <Disc spinning={playing} size={DISC} />
        </motion.button>

        <div className="absolute shadow-[0_14px_30px_rgba(0,0,0,0.5)]" style={{ ...sleeve, left: '47cqw', top: '41cqw', width: '40cqw', height: '48cqw', rotate: '4deg', zIndex: 2 }}>
          {/* washi tape */}
          <div className="absolute -top-[2cqw] left-[12cqw] h-[4.5cqw] w-[16cqw] rotate-[-6deg] bg-[#b91c1c]/55" />
          <div className="flex h-full flex-col text-[#3b1414]" style={{ padding: '7cqw 4cqw 5cqw 10cqw' }}>
            <span className="font-display tracking-[0.3em] uppercase" style={{ fontSize: '2.3cqw' }}>
              Side A
            </span>
            <span className="font-hand mt-[2cqw] leading-tight font-bold" style={{ fontSize: '5.4cqw' }}>
              {content.song.title}
            </span>
            <span className="font-display mt-[1.5cqw] italic text-[#7a1f1f]" style={{ fontSize: '3.2cqw' }}>
              {content.song.artist}
            </span>
            <svg viewBox="0 0 24 24" className="mt-auto fill-[#b91c1c]" style={{ width: '6cqw' }} aria-hidden>
              <path d="M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3.5-3 7-10 13Z" />
            </svg>
          </div>
        </div>

        <motion.button
          type="button"
          aria-label="Bó hoa tặng em"
          className="absolute cursor-pointer"
          style={{ left: '-6cqw', top: '0cqw', width: '64cqw', zIndex: 3, rotate: '-5deg' }}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => {
            sfx.hearts()
            haptics.soft()
            const box = e.currentTarget.getBoundingClientRect()
            const heart = confetti.shapeFromPath({ path: 'M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 3.5-3 7-10 13Z' })
            confetti({
              particleCount: 30,
              spread: 70,
              startVelocity: 22,
              origin: { x: (box.left + box.width / 2) / innerWidth, y: (box.top + box.height * 0.35) / innerHeight },
              colors: ['#B91C1C', '#7F1D1D', '#F5E6D3', '#1f1a1c'],
              shapes: [heart],
              scalar: 1.2,
            })
          }}
        >
          <img
            src="/scrapbook/parts/her-bouquet.webp"
            alt=""
            draggable={false}
            className="sway w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)] select-none"
            style={{ '--amp': '2.5deg', transformOrigin: '50% 100%', animationDuration: '4s' } as CSSProperties}
          />
          {/* little tag on the ribbon */}
          <span
            className="font-hand absolute bg-[#F5E6D3] text-[#9b1c24] shadow-md"
            style={{ left: '58%', top: '66%', fontSize: '3.6cqw', padding: '0.6cqw 2.4cqw', rotate: '12deg', borderRadius: '0.8cqw' }}
          >
            Hoa tặng em
          </span>
        </motion.button>
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
      </div>
    </section>
  )
}
