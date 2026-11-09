export default function StepIndicator({ step, total = 3, accent = 'bg-aegis' }) {
  return (
    <div className="mb-3 flex items-center gap-2" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i + 1 <= step ? accent : 'bg-white/35'}`}
        />
      ))}
    </div>
  )
}
