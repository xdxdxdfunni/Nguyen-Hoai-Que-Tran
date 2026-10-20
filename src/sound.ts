// Sound effects and the music box are synthesised with the Web Audio API; the song and his voice are audio files.
// Browsers only allow sound after a tap, so call unlockAudio() from the first tap handler.

import { content } from './content'

let ctx: AudioContext | null = null
let master: GainNode
let sfxBus: GainNode
let musicBus: GainNode
let reverb: ConvolverNode
let noise: AudioBuffer
// Mute lasts for this visit only, so an accidental tap never silences the gift for good
let muted = false
const listeners = new Set<(muted: boolean) => void>()

function setup() {
  if (ctx) return ctx
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 0.85
  master.connect(ctx.destination)

  // A soft room: decaying noise as an impulse response
  reverb = ctx.createConvolver()
  const len = ctx.sampleRate * 2.4
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  }
  reverb.buffer = ir
  const wet = ctx.createGain()
  wet.gain.value = 0.35
  reverb.connect(wet).connect(master)

  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.55
  sfxBus.connect(master)
  sfxBus.connect(reverb)

  musicBus = ctx.createGain()
  musicBus.gain.value = 0.22
  musicBus.connect(master)
  musicBus.connect(reverb)

  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const nd = noise.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
  return ctx
}

export function unlockAudio() {
  const c = setup()
  if (c.state === 'suspended') void c.resume()
}

export function isMuted() {
  return muted
}

export function setMuted(next: boolean) {
  muted = next
  if (ctx) master.gain.setTargetAtTime(next ? 0 : 0.85, ctx.currentTime, 0.05)
  if (song) song.muted = next
  if (voiceEl) voiceEl.muted = next
  listeners.forEach((fn) => fn(next))
}

export function onMutedChange(fn: (muted: boolean) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// ---------- building blocks ----------
type ToneOpts = { type?: OscillatorType; gain?: number; attack?: number; release?: number; to?: number; bus?: GainNode }

function tone(freq: number, when: number, dur: number, opts: ToneOpts = {}) {
  if (!ctx) return
  const { type = 'sine', gain = 0.3, attack = 0.005, release = dur, to, bus = sfxBus } = opts
  const t = ctx.currentTime + when
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release)
  osc.connect(g).connect(bus)
  osc.start(t)
  osc.stop(t + attack + release + 0.05)
}

type NoiseOpts = { filter?: BiquadFilterType; freq?: number; to?: number; q?: number; gain?: number; attack?: number }

function hiss(when: number, dur: number, opts: NoiseOpts = {}) {
  if (!ctx) return
  const { filter = 'bandpass', freq = 2000, to, q = 1, gain = 0.3, attack = 0.01 } = opts
  const t = ctx.currentTime + when
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = filter
  f.frequency.setValueAtTime(freq, t)
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur)
  f.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(sfxBus)
  src.start(t, Math.random() * 0.5)
  src.stop(t + dur + 0.05)
}

// Don't stack the same effect many times in one instant
const lastPlayed: Record<string, number> = {}
function throttle(name: string, ms: number) {
  const now = performance.now()
  if (now - (lastPlayed[name] ?? 0) < ms) return false
  lastPlayed[name] = now
  return true
}

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12) // MIDI note → Hz

