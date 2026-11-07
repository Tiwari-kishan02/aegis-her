import { Mic } from 'lucide-react'

export default function MicButton({ listening = false }) {
  return (
    <button
      type="button"
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-white/95 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-white/70 ${
        listening ? 'animate-pulse border-white' : 'border-white/60'
      }`}
      aria-label="Voice input"
      onClick={(event) => event.stopPropagation()}
    >
      <Mic className="h-5 w-5 text-slate-800" aria-hidden="true" />
    </button>
  )
}
