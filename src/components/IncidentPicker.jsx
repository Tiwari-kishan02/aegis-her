import {
  BriefcaseBusiness,
  CarFront,
  Ellipsis,
  Eye,
  MessageSquareWarning,
  UserRound,
  UsersRound,
} from 'lucide-react'

const icons = {
  message: MessageSquareWarning,
  eye: Eye,
  briefcase: BriefcaseBusiness,
  car: CarFront,
  user: UserRound,
  users: UsersRound,
  ellipsis: Ellipsis,
}

export default function IncidentPicker({ incidents, selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {incidents.map((incident) => {
        const Icon = icons[incident.icon] || Ellipsis
        const selected = selectedId === incident.id
        return (
          <button
            key={incident.id}
            type="button"
            onClick={() => onSelect(incident)}
            aria-pressed={selected}
            className={`min-h-[112px] rounded-lg border p-3 text-left transition ${
              selected
                ? 'border-sos bg-red-50 shadow-[0_0_0_2px_rgba(239,68,68,0.18)]'
                : 'border-slate-200 bg-white'
            }`}
          >
            <Icon className={`mb-3 h-6 w-6 ${selected ? 'text-sos' : 'text-aegis'}`} aria-hidden="true" />
            <span className="block text-sm font-semibold leading-5 text-slate-800">{incident.label}</span>
          </button>
        )
      })}
    </div>
  )
}