// ---------- effects ----------
export const sfx = {
  key() {
    tone(1250, 0, 0.05, { type: 'triangle', gain: 0.12 })
    hiss(0, 0.03, { filter: 'highpass', freq: 4000, gain: 0.05 })
  },
  error() {
    tone(196, 0, 0.18, { type: 'triangle', gain: 0.22 })
    tone(165, 0.16, 0.25, { type: 'triangle', gain: 0.22 })
  },
  unlock() {
    ;[76, 79, 83, 88].forEach((n, i) => tone(NOTE(n), i * 0.09, 1.2, { gain: 0.16 }))
  },
  envelope() {
    // paper rustle as the flap lifts, then a soft swell
    hiss(0, 0.45, { freq: 2600, q: 0.8, gain: 0.18 })
    hiss(0.18, 0.35, { freq: 3800, q: 1.2, gain: 0.1 })
    tone(NOTE(64), 0.3, 1.4, { type: 'sine', gain: 0.08, attack: 0.3 })
  },
  bloom() {
    hiss(0, 1.6, { filter: 'lowpass', freq: 300, to: 4000, q: 0.7, gain: 0.22, attack: 0.4 })
    ;[72, 76, 79, 83, 84, 88, 91].forEach((n, i) => tone(NOTE(n), 0.25 + i * 0.13, 1.6, { gain: 0.09 }))
  },
  paper() {
    if (!throttle('paper', 60)) return
    hiss(0, 0.16, { freq: 1800 + Math.random() * 800, q: 0.9, gain: 0.12 })
    tone(140, 0, 0.08, { gain: 0.08 })
  },
  pop() {
    if (!throttle('pop', 45)) return
    tone(700 + Math.random() * 300, 0, 0.09, { to: 320, gain: 0.14 })
  },
  sparkle() {
    if (!throttle('sparkle', 80)) return
    ;[84, 88, 91].forEach((n, i) => tone(NOTE(n + (Math.random() < 0.5 ? 0 : 2)), i * 0.06, 0.6, { gain: 0.07 }))
  },
  shutter() {
    hiss(0, 0.025, { filter: 'highpass', freq: 3000, gain: 0.35, attack: 0.001 })
    tone(90, 0, 0.05, { type: 'square', gain: 0.06 })
    hiss(0.08, 0.03, { filter: 'highpass', freq: 2500, gain: 0.25, attack: 0.001 })
    // the little motor pushing the print out
    hiss(0.2, 0.7, { freq: 900, q: 4, gain: 0.05, attack: 0.05 })
  },
  flip() {
    hiss(0, 0.3, { freq: 1500, to: 3500, q: 0.7, gain: 0.14 })
  },
  hearts() {
    ;[79, 83, 86].forEach((n, i) => tone(NOTE(n), i * 0.07, 0.5, { type: 'triangle', gain: 0.08 }))
  },
  petals() {
    // a soft falling shimmer as the roses drift away
    hiss(0, 1.8, { filter: 'lowpass', freq: 4000, to: 250, q: 0.6, gain: 0.14, attack: 0.2 })
    ;[91, 88, 84, 83, 79, 76].forEach((n, i) => tone(NOTE(n), 0.1 + i * 0.16, 1.4, { gain: 0.06 }))
  },
  flutter() {
    for (let i = 0; i < 5; i++) hiss(i * 0.06, 0.05, { freq: 1200, q: 2, gain: 0.06 })
  },
}

// Continuous scratching noise while a finger moves across a scratch card
let scratchGain: GainNode | null = null
let scratchSrc: AudioBufferSourceNode | null = null
export const scratch = {
  start() {
    if (!ctx || scratchSrc) return
    scratchSrc = ctx.createBufferSource()
    scratchSrc.buffer = noise
    scratchSrc.loop = true
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 3200
    f.Q.value = 0.6
    scratchGain = ctx.createGain()
    scratchGain.gain.value = 0
    scratchSrc.connect(f).connect(scratchGain).connect(sfxBus)
    scratchSrc.start()
  },
  move(speed: number) {
    if (!ctx || !scratchGain) return
    scratchGain.gain.setTargetAtTime(Math.min(0.12, speed * 0.004), ctx.currentTime, 0.02)
    scratchGain.gain.setTargetAtTime(0, ctx.currentTime + 0.06, 0.05)
  },
  stop() {
    if (!ctx || !scratchSrc) return
    scratchGain?.gain.setTargetAtTime(0, ctx.currentTime, 0.03)
    scratchSrc.stop(ctx.currentTime + 0.2)
    scratchSrc = null
    scratchGain = null
  },
}

// ---------- background music ----------
// The song from content.ts (an mp3) if there is one, otherwise a built-in music box.
// The CD player on the page controls it; it starts when the envelope is opened.

let song: HTMLAudioElement | null = null
let boxTimer: number | undefined
let playing = false
const musicListeners = new Set<() => void>()
const notifyMusic = () => musicListeners.forEach((fn) => fn())

