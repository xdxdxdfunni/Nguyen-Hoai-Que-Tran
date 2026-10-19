import type { CSSProperties } from 'react'
import { FlowerShape, Leaf } from './flowers'

const LINE = '#E7C9A9'

// The closed flap folds down to nothing, then the open flap unfolds upward —
// a 2D stand-in for a 3D flip.
const flip = (visible: boolean, origin: string, delay: number): CSSProperties => ({
  transformBox: 'fill-box',
  transformOrigin: origin,
  transform: visible ? 'scaleY(1)' : 'scaleY(0)',
  transition: `transform 0.35s ease-in-out ${delay}s`,
})

function WaxSeal() {
  const bumps = Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 * Math.PI) / 180
    return { x: 120 + 15.5 * Math.cos(a), y: 110 + 15.5 * Math.sin(a), r: 4 + (i % 3) * 0.6 }
  })
  return (
    <g>
      <g fill="url(#env-seal)">
        {bumps.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} />
        ))}
        <circle cx="120" cy="110" r="17" />
      </g>
      <circle cx="120" cy="110" r="11.5" fill="none" stroke="#6B6466" strokeWidth=".8" opacity=".9" />
      <path
        d="M120 117C114 113 112 109 114.5 106C116 104.5 118.6 104.8 120 107C121.4 104.8 124 104.5 125.5 106C128 109 126 113 120 117Z"
        fill="none"
        stroke="#E8D5C4"
        strokeWidth="1"
      />
      <path d="M110 101A14 14 0 0 1 118 97" fill="none" stroke="#8A8285" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
    </g>
  )
}

// A dried-flower sprig tucked under the seal.
function Sprig() {
  return (
    <g>
      <Leaf x={112} y={106} rot={-150} s={0.45} />
      <Leaf x={127} y={103} rot={-50} s={0.4} />
      <g transform="translate(103 92) rotate(-35) scale(.17)">
        <FlowerShape type="blackBud" />
      </g>
      <g transform="translate(136 94) rotate(20) scale(.16)">
        <FlowerShape type="redRose" />
      </g>
    </g>
  )
}

export function Envelope({ open = false, className }: { open?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 240 180" className={className} overflow="visible" aria-hidden>
      <defs>
        <linearGradient id="env-body" x1="0" y1="0" x2=".4" y2="1">
          <stop offset="0" stopColor="#8E1B22" />
          <stop offset="1" stopColor="#4A0A0F" />
        </linearGradient>
        <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A6232C" />
          <stop offset="1" stopColor="#6A1016" />
        </linearGradient>
        <radialGradient id="env-seal" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#4A4446" />
          <stop offset=".6" stopColor="#1C191A" />
          <stop offset="1" stopColor="#080707" />
        </radialGradient>
      </defs>

      {/* Open flap sits behind the envelope */}
      <path
        d="M12 32L120 -46L228 32Z"
        fill="url(#env-flap)"
        stroke={LINE}
        strokeWidth=".8"
        strokeLinejoin="round"
        style={flip(open, '50% 100%', 0.35)}
      />

      <rect x="10" y="30" width="220" height="140" rx="10" fill="url(#env-body)" stroke={LINE} strokeWidth="1" />

      {/* Letter rising out once open */}
      <rect
        x="30"
        y="40"
        width="180"
        height="110"
        rx="4"
        fill="#F6EFE4"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(-46px)' : 'none',
          transition: 'opacity 0.1s linear 0.5s, transform 0.6s ease-out 0.6s',
        }}
      />

      {/* Front pocket */}
      <path d="M10 36L106 108L10 168Z" fill="#741219" stroke={LINE} strokeWidth=".6" strokeLinejoin="round" />
      <path d="M230 36L134 108L230 168Z" fill="#741219" stroke={LINE} strokeWidth=".6" strokeLinejoin="round" />
      <path d="M12 170L120 94L228 170Z" fill="#82161E" stroke={LINE} strokeWidth=".6" strokeLinejoin="round" />
      <rect x="10" y="30" width="220" height="140" rx="10" fill="none" stroke={LINE} strokeWidth="1" />

      {/* Closed flap with seal */}
      <g style={flip(!open, '50% 0%', 0)}>
        <path d="M12 32L120 112L228 32Z" fill="url(#env-flap)" stroke={LINE} strokeWidth=".8" strokeLinejoin="round" />
        <path d="M30 38L120 104L210 38" fill="none" stroke="#fff" strokeWidth=".5" opacity=".18" />
        <Sprig />
        <WaxSeal />
      </g>
    </svg>
  )
}
