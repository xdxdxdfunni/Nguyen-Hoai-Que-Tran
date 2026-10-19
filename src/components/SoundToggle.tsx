import { useEffect, useState } from 'react'
import { isMuted, onMutedChange, setMuted, unlockAudio } from '../sound'

// Small speaker button in the corner to turn all sound on or off.
export function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted)
  useEffect(() => onMutedChange(setMutedState), [])

  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio()
        setMuted(!muted)
      }}
      aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      className="fixed top-2.5 left-2.5 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-[#F5E6D3] backdrop-blur-sm transition-colors hover:bg-black/55"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" fillOpacity=".15" />
        {muted ? <path d="m16 9 5 6M21 9l-5 6" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />}
      </svg>
    </button>
  )
}
