import { Link } from 'react-router-dom'
import { getToken } from '../services/api'
import AegisLogo from './AegisLogo'

export default function Header() {
  return (
    <header className="flex items-center gap-3 px-5 pt-5 pb-3">
      <AegisLogo className="h-11 w-11 text-aegis" />
      <div className="min-w-0 flex-1">
        <p className="text-[22px] font-bold leading-tight text-aegis">Aegis</p>
        <p className="text-xs text-slate-500">Her shield, wherever she goes.</p>
      </div>
      <Link to={getToken() ? '/contacts' : '/login'} className="text-xs font-bold text-aegis underline underline-offset-4">
        {getToken() ? 'Contacts' : 'Login'}
      </Link>
    </header>
  )
}
