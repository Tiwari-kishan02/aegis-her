import { useNavigate } from 'react-router-dom'
import MicButton from './MicButton'

export default function BlockCard({ title, description, icon: Icon, color, to }) {
  const navigate = useNavigate()

  const openCard = () => navigate(to)

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openCard}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openCard()
        }
      }}
      className={`group flex min-h-[132px] cursor-pointer items-center justify-between rounded-lg px-5 py-5 text-white shadow-[0_10px_24px_rgba(76,29,149,0.12)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-aegis/20 ${color}`}
    >
      <span className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/20">
          <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="text-left">
          <span className="block text-xl font-bold">{title}</span>
          <span className="mt-1 block max-w-[190px] text-sm leading-5 text-white/90">{description}</span>
        </span>
      </span>
      <span
        className="shrink-0"
        onClick={(event) => event.stopPropagation()}
      >
        <MicButton />
      </span>
    </div>
  )
}
