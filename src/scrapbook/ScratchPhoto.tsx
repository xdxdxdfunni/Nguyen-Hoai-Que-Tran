import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { scratch } from '../sound'
import { Photo } from './Photo'

const REVEAL_AT = 0.55 // fraction scratched before the rest falls away

// A photo hidden under a scratch-off coating. Rub it with a finger (or the mouse) to reveal it.
export function ScratchPhoto({ src, label, coating, onReveal, onOpen }: { src: string; label: string; coating: string; onReveal: () => void; onOpen: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [revealed, setRevealed] = useState(false)
  const drawing = useRef<{ x: number; y: number } | null>(null)

  // Paint the coating: warm silver foil with a little grain and a hint
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    const g = canvas.getContext('2d')
    if (!g) return
    const grad = g.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, '#d9d4cf')
    grad.addColorStop(0.45, '#b8b0aa')
    grad.addColorStop(0.55, '#e8e3de')
    grad.addColorStop(1, '#a9a09a')
    g.fillStyle = grad
    g.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < canvas.width * canvas.height * 0.02; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '90,80,78'},${Math.random() * 0.18})`
      g.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, dpr, dpr)
    }
    // Write the hint once the handwriting font is ready (canvas won't wait for it on its own)
    const font = `600 ${Math.round(canvas.width * 0.14)}px 'Dancing Script', cursive`
    void document.fonts.load(font).finally(() => {
      g.globalCompositeOperation = 'source-atop'
      g.fillStyle = 'rgba(122, 15, 27, 0.75)'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.font = font
      g.fillText(coating, canvas.width / 2, canvas.height / 2)
    })
  }, [coating])

  const progress = () => {
    const canvas = canvasRef.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return 0
    const { data } = g.getImageData(0, 0, canvas.width, canvas.height)
    let clear = 0
    let total = 0
    for (let i = 3; i < data.length; i += 4 * 37) {
      total++
      if (data[i] < 40) clear++
    }
    return clear / total
  }

  const rub = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const x = (clientX - rect.left) * sx
    const y = (clientY - rect.top) * sx
    const r = canvas.width * 0.11
    g.globalCompositeOperation = 'destination-out'
    g.lineCap = 'round'
    g.lineWidth = r * 2
    g.beginPath()
    const from = drawing.current ?? { x, y }
    g.moveTo(from.x, from.y)
    g.lineTo(x, y)
    g.stroke()
    scratch.move(Math.hypot(x - from.x, y - from.y) / sx)
    drawing.current = { x, y }
  }

  const finish = () => {
    drawing.current = null
    scratch.stop()
    if (!revealed && progress() > REVEAL_AT) {
      setRevealed(true)
      onReveal()
    }
  }

  return (
    <div className="relative size-full">
      <Photo src={src} label={label} />
      {revealed ? (
        <button type="button" aria-label="Xem ảnh" className="absolute inset-0 cursor-zoom-in" onClick={onOpen} />
      ) : null}
      <motion.canvas
        ref={canvasRef}
        className="absolute inset-0 size-full cursor-grab touch-none"
        animate={revealed ? { opacity: 0, scale: 1.1 } : { opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ pointerEvents: revealed ? 'none' : 'auto' }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          scratch.start()
          drawing.current = null
          rub(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'touch') {
            if (drawing.current) rub(e.clientX, e.clientY)
          }
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
    </div>
  )
}
