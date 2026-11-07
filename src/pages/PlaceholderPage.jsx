import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AegisLogo from '../components/AegisLogo'

export default function PlaceholderPage({ title }) {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center bg-bg px-5 py-6 text-center">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-16 flex h-11 w-full items-center gap-2 text-left font-semibold text-aegis"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Back
      </button>
      <AegisLogo className="mb-6 h-20 w-20 text-aegis" />
      <h1 className="text-2xl font-bold text-aegis">{title}</h1>
      <p className="mt-2 text-slate-600">Coming in the next phase</p>
    </main>
  )
}
