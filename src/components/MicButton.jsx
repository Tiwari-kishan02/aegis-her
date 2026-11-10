import { Mic } from 'lucide-react'

const languageOptions = [
  { value: 'hi-IN', label: 'HI' },
  { value: 'en-IN', label: 'EN' },
  { value: 'mr-IN', label: 'MR' },
]

export default function MicButton({
  listening = false,
  transcript = '',
  supported = true,
  language = 'hi-IN',
  onToggle,
  onLanguageChange,
}) {
  if (!supported) {
    return (
      <span className="text-[10px] font-medium text-slate-500">
        Type instead
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-white/95 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-white/70 ${
          listening ? 'animate-pulse border-white' : 'border-white/60'
        }`}
        aria-label="Voice input"
        onClick={(event) => {
          event.stopPropagation()
          onToggle?.()
        }}
      >
        <Mic className="h-5 w-5 text-slate-800" aria-hidden="true" />
      </button>

      <div className="flex gap-1 rounded-full bg-white/20 p-1">
        {languageOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onLanguageChange?.(option.value)
            }}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              language === option.value ? 'bg-white text-slate-900' : 'text-white/90'
            }`}
            aria-label={`Set voice language to ${option.label}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {transcript && (
        <span className="max-w-[110px] truncate text-[10px] text-white/80">
          {transcript}
        </span>
      )}
    </div>
  )
}
