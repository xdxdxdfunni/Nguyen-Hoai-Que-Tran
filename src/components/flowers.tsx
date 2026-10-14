// Flat 2D illustrated roses in black and blue.
// <FlowerShape> is an SVG group centred on 0,0 (radius ~48) for composing inside other SVGs;
// <Flower> wraps one in its own <svg>.

export type RoseColor = 'blue' | 'black'
export type FlowerType = `${RoseColor}${'Rose' | 'Bud' | 'Leaves'}`

const PALETTES = {
  blue: { p1: '#4A7BE0', p2: '#3566CF', p3: '#2652B5', p4: '#1B3F91', core: '#132E6E', rim: '#B4CCF7', edge: '#1D418F' },
  black: { p1: '#3A3E4A', p2: '#2C2F39', p3: '#202229', p4: '#17181E', core: '#0B0C10', rim: '#8D97AE', edge: '#0F1014' },
}
type Palette = (typeof PALETTES)[RoseColor]

const LEAF = { fill: '#2C4A57', vein: '#4C7282', edge: '#1F363F' }

const P = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`
}

// A rounded, slightly cupped petal pointing outward at angle `a`.
const petal = (R: number, a: number, w: number, r0 = 4) =>
  `M${P(r0, a - w * 0.6)}C${P(R * 0.75, a - w * 1.15)} ${P(R * 1.05, a - w * 0.55)} ${P(R, a)}C${P(R * 1.05, a + w * 0.55)} ${P(R * 0.75, a + w * 1.15)} ${P(r0, a + w * 0.6)}Z`

// The light, curled lip along a petal's outer edge.
const rim = (R: number, a: number, w: number) => `M${P(R * 0.86, a - w * 0.55)}Q${P(R * 1.04, a)} ${P(R * 0.86, a + w * 0.55)}`

const LAYERS = [
  { n: 5, R: 48, w: 40, offset: 8, tone: 'p1', rimOpacity: 0.75 },
  { n: 5, R: 40, w: 36, offset: 44, tone: 'p2', rimOpacity: 0.6 },
  { n: 5, R: 31, w: 34, offset: 20, tone: 'p3', rimOpacity: 0.35 },
] as const

// Cupped centre petals spiralling inward, each a bowl-shaped crescent.
const SPIRAL = Array.from({ length: 6 }, (_, k) => ({ r: 20 - k * 3.1, rot: 15 + k * 68, tone: (['p2', 'p4', 'p3', 'p4', 'p2', 'p4'] as const)[k] }))

function Bloom({ c }: { c: Palette }) {
  return (
    <g strokeLinejoin="round">
      {LAYERS.map(({ n, R, w, offset, tone, rimOpacity }) =>
        Array.from({ length: n }, (_, i) => {
          const a = offset + (i * 360) / n
          return (
            <g key={`${R}-${i}`}>
              <path d={petal(R, a, w)} fill={c[tone]} stroke={c.edge} strokeWidth=".5" />
              <path d={rim(R, a, w)} fill="none" stroke={c.rim} strokeWidth="1.2" strokeLinecap="round" opacity={rimOpacity} />
            </g>
          )
        }),
      )}
      <circle r="21" fill={c.p3} />
      {SPIRAL.map(({ r, rot, tone }) => (
        <g key={r} transform={`rotate(${rot})`}>
          <path d={`M${-r} 0A${r} ${r} 0 0 0 ${r} 0A${r} ${r * 0.55} 0 0 1 ${-r} 0Z`} fill={c[tone]} stroke={c.edge} strokeWidth=".4" />
          <path d={`M${-r * 0.92} 1A${r} ${r * 0.55} 0 0 0 ${r * 0.92} 1`} fill="none" stroke={c.rim} strokeWidth=".8" strokeLinecap="round" opacity=".4" />
        </g>
      ))}
      <circle r="2.6" fill={c.core} />
    </g>
  )
}

function Bud({ c }: { c: Palette }) {
  return (
    <g strokeLinejoin="round">
      <path d="M0 28V54" stroke={LEAF.fill} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M0 -36C16 -30 22 -8 16 14C12 26 -12 26 -16 14C-22 -8 -16 -30 0 -36Z" fill={c.p3} stroke={c.edge} strokeWidth=".6" />
      <path d="M-10 -24C-4 -34 8 -32 10 -22C4 -27 -4 -26 -10 -18Z" fill={c.p4} />
      <path d="M-6 -20C0 -25 6 -21 4 -14" fill="none" stroke={c.rim} strokeWidth=".9" strokeLinecap="round" opacity=".7" />
      <path d="M-2 30C-22 26 -28 4 -20 -16C-14 -2 -8 14 -2 30Z" fill={c.p1} stroke={c.edge} strokeWidth=".6" />
      <path d="M2 30C22 26 28 4 20 -16C14 -2 8 14 2 30Z" fill={c.p2} stroke={c.edge} strokeWidth=".6" />
      <path d="M-14 4C-10 20 10 20 14 4C14 18 8 30 0 30C-8 30 -14 18 -14 4Z" fill={c.p1} stroke={c.edge} strokeWidth=".6" />
      <g fill="none" stroke={c.rim} strokeLinecap="round">
        <path d="M-19 -12C-23 2 -19 16 -8 25" strokeWidth="1" opacity=".7" />
        <path d="M-11 6C-5 13 5 13 11 6" strokeWidth="1.2" opacity=".75" />
      </g>
      <g fill={LEAF.fill} stroke={LEAF.edge} strokeWidth=".6">
        <path d="M0 30C-6 36 -16 38 -24 33C-15 31 -7 27 0 24Z" />
        <path d="M0 30C6 36 16 38 24 33C15 31 7 27 0 24Z" />
      </g>
    </g>
  )
}

export function Leaf({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0C10 -12 30 -12 42 0C30 12 10 12 0 0Z" fill={LEAF.fill} stroke={LEAF.edge} strokeWidth=".7" />
      <path d="M3 0H36M14 0L20 -5M24 0L30 -4M14 0L20 5M24 0L30 4" fill="none" stroke={LEAF.vein} strokeWidth=".8" strokeLinecap="round" />
    </g>
  )
}

export function FlowerShape({ type }: { type: FlowerType }) {
  const color: RoseColor = type.startsWith('blue') ? 'blue' : 'black'
  const c = PALETTES[color]
  if (type.endsWith('Bud')) return <Bud c={c} />
  if (type.endsWith('Leaves'))
    return (
      <g>
        <Leaf x={22} y={20} rot={40} />
        <Leaf x={-24} y={16} rot={150} s={0.9} />
        <Leaf x={6} y={-30} rot={-80} s={0.8} />
        <Bloom c={c} />
      </g>
    )
  return <Bloom c={c} />
}

export function Flower({ type, className }: { type: FlowerType; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-56 -56 112 112" className={className} aria-hidden>
      <FlowerShape type={type} />
    </svg>
  )
}

const at = (x: number, y: number, s: number, type: FlowerType, rot = 0) => (
  <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <FlowerShape type={type} />
  </g>
)

/* A small bouquet of black and blue roses wrapped in white paper with a navy ribbon */
export function Bouquet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 170" className={className} overflow="visible" aria-hidden>
      <polygon points="14,58 106,58 70,160 50,160" fill="#CBD5E1" />
      <Leaf x={36} y={60} rot={-150} s={0.55} />
      <Leaf x={84} y={58} rot={-30} s={0.55} />
      <Leaf x={28} y={78} rot={-170} s={0.5} />
      <Leaf x={92} y={76} rot={-10} s={0.5} />
      {at(46, 18, 0.2, 'blackBud', -18)}
      {at(78, 16, 0.2, 'blueBud', 14)}
      {at(24, 40, 0.22, 'blueRose', 20)}
      {at(98, 38, 0.22, 'blackRose', 50)}
      {at(38, 52, 0.3, 'blackRose', 10)}
      {at(84, 50, 0.3, 'blueRose', 70)}
      {at(60, 36, 0.36, 'blueRose', 30)}
      {at(60, 64, 0.24, 'blackRose', 5)}
      <path d="M12 62L60 80L108 62L70 160H50Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth=".8" strokeLinejoin="round" />
      <path d="M60 80V160" stroke="#E2E8F0" strokeWidth=".8" />
      <g fill="#1E3A8A" stroke="#0F1A33" strokeWidth=".6">
        <path d="M60 120C48 110 38 114 42 122C45 128 54 126 60 120Z" />
        <path d="M60 120C72 110 82 114 78 122C75 128 66 126 60 120Z" />
        <path d="M58 121L50 144L55 141L57 147L61 122Z" />
        <path d="M62 121L70 144L65 141L63 147L59 122Z" />
        <ellipse cx="60" cy="121" rx="4" ry="3.4" />
      </g>
    </svg>
  )
}
