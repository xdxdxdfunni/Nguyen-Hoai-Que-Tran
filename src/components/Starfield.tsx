// Twinkling stars and the occasional shooting star, fixed behind the page.

// Generated once at load so positions stay stable across re-renders.
const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() < 0.85 ? 1 + Math.random() : 2 + Math.random() * 1.5,
  blue: Math.random() < 0.3,
  duration: 2 + Math.random() * 4,
  delay: Math.random() * 5,
}))

export function Starfield() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {STARS.map((s) => (
        <span
          key={s.id}
          className={`absolute rounded-full ${s.blue ? 'bg-sky-300' : 'bg-white'}`}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            boxShadow: s.size > 2 ? `0 0 ${s.size * 3}px ${s.blue ? '#7dd3fc' : '#fff'}` : undefined,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <span className="shooting-star" style={{ top: '12%', left: '70%', animationDelay: '3s' }} />
      <span className="shooting-star" style={{ top: '35%', left: '95%', animationDelay: '9s' }} />
    </div>
  )
}