// An original, slow music-box tune (Am – F – C – G), looping.
const CHORDS = [
  [57, 60, 64, 69],
  [53, 57, 60, 65],
  [48, 55, 60, 64],
  [55, 59, 62, 67],
]
const MELODY = [76, 0, 74, 72, 74, 0, 72, 69, 72, 0, 71, 72, 74, 0, 71, 67]

function startBox() {
  if (!ctx || boxTimer !== undefined) return
  const beat = 60 / 66 / 2 // eighth notes at 66 bpm
  let step = 0
  let next = ctx.currentTime + 0.2
  const schedule = () => {
    if (!ctx) return
    while (next < ctx.currentTime + 0.4) {
      const when = next - ctx.currentTime
      const chord = CHORDS[Math.floor(step / 8) % CHORDS.length]
      const box = { gain: 0.16, release: 1.6, bus: musicBus }
      tone(NOTE(chord[step % 4]), when, 1.6, box)
      tone(NOTE(chord[step % 4] + 12), when, 0.8, { ...box, gain: 0.04 }) // bell-like overtone
      const m = MELODY[step % MELODY.length]
      if (m && step % 2 === 0) tone(NOTE(m), when, 2, { ...box, gain: 0.13, release: 2 })
      step++
      next += beat
    }
  }
  schedule()
  boxTimer = window.setInterval(schedule, 120)
}

function stopBox() {
  window.clearInterval(boxTimer)
  boxTimer = undefined
}

export const music = {
  play() {
    unlockAudio()
    if (content.song.src) {
      if (!song) {
        song = new Audio(content.song.src)
        song.loop = true
        song.preload = 'auto'
        song.volume = 0.75
        song.addEventListener('ended', notifyMusic)
      }
      song.muted = muted
      void song.play().catch(() => {
        playing = false
        notifyMusic()
      })
    } else {
      startBox()
    }
    playing = true
    notifyMusic()
  },
  pause() {
    song?.pause()
    stopBox()
    playing = false
    notifyMusic()
  },
  toggle() {
    if (playing) music.pause()
    else music.play()
  },
  // Pause the song while his voice reads the letter, then carry on. (Pausing rather than turning it
  // down, because iPhones don't let a web page change an audio element's volume.)
  hold(on: boolean) {
    if (on) {
      song?.pause()
      stopBox()
    } else if (playing) {
      if (song) void song.play().catch(() => {})
      else startBox()
    }
  },
  isPlaying: () => playing,
  hasSong: () => Boolean(content.song.src),
  // Position in the song, in seconds (0/0 for the music box)
  time: () => ({ current: song?.currentTime ?? 0, duration: song && Number.isFinite(song.duration) ? song.duration : 0 }),
  seek(fraction: number) {
    if (song && Number.isFinite(song.duration)) song.currentTime = fraction * song.duration
  },
  subscribe(fn: () => void) {
    musicListeners.add(fn)
    return () => {
      musicListeners.delete(fn)
    }
  },
}

// ---------- his voice reading the letter ----------
// iPhones only let audio start directly inside a tap. So the recording is "primed" during the
// envelope tap (played silently for an instant) and started inside the tap that opens the letter.

let voiceEl: HTMLAudioElement | null = null
let voicePrimed = false
let voiceStarted = false

function voiceElement() {
  if (!voiceEl && content.letterVoice) {
    voiceEl = new Audio(content.letterVoice)
    voiceEl.preload = 'auto'
    voiceEl.setAttribute('playsinline', '')
  }
  return voiceEl
}

export const voice = {
  element: voiceElement,
  prime() {
    const el = voiceElement()
    if (!el || voicePrimed) return
    voicePrimed = true
    el.muted = true
    void el
      .play()
      .then(() => {
        if (voiceStarted) return
        el.pause()
        el.currentTime = 0
      })
      .catch(() => {})
      .finally(() => {
        if (!voiceStarted) el.muted = muted
      })
  },
  // Call from inside a tap
  start() {
    const el = voiceElement()
    if (!el) return
    voiceStarted = true
    el.muted = muted
    if (el.ended) el.currentTime = 0
    music.hold(true)
    void el.play().catch(() => music.hold(false))
  },
  stop() {
    if (!voiceEl) return
    voiceEl.pause()
    voiceEl.currentTime = 0
    voiceStarted = false
    music.hold(false)
  },
}
