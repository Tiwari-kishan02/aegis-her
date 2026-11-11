import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api, getToken } from '../services/api'
import { signOut } from '../services/supabase'

export default function GlobalFooter() {
  const navigate = useNavigate()

  const deleteMyData = async () => {
    if (!getToken()) return

    try {
      await api('/me', { method: 'DELETE' })
      await signOut()
      navigate('/login')
    } catch {
      localStorage.removeItem('aegis_token')
      navigate('/login')
    }
  }

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-5 py-4 text-center text-xs text-slate-600">
      <div className="flex items-center justify-center gap-2 text-slate-700">
        <ShieldCheck className="h-4 w-4 text-aegis" aria-hidden="true" />
        <span>Privacy: Aegis stores your last known location to send alerts and share live help links with trusted contacts.</span>
      </div>
      <button type="button" onClick={deleteMyData} className="mt-3 font-bold text-sos underline underline-offset-2">
        Delete my data
      </button>
    </footer>
  )
}
