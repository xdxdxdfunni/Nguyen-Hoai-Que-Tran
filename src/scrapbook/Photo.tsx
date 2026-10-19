// A photo (cropped a little toward the top so faces stay in frame), or a placeholder until one is added.
export function Photo({ src, label, className = '' }: { src: string; label: string; className?: string }) {
  if (src) return <img src={src} alt="" draggable={false} className={`size-full object-cover object-[50%_28%] select-none ${className}`} />
  return (
    <div
      className={`flex size-full items-center justify-center bg-[linear-gradient(135deg,#3b2a2a,#1c1414)] font-hand text-[3.2cqw] text-rose-100/70 ${className}`}
    >
      {label}
    </div>
  )
}
